import axios from 'axios'

import fs from 'fs'
import path from 'path'

import { fileURLToPath } from 'url'

import { sendDownloadLinkEmail } from '../utils/emailSender.js'
import { uploadFile, downloadFileS3 } from '../utils/s3.js';
import pool from '../connection.cjs' 

import logger from '../logger.js'

const __filename = fileURLToPath(import.meta.url);
const OUTPUT_FILES_DIR = path.join(path.dirname(__filename), '../../..', 'Files', 'outputs');


const processFile = async (req, res) => {
  const file = req.file;
  const fileName = file.filename;
  const { walletAddress } = req.Wallet;
  logger.info(`Wallet Address: ${walletAddress}; uploaded: ${fileName}`);

  try {
    
    // Call the Python API
    const response = await axios.post(`http://localhost:5000/transcribe`, //x.pdf/docx/html
    {
      'fileName': fileName,
      'outputFormat': req.body.outputFormat, //{'pdf', 'docx', 'txt'}

    });
    const resultfileName = fileName.split('.')[0];
    // Insert into database
    await pool.query(`INSERT INTO TRANSCRIPTIONS (wallet_address, transcribed_file_name, transcription_time) 
    VALUES ($1, $2, $3)`, [walletAddress, resultfileName, new Date()]);

    // Generate download link
    await uploadFile(`${resultfileName}.${req.body.outputFormat}`);
    const downloadLink = `http://localhost:4000/services/transcription/download?file=${resultfileName}&format=${req.body.outputFormat}`;
    logger.info(`Download link: ${downloadLink}`)
    await sendDownloadLinkEmail(req.body.email, downloadLink);

   

    // Send a response with the download link
    res.status(200).json({ 'downloadLink': downloadLink });

  } catch (error) {
    logger.error('Error processing file:', error);

    res.status(500).send('An error occurred during file processing');
  }
  finally {
    // Delete the original uploaded file
    fs.unlinkSync(file.path);
  }
};

const downloadFile = async (req, res) => {
  const {file, format} = req.query;
  if (!file || !format) {
    return res.status(400).send('No file/format specified');
  }

  try {
    await downloadFileS3(`${file}.${format}`, res);
  } catch (error) {
    logger.error('Error:', error);
    return res.status(400).send('Invalid request');
  }
};


const transcriptionHistory = async (req,res) => {
  const { walletAddress } = req.Wallet;
  try {
    const result = await pool.query(`SELECT transcribed_file_name, transcription_time FROM TRANSCRIPTIONS WHERE wallet_address = $1`, [walletAddress]);
    return res.status(200).json(result.rows);
  } catch (error) {
    logger.error('Error retrieving transcription history:', error);
    return res.status(500).send('An error occurred while retrieving transcription history');
  }
}



export { processFile, downloadFile, transcriptionHistory };
