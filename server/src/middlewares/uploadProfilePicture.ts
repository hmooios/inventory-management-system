import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import CustomError from '../errors/customError';
import config from '../config';

const profileUploadDir = path.join(config.upload_dir, 'profile');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(profileUploadDir, { recursive: true });
    cb(null, profileUploadDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`;
    cb(null, uniqueName);
  }
});

const uploadProfilePicture = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new CustomError(400, 'Only image files are allowed'));
      return;
    }

    cb(null, true);
  }
});

export default uploadProfilePicture;
