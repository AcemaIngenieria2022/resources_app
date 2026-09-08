-- La tabla leave_requests ya contiene leader_id.
-- Ejecutar solo si esta restricción todavía no existe.
ALTER TABLE leave_requests
  ADD CONSTRAINT fk_leave_requests_leader
  FOREIGN KEY (leader_id) REFERENCES leaders(id)
  ON DELETE SET NULL;
