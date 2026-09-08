-- Permite registrar novedades parciales durante un día.
ALTER TABLE employee_absence_records
  ADD COLUMN IF NOT EXISTS start_time TIME NULL,
  ADD COLUMN IF NOT EXISTS end_time TIME NULL;