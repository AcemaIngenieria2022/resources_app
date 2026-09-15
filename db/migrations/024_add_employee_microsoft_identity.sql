-- Identidad corporativa y autorización principal del colaborador.
-- employees.role_id ya referencia la tabla roles y employees.active controla el acceso.
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS corporate_email VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS microsoft_oid VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(32) NOT NULL DEFAULT 'local',
  ADD UNIQUE KEY IF NOT EXISTS uq_employees_corporate_email (corporate_email),
  ADD UNIQUE KEY IF NOT EXISTS uq_employees_microsoft_oid (microsoft_oid);

-- Copia correos existentes de cuentas vinculadas para iniciar la transición.
UPDATE employees e
INNER JOIN users u ON u.id = e.user_id
SET e.corporate_email = LOWER(TRIM(u.email))
WHERE e.corporate_email IS NULL
  AND u.email IS NOT NULL;
