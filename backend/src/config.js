require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 8000,
  CACHE_TTL: parseInt(process.env.CACHE_TTL) || 3600,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  REDDIT_CLIENT_ID: process.env.REDDIT_CLIENT_ID,
  REDDIT_CLIENT_SECRET: process.env.REDDIT_CLIENT_SECRET,
  REDDIT_USER_AGENT: process.env.REDDIT_USER_AGENT,
  REDDIT_USERNAME: process.env.REDDIT_USERNAME,
  REDDIT_PASSWORD: process.env.REDDIT_PASSWORD
};