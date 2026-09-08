ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS rejection_observation VARCHAR(1000) NULL;
