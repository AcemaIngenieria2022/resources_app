// Error de negocio personalizado para propagación clara de fallos dentro de servicios y rutas.
export class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }
}

export default AppError;
