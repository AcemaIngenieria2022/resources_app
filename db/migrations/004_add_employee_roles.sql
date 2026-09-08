INSERT IGNORE INTO roles (name, description)
VALUES ('collaborator', 'Registered application collaborator');

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS role_id INT NULL AFTER position_id,
  ADD KEY IF NOT EXISTS fk_employees_role (role_id);

UPDATE employees e
JOIN roles r ON r.name = 'collaborator'
SET e.role_id = r.id
WHERE e.role_id IS NULL;

ALTER TABLE employees
  ADD CONSTRAINT fk_employees_role FOREIGN KEY (role_id)
  REFERENCES roles(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;