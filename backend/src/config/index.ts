export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/talentbridge',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change_this_secret_in_production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'change_this_refresh_secret',
    accessTokenTTL: process.env.ACCESS_TOKEN_TTL || '15m',
    refreshTokenTTL: process.env.REFRESH_TOKEN_TTL || '7d',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@talentbridge.com',
  },
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),
};
