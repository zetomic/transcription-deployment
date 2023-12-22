import Web3 from 'web3';
import logger from '../logger.js';

const web3 = new Web3();


export const verifySignatureMiddleware = (req, res, next) => {
    const { signature, nonce, walletAddress } = req.body;
    if (!signature || !nonce) {
        logger.info('Invalid request data');
        return res.status(400).json({ message: 'Invalid request data' });
    }
    try {
        const recoveredAddress = web3.eth.accounts.recover(
            web3.utils.utf8ToHex(nonce),
            signature
        );
        if (recoveredAddress.toLowerCase() === walletAddress.toLowerCase()) {
            logger.info('Signature verified');
            next();
        }
        else {
            logger.error(`Unauthorized request from IP ${req.ip}`);
            return res.status(401).json({
                message: 'Unauthorized'
            });
        }
    }
    catch (error) {
        logger.error(`Error during verify signature: ${error}`);
        return res.status(500).json({
            message: 'Server error during signature validation'
        });
    }
}