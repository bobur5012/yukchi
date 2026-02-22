import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
  FRONTEND_URL: Joi.string().uri().required(),
  TELEGRAM_BOT_TOKEN: Joi.string().optional().allow(''),
  TELEGRAM_GROUP_CHAT_ID: Joi.string().optional().allow(''),
  TELEGRAM_APP_ID: Joi.number().optional(),
  TELEGRAM_APP_HASH: Joi.string().optional().allow(''),
  SESSION_ENCRYPTION_KEY: Joi.string().min(32).optional().allow(''),
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(200),
  AUTH_THROTTLE_LIMIT: Joi.number().default(10),
});

export const configuration = () => ({
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    frontendUrl: process.env.FRONTEND_URL,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    groupChatId: process.env.TELEGRAM_GROUP_CHAT_ID,
    appId: parseInt(process.env.TELEGRAM_APP_ID || '0', 10),
    appHash: process.env.TELEGRAM_APP_HASH,
    sessionEncryptionKey: process.env.SESSION_ENCRYPTION_KEY,
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '200', 10),
    authLimit: parseInt(process.env.AUTH_THROTTLE_LIMIT || '10', 10),
  },
});
