ALTER TABLE leave_requests
  ADD COLUMN attachment_url VARCHAR(255) NULL,
  ADD COLUMN leader_id INT NULL,
  ADD INDEX idx_leave_requests_leader_id (leader_id),
  ADD CONSTRAINT fk_leave_requests_leader
    FOREIGN KEY (leader_id) REFERENCES leaders(id) ON DELETE SET NULL;
