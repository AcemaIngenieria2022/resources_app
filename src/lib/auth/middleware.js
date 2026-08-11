export const authMiddleware = (handler) => {
  return async (request, ...args) => {
    if (!request?.headers?.get) {
      return handler(request, ...args);
    }

    return handler(request, ...args);
  };
};

export default authMiddleware;
