// uploadMiddleware.js

import multer from 'multer';

import path from 'path'

import { v4 as uuidv4 } from 'uuid'

import logger from '../logger.js'



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '../Files/uploads'); // Adjust the path as needed
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${uuidv4()}${path.extname(file.originalname)}`;
    logger.info(`File name: ${uniqueSuffix}`);
    cb(null, uniqueSuffix);
  }
});

const uploadMiddleware = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /wav|ogg|m4a|mp3|mov|mpeg|mp4|avi|opus|aac|flac|m4v/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      logger.info(`FILE UPLOADED`);
      return cb(null,true);
    }
    else {
      cb(new Error('Error: File type not supported'), false)
    }
  }
}).single('file');

export default uploadMiddleware;