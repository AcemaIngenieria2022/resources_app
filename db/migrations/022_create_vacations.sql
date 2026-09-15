-- Registro central de vacaciones, sin reemplazar las solicitudes ni novedades de origen.
CREATE TABLE IF NOT EXISTS vacations (
  id INT(11) NOT NULL AUTO_INCREMENT,
  employee_id INT(11) NOT NULL,
  source_type ENUM('leave_request', 'manual_record', 'manual_series') NOT NULL,
  source_id INT(11) NOT NULL,
  leave_class VARCHAR(120) NOT NULL DEFAULT 'Vacaciones',
  request_type ENUM('days', 'hours') NOT NULL DEFAULT 'days',
  vacation_payment_type VARCHAR(32) NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days DECIMAL(5,2) NULL,
  state_id INT(11) NULL,
  approval_flow ENUM('workflow', 'direct') NOT NULL DEFAULT 'workflow',
  leader_approved TINYINT(1) NOT NULL DEFAULT 0,
  leader_approved_at DATETIME NULL,
  leader_approved_by_name VARCHAR(150) NULL,
  hr_approved TINYINT(1) NOT NULL DEFAULT 0,
  hr_approved_at DATETIME NULL,
  hr_approved_by_name VARCHAR(150) NULL,
  all_flows_approved TINYINT(1) AS (
    CASE
      WHEN approval_flow = 'direct' THEN 1
      WHEN leader_approved = 1 AND hr_approved = 1 THEN 1
      ELSE 0
    END
  ) STORED,
  completed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vacations_source (source_type, source_id),
  KEY idx_vacations_employee_dates (employee_id, start_date, end_date),
  KEY idx_vacations_approval (all_flows_approved, end_date),
  CONSTRAINT fk_vacations_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_vacations_state
    FOREIGN KEY (state_id) REFERENCES state(id) ON DELETE SET NULL,
  CONSTRAINT fk_vacations_payment_type
    FOREIGN KEY (vacation_payment_type) REFERENCES vacation_payment_types(code) ON DELETE SET NULL,
  CONSTRAINT chk_vacations_dates CHECK (end_date >= start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Migra las solicitudes de vacaciones que ya existen en el flujo de aprobación.
INSERT INTO vacations (
  employee_id,
  source_type,
  source_id,
  leave_class,
  request_type,
  vacation_payment_type,
  start_date,
  end_date,
  total_days,
  state_id,
  approval_flow,
  leader_approved,
  leader_approved_at,
  leader_approved_by_name,
  hr_approved,
  hr_approved_at,
  hr_approved_by_name,
  completed_at
)
SELECT
  lr.employee_id,
  'leave_request',
  lr.id,
  lr.leave_class,
  lr.permission_type,
  lr.vacation_payment_type,
  lr.start_date,
  lr.end_date,
  lr.total_days,
  lr.state_id,
  'workflow',
  CASE WHEN st.code IN ('leader_approved', 'hr_pending', 'hr_approved', 'completed') THEN 1 ELSE 0 END,
  NULL,
  NULL,
  CASE WHEN st.code IN ('hr_approved', 'completed') THEN 1 ELSE 0 END,
  CASE WHEN st.code IN ('hr_approved', 'completed') THEN lr.created_at ELSE NULL END,
  NULL,
  CASE WHEN st.code = 'completed' THEN lr.created_at ELSE NULL END
FROM leave_requests lr
INNER JOIN state st ON st.id = lr.state_id
WHERE lr.leave_class = 'Vacaciones'
  AND lr.start_date IS NOT NULL
  AND lr.end_date IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM vacations v
    WHERE v.source_type = 'leave_request'
      AND v.source_id = lr.id
  );

-- Migra las novedades manuales de vacaciones registradas desde /absence/manage.
INSERT INTO vacations (
  employee_id,
  source_type,
  source_id,
  leave_class,
  request_type,
  start_date,
  end_date,
  total_days,
  approval_flow,
  leader_approved,
  hr_approved,
  completed_at
)
SELECT
  r.employee_id,
  'manual_record',
  r.id,
  'Vacaciones',
  CASE WHEN r.start_time IS NOT NULL THEN 'hours' ELSE 'days' END,
  r.absence_date,
  r.absence_date,
  1,
  'direct',
  1,
  1,
  r.created_at
FROM employee_absence_records r
WHERE LOWER(TRIM(r.reason)) = 'vacaciones'
  AND NOT EXISTS (
    SELECT 1
    FROM vacations v
    WHERE v.source_type = 'manual_record'
      AND v.source_id = r.id
  );

INSERT INTO vacations (
  employee_id,
  source_type,
  source_id,
  leave_class,
  request_type,
  start_date,
  end_date,
  total_days,
  approval_flow,
  leader_approved,
  hr_approved,
  completed_at
)
SELECT
  s.employee_id,
  'manual_series',
  s.id,
  'Vacaciones',
  'days',
  s.start_date,
  s.end_date,
  DATEDIFF(s.end_date, s.start_date) + 1,
  'direct',
  1,
  1,
  s.created_at
FROM absence_series s
WHERE LOWER(TRIM(s.reason)) = 'vacaciones'
  AND NOT EXISTS (
    SELECT 1
    FROM vacations v
    WHERE v.source_type = 'manual_series'
      AND v.source_id = s.id
  );
