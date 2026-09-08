ALTER TABLE leave_requests
  ADD COLUMN permission_type ENUM('days', 'hours') NOT NULL DEFAULT 'days',
  ADD COLUMN start_date DATE NULL,
  ADD COLUMN end_date DATE NULL,
  ADD COLUMN permission_date DATE NULL,
  ADD COLUMN total_days DECIMAL(5,2) NULL,
  ADD COLUMN start_time TIME NULL,
  ADD COLUMN end_time TIME NULL,
  ADD COLUMN reason VARCHAR(500) NULL;
