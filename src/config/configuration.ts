export default () => ({
    port: parseInt(process.env.PORT || '3001', 10),
    database: {
      url: process.env.DATABASE_URL,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
    throttle: {
      ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
      limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
    },
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    },
  });
