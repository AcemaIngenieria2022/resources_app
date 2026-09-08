-- Estados del flujo de solicitudes de novedades.
CREATE TABLE IF NOT EXISTS state (
  id INT(11) NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(120) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_state_code (code),
  UNIQUE KEY uq_state_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO state (code, name) VALUES
  ('created', 'Creado'),
  ('leader_pending', 'Pendiente líder'),
  ('leader_approved', 'Aprobado líder'),
  ('leader_rejected', 'Rechazado líder'),
  ('hr_pending', 'Pendiente RRHH'),
  ('hr_approved', 'Aprobado RRHH'),
  ('hr_rejected', 'Rechazado RRHH'),
  ('completed', 'Finalizada'),
  ('expired', 'Vencida')
ON DUPLICATE KEY UPDATE name = VALUES(name), active = 1;

ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS state_id INT(11) NULL,
  ADD KEY IF NOT EXISTS idx_leave_requests_state (state_id),
  ADD CONSTRAINT fk_leave_requests_state
    FOREIGN KEY (state_id) REFERENCES state(id) ON DELETE SET NULL;

UPDATE leave_requests
SET state_id = (SELECT id FROM state WHERE code = 'created' LIMIT 1)
WHERE state_id IS NULL;
