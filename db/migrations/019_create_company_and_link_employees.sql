CREATE TABLE IF NOT EXISTS company (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  city VARCHAR(100) DEFAULT NULL,
  address VARCHAR(255) DEFAULT NULL,
  color CHAR(7) NOT NULL DEFAULT '#36BBA7',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE company
  ADD COLUMN IF NOT EXISTS color CHAR(7) NOT NULL DEFAULT '#36BBA7' AFTER address;

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER department_id,
  ADD KEY IF NOT EXISTS idx_employees_company_id (company_id);

SET @company_fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'employees'
    AND CONSTRAINT_NAME = 'fk_employees_company'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @company_fk_sql = IF(
  @company_fk_exists = 0,
  'ALTER TABLE employees ADD CONSTRAINT fk_employees_company FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);

PREPARE company_fk_statement FROM @company_fk_sql;
EXECUTE company_fk_statement;
DEALLOCATE PREPARE company_fk_statement;
