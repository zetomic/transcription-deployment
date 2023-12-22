import { getTokenBalance } from '../utils/getTokenBalance.js';
import pool from '../connection.cjs';
import logger from '../logger.js';

// const token_threshold = 160000;

// export const walletBalanceChecker = async (req, res, next) => {
//     const { walletAddress } = req.Wallet;
//     try {
//         const result = await pool.query(`SELECT last_usage_time, usage_count FROM WALLETS WHERE wallet_address = $1`, [walletAddress]);
//         let lastUsageTime = result.rows[0].last_usage_time;
//         let usageCount = result.rows[0].usage_count;
//         const walletBalance = await getTokenBalance(walletAddress);

//         if (Date.now() - lastUsageTime > 86400000) {
//             lastUsageTime = Date.now();
//             usageCount = 0;
//         }
//         // Two Cases
//         if (walletBalance < token_threshold) {
//             if (usageCount >= 3) {
//                 logger.log(`Wallet ${walletAddress} has insufficient tokens and has exceeded usage count`);
//                 return res.status(400).json({
//                     'message': 'Insufficient tokens and exceeded usage count for the day'
//                 });
//             }
//             usageCount++;
//             lastUsageTime = Date.now();
//             await pool.query(`UPDATE WALLETS SET last_usage_time = $1, usage_count = $2 WHERE wallet_address = $3`, [lastUsageTime, usageCount, walletAddress]);
//             logger.info(`Passed through walletbalance middleware. Wallet ${walletAddress} has tokens less than  threshold but free uses left`);
//             next();
//         }
//         else {
//             if (usageCount >= 15) {
//                 logger.info(`Wallet ${walletAddress} has sufficient tokens but has exceeded usage count`);
//                 return res.status(400).json({
//                     'message': 'Sufficient tokens but exceeded usage count for the day'
//                 });
//             }
//             usageCount++;
//             lastUsageTime = Date.now();
//             await pool.query(`UPDATE WALLETS SET last_usage_time = $1, usage_count = $2 WHERE wallet_address = $3`, [lastUsageTime, usageCount, walletAddress]);
//             logger.info(`Passed through walletbalance middleware. Wallet ${walletAddress} has sufficient tokens and free uses left`);
//             next();
//         }
//     }
//     catch (err) {
//         logger.error(`Error in walletBalanceChecker middleware: ${err}`);
//         return res.status(500).json({
//             'message': 'Server sided error, cant obtain wallet balance'
//         });
//     }
// };

// Temporary walletBalanceChecker Method for the testing period during ICO phase

export const walletBalanceChecker = async (req, res, next) => {
    const { walletAddress } = req.Wallet;
    try {
        const result = await pool.query(`SELECT last_usage_time, usage_count FROM WALLETS WHERE wallet_address = $1`, [walletAddress]);
        let lastUsageTime = result.rows[0].last_usage_time.getTime();
        let usageCount = result.rows[0].usage_count;
        console.log(lastUsageTime);
        console.log(new Date().getTime());
        if (new Date().getTime - lastUsageTime > 86400000) {
            lastUsageTime = new Date();
            usageCount = 0;
        }
        if (usageCount > 10) {
            console.log(`Wallet ${walletAddress} has exceeded usage count`);
            return res.status(400).json({
                'message': 'Exceeded usage count for the day'
            });
        
        }
        usageCount++;
        lastUsageTime = new Date();
        await pool.query(`UPDATE WALLETS SET last_usage_time = $1, usage_count = $2 WHERE wallet_address = $3`, [lastUsageTime, usageCount, walletAddress]);
        console.log(`Passed through walletbalance middleware. Wallet ${walletAddress} has free uses left`);
        next()
    }
    catch (err) {
        logger.error(`Error in walletBalanceChecker middleware: ${err}`);
        return res.status(500).json({
            'message': 'Server sided error, cant obtain wallet balance'
        });
    }
};