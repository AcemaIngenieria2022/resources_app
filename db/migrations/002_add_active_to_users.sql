-- Migration: add active status to users
ALTER TABLE users
  ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1;

-- Optional: mark existing users active by default
UPDATE users SET active = 1 WHERE active IS NULL;