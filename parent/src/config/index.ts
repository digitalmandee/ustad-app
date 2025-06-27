// Set the NODE_ENV
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
const envFound = require('dotenv').config({ path: `${process.env.NODE_ENV}` });

if (envFound.error) {
  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

export default {
  port: process.env.PORT || 301,
  api: {
    prefix: '/api/v1',
  },
};
