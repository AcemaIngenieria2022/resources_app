ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS rejected_by_user_id INT NULL,
  ADD COLUMN IF NOT EXISTS rejected_by_name VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS rejected_by_role VARCHAR(30) NULL,
  ADD COLUMN IF NOT EXISTS rejected_at DATETIME NULL,
  ADD KEY IF NOT EXISTS idx_leave_requests_rejected_by (rejected_by_user_id);
