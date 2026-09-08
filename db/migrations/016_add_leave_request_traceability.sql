ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS leader_approved_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS leader_approved_by_name VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS completed_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS completed_by_name VARCHAR(150) NULL,
  ADD KEY IF NOT EXISTS idx_leave_requests_traceability (leader_approved_at, completed_at, rejected_at);
