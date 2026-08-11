export function okResponse(data, meta = {}) {
  return {
    success: true,
    data,
    meta,
  };
}

export function errorResponse(message, status = 500) {
  return {
    success: false,
    error: message,
    status,
  };
}
