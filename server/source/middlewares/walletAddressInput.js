import logger from '../logger.js'


export const walletInputCheck = (req,res,next) => {
    const { walletAddress } = req.body;
    if (!walletAddress) {
        logger.info(`Wallet address input middleware: no wallet address in request body`)
        return res.status(400).json({
            'message': 'Wallet address not provided in request body from front-end'
        });
    }
    next();
}