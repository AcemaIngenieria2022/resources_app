// Middleware ligero de autenticación que delega el flujo de la petición al handler recibido.
export const authMiddleware = (handler) => {
  return async (request, ...args) => {
    if (!request?.headers?.get) {
      return handler(request, ...args);
    }

    return handler(request, ...args);
  };
};

export default authMiddleware;
