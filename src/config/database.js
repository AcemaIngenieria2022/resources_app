// Configuración principal de la base de datos del sistema.
export const databaseConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  name: process.env.DB_NAME || 'thirdpartydb',
  dialect: 'mysql',
};

// Configuración opcional para la base de datos de logs/attlog, reutilizando los parámetros base cuando no se especifican.
export const attlogDatabaseConfig = {
  host: process.env.ATTLOG_DB_HOST || databaseConfig.host,
  port: process.env.ATTLOG_DB_PORT || databaseConfig.port,
  user: process.env.ATTLOG_DB_USER || databaseConfig.user,
  password: process.env.ATTLOG_DB_PASSWORD ?? databaseConfig.password,
  name: process.env.ATTLOG_DB_NAME || databaseConfig.name,
  dialect: 'mysql',
};

export default databaseConfig;
