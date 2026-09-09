// Servicio placeholder para aprobar o rechazar elementos del flujo de validaciones.
export const approvalService = {
  list: async () => [],
  approve: async () => ({ success: true }),
  reject: async () => ({ success: true }),
};

export default approvalService;
