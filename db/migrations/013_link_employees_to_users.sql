ALTER TABLE employees
  ADD COLUMN user_id INT NULL,
  ADD UNIQUE KEY uq_employees_user_id (user_id),
  ADD CONSTRAINT fk_employees_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;