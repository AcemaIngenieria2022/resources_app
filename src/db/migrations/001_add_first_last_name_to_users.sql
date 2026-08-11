-- Migration: add first_name and last_name to users
ALTER TABLE users
  ADD COLUMN first_name VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN last_name VARCHAR(100) NOT NULL DEFAULT '';

-- Optional: set defaults for existing admin users
-- UPDATE users SET first_name = 'Admin', last_name = 'User' WHERE email = 'ti@acemaingenieria.com';
