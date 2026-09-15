CREATE TABLE IF NOT EXISTS vacation_payment_types (
  id INT(11) NOT NULL AUTO_INCREMENT,
  code VARCHAR(32) NOT NULL,
  name VARCHAR(120) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vacation_payment_type_code (code),
  UNIQUE KEY uq_vacation_payment_type_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO vacation_payment_types (code, name) VALUES
  ('time', 'Tiempo completo'),
  ('money', 'Compensación monetaria'),
  ('time_money', 'Tiempo y compensación monetaria')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  active = 1;
