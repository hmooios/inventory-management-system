import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join((process.cwd(), '.env')) });

export default {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  jwt_secret: process.env.JWT_SECRET,
  upload_dir: process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads'),
  upload_base_url: process.env.UPLOAD_BASE_URL
};
