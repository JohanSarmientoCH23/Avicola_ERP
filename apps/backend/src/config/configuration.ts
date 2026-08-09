export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'avicola_jwt_secret',
    expiration: process.env.JWT_EXPIRATION || '24h',
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY || 'avicola_minio',
    secretKey: process.env.MINIO_SECRET_KEY || 'avicola_minio_secret_2026',
    bucket: process.env.MINIO_BUCKET || 'avicola-files',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
});
