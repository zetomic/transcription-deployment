import jwt from 'jsonwebtoken'
import pool from '../connection.cjs';
import logger from '../logger.js';


export const authorize = async (req, res, next) => {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (!accessToken) {
        if (!refreshToken) {
            logger.info(`Authorization middleware: No access token or refresh token found in cookies`);
            return res.status(401).json({
                'message': 'Authorization failed, please log in again.'
            });
        }
        return handleRefreshToken(refreshToken, req, res, next);
    }

    try {
        req.Wallet = jwt.verify(accessToken, process.env.JWT_SECRET);
        logger.info(`Authorization middleware: JWT verified successfully, wallet address: ${req.Wallet.walletAddress}`)
        next();
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError && refreshToken) {
            return handleRefreshToken(refreshToken, req, res, next);
        }
        logger.error(`Authorization middleware: Error verifying access token: ${error}`);
        return res.status(401).json({
            'message': 'Authorization failed, please log in again.'
        });
    }
}


const handleRefreshToken = async (refreshToken, req, res, next) => {
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const walletAddress = decoded.walletAddress;
        const result = await pool.query(`SELECT * FROM WALLETS WHERE refresh_token = $1 AND wallet_address = $2`, [refreshToken, walletAddress]);
        if (result.rows.length === 0) {
            logger.error(`Authorization middleware: Refresh token not found in database`);
            return res.status(401).json({
                'message': 'Authorization failed, please log in again.'
            });
        }
        const newAccessToken = generateAccessToken(walletAddress);
        logger.info(`Authorization middleware: New access token generated successfully`);
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            expires: new Date(Date.now() + (5 * 60 * 1000)), // 5 minutes
        })
        req.Wallet = jwt.verify(newAccessToken, process.env.JWT_SECRET);
        return next();
    }
    catch (err) {
        logger.error(`Authorization middleware: Error verifying refresh token / DB error: ${err}`);
        return res.status(401).json({
            'message': 'Authorization failed, please log in again.'
        });
    }
}


const generateAccessToken = (walletAddress) => {

    return jwt.sign({ 'walletAddress': walletAddress }, process.env.JWT_SECRET, { expiresIn: '5m' });


}