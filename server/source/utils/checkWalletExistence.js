import pool from "../connection.cjs";
import logger from '../logger.js';

export const checkWalletExistence = async (walletAddress) => {
    try {
      const result = await pool.query(
        `SELECT * FROM WALLETS WHERE wallet_address = $1`,
        [walletAddress]
      );
      if (result.rows.length === 0) {
        return false;
      }
      return true;
    } catch (error) {
      logger.error(`Error in checking if wallet exists in database: ${error}`);
      return null;
    }
  };