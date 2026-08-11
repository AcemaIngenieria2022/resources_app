-- Migration: add user_statuses lookup table and link users.status_id
CREATE TABLE IF NOT EXISTS user_statuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO user_statuses (name, label)
VALUES
  ('active', 'Activo'),
  ('suspended', 'Suspendido'),
  ('disabled', 'Desactivado');

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status_id INT NULL AFTER status;

UPDATE users
SET status = CASE
  WHEN LOWER(status) = 'inactive' THEN 'disabled'
  WHEN LOWER(status) IN ('active', 'suspended', 'disabled') THEN LOWER(status)
  ELSE 'active'
END
WHERE status IS NOT NULL;

UPDATE users u
JOIN user_statuses s ON LOWER(u.status) = s.name
SET u.status_id = s.id
WHERE u.status IS NOT NULL;

ALTER TABLE users
  ADD CONSTRAINT fk_users_status_id FOREIGN KEY (status_id)
  REFERENCES user_statuses(id)
  ON DELETE SET NULL;
