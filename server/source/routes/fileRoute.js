import express from 'express';
const Router = express.Router();

import uploadMiddleware from '../middlewares/uploadMiddleware.js';
import { virusScan } from '../middlewares/virusScanMiddleware.js';
import { processFile, downloadFile, transcriptionHistory } from '../controllers/fileController.js';
import { authorize } from '../middlewares/authMiddleware.js';

import { walletBalanceChecker } from '../middlewares/walletBalanceChecker.js';

// POST endpoint for file upload
Router.post('/upload',
authorize,
walletBalanceChecker,
uploadMiddleware,
virusScan, 
processFile);

Router.get('/history', authorize, transcriptionHistory);

Router.get('/test', authorize, (req, res) => {
    res.json({message: 'Hello World'});
})


Router.get('/download', downloadFile)


export default Router;