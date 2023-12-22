import nodemailer from "nodemailer";
import Imap from "imap";

import logger from '../logger.js'

import dotenv from 'dotenv'
dotenv.config()

// Email configuration
const senderEmail = process.env.EMAIL_USER;
const senderPassword = process.env.EMAIL_PASS;

// SMTP (sending) server details
const smtpServer = "smtp.titan.email";
const smtpPort = 587;

// IMAP (receiving) server details
const imapServer = "imap.titan.email";
const imapPort = 993;

const transporter = nodemailer.createTransport({
  host: smtpServer,
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendDownloadLinkEmail = async (email, link) => {
  const htmlMessage = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: 'Arial', sans-serif;
        background-color: #f8f8f8;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 50px auto;
        padding: 20px;
        background-color: #ffffff;
        border-radius: 10px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
      }
      .logo {
        display: block;
        margin: 0 auto 20px;
        max-width: 150px; /* Adjust the max-width to control the logo size */
        height: auto;
      }
      h1 {
        color: #333333;
        font-size: 24px;
        margin-bottom: 20px;
      }
      p {
        color: #555555;
        font-size: 16px;
        margin-bottom: 30px;
      }
      .button {
        display: inline-block;
        padding: 12px 24px;
        font-size: 18px;
        text-align: center;
        text-decoration: none;
        background-color: #4caf50;
        color: #ffffff;
        border-radius: 5px;
        transition: background-color 0.3s ease;
      }
      .button:hover {
        background-color: #45a049;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <img class="logo" src="https://media.discordapp.net/attachments/1166726577539788890/1179426440442281994/Transparent_PNG_File_-_Copy.png?ex=6579bd78&is=65674878&hm=b71b01d615f4caf058d19f566f4f7ad911de535d697050de01a47a509e86d815&=&format=webp&quality=lossless&width=931&height=573" alt="Logo">
      <h1>Transcription Download Link</h1>
      <p>Click the button below to download/view your transcription:</p>
      <a class="button" href="${link}" target="_blank">Download Transcription</a>
    </div>
  </body>
  </html>`;

  try {
    const mailOptions = {
      from: {
        name: "VoxaLink Pro",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: "Transcription Download Link",
      html: htmlMessage,
      text: `Download your transcription here: ${link}` ,
    };
    const result = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${email}`);

    const imap = new Imap({
      user: senderEmail,
      password: senderPassword,
      host: imapServer,
      port: imapPort,
      tls: true,
    });

    imap.once("ready", () => {
      imap.openBox("Sent", true, (err) => {
        if (err) {
          logger.error('Error opening "Sent" folder:', err);
          imap.end();
          return;
        }

        // Create the email message as MIMEText
        const emailMessage = `From: ${senderEmail}\r\nTo: ${email}\r\nSubject: Transcription Download Link\r\nContent-Type: text/html\r\n\r\n${htmlMessage}`;

        // Append the sent email to the "Sent" folder
        imap.append(emailMessage, { mailbox: "Sent" }, (appendErr) => {
          if (appendErr) {
            logger.error('Error appending email to "Sent" folder:', appendErr);
          } else {
            logger.info('Email appended to "Sent" folder.');
          }
          imap.end();
        });
      });
    });
    imap.once("error", (imapErr) => {
      logger.error("IMAP Error:", imapErr);
    });

    imap.connect();
    return true;
  } 
  
  catch (error) {
    logger.error(`Error sending email: ${error}`);
    return false;
  }
};
