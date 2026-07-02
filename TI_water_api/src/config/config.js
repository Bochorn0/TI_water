import 'dotenv/config';

const config = {
  SECRET_KEY: process.env.SECRET_KEY,
  TIWATER_API_KEY: process.env.TIWATER_API_KEY,
  TIWATER_API_KEY_HASH: process.env.TIWATER_API_KEY_HASH,
};

export default config;
