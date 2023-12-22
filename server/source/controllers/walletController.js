import pool from "../connection.cjs";

import jwt from "jsonwebtoken";

import logger from '../logger.js';

import { checkWalletExistence } from "../utils/checkWalletExistence.js";
import { generateNonce } from "../utils/generateNonce.js";

export const getNonce = (req, res) => {

  const { walletAddress } = req.query;
  if (!walletAddress) {
    return res.status(400).json({
      message: "Wallet address not provided in request query from front-end",
    });
  }
  const nonce = generateNonce(walletAddress);
  return res.json({ nonce });

}



export const connectWallet = async (req, res) => {
  const { walletAddress } = req.body;
  try {
    // Check if wallet address is already in database
    const walletExists = await checkWalletExistence(walletAddress);
    const WA = walletAddress;
    if (!walletExists) {
      // Store wallet address in database
      await pool.query(`INSERT INTO WALLETS (wallet_address) VALUES ($1)`, [
        WA,
      ]);
      logger.info(`Wallet address ${WA} stored in database`);
    }

    // Create JWT

    const accessToken = jwt.sign({ walletAddress: WA }, process.env.JWT_SECRET, {
      expiresIn: "5m",
    });
    // logger.info(`JWT Access Token Created Successfully ${accessToken}, wallet address: ${WA}`);

    const refreshToken = jwt.sign(
      { walletAddress: WA },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "5h" }
    );
    await pool.query(
      `UPDATE WALLETS SET refresh_token = $1 WHERE wallet_address = $2`,
      [refreshToken, WA]
    );
    // logger.info(`JWT Refresh Token Created Successfully ${refreshToken}, wallet address: ${WA}`);

    res.cookie("accessToken", accessToken, {
      expires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      secure: true,
    });
    res.cookie("refreshToken", refreshToken, {
      expires: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours
      secure: true,

    });
    // Send response
    return res.status(200).json({
      message: "Wallet connected successfully",
    });
  } catch (error) {
    // If an error is thrown make sure the user is prompted to connect the wallet again on the front end
    console.error(
      `Error in storing wallet address to database. \nError: \n${error}`
    );
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


