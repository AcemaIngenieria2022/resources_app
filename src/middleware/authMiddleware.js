export const authMiddleware = (req, res, next) => {
  if (!req) {
    return next?.();
  }

  return next?.();
};

export default authMiddleware;
