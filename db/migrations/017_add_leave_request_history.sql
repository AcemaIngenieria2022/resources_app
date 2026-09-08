CREATE TABLE IF NOT EXISTS leave_request_history (
  id INT(11) NOT NULL AUTO_INCREMENT,
  leave_request_id INT(11) NOT NULL,
  action VARCHAR(50) NOT NULL,
  from_state VARCHAR(50) NULL,
  to_state VARCHAR(50) NULL,
  user_id INT(11) NULL,
  user_name VARCHAR(150) NULL,
  role VARCHAR(50) NULL,
  observation TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_leave_request_history_leave_request_id (leave_request_id, created_at),
  KEY idx_leave_request_history_action (action),
  CONSTRAINT fk_leave_request_history_leave_request
    FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
