import { readContract } from "@wagmi/core";
import abi from './abi.js';
import logger from '../logger.js'
import dotenv from 'dotenv';
import { mainnet, sepolia } from "wagmi/chains";
import { createConfig } from "wagmi";
import { getDefaultConfig } from "connectkit";

dotenv.config();

const contractAddress = process.env.CONTRACT_ADDRESS;
const chains = [mainnet];


const config = createConfig(
    getDefaultConfig({
      // Required API Keys
      infuraId: process.env.INFURA_ID, // or infuraId
      walletConnectProjectId: process.env.WALLET_CONNECT,
      chains,
      // Required
      appName: "Voxa Link Pro",
  
      // Optional
      appDescription: "Ethereum's First AI Voice  Application",
      appUrl: "http://voxalinkpro.io/", // your app's url
      appIcon: "https://family.co/logo.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
    })
  );

export const getTokenBalance = async (address) => {
    try {
        const fetchData = await readContract({
            address: contractAddress,
            abi,
            functionName: "getTokenBalance",
            args: [address],
        })


        const balance  = Number(fetchData / BigInt(10 ** 18));

        logger.info(`Balance of ${address} is ${balance}`);
        return balance;
        

    } catch (error) {
        logger.error(error);
        return null;
    }
}