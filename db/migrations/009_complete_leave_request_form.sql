-- Completa leave_requests para el formulario público de novedades.
-- leader_id ya existe en la tabla actual y no se vuelve a agregar.

ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS permission_type ENUM('days', 'hours') NOT NULL DEFAULT 'days',
  ADD COLUMN IF NOT EXISTS start_date DATE NULL,
  ADD COLUMN IF NOT EXISTS end_date DATE NULL,
  ADD COLUMN IF NOT EXISTS permission_date DATE NULL,
  ADD COLUMN IF NOT EXISTS total_days DECIMAL(5,2) NULL,
  ADD COLUMN IF NOT EXISTS total_hours DECIMAL(5,2) NULL,
  ADD COLUMN IF NOT EXISTS start_time TIME NULL,
  ADD COLUMN IF NOT EXISTS end_time TIME NULL,
  ADD COLUMN IF NOT EXISTS reason VARCHAR(500) NULL;
