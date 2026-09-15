-- Identidad estable de Microsoft Entra ID para autenticación corporativa.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS microsoft_oid VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(32) NOT NULL DEFAULT 'local',
  ADD UNIQUE KEY IF NOT EXISTS uq_users_microsoft_oid (microsoft_oid);
