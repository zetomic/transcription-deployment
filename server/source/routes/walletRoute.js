import express from 'express'
const Router = express.Router();

//Controllers
import { getNonce, connectWallet } from '../controllers/walletController.js';


//Middlewares
import { walletInputCheck } from '../middlewares/walletAddressInput.js';
import { verifySignatureMiddleware } from '../middlewares/verifySignatureMiddleware.js';

// @route GET /api/wallet/getNonce
Router.get('/getNonce', getNonce);

// @route POST /api/wallet/connect
Router.post('/connect', walletInputCheck, verifySignatureMiddleware, connectWallet);



export default Router;