import S3 from 'aws-sdk/clients/s3.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config();

const s3 = new S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET
})

export const uploadFile = async (fileName) => {

    let folderPath = '../../../Files/outputs';
    folderPath = path.resolve(__dirname, '../../../Files/outputs');
    console.log(folderPath);
    // Check if the file exists in the folder
    const filePath = `${folderPath}/${fileName}`;
    if (!fs.existsSync(filePath)) {
        throw new Error(`File ${fileName} not found in ${folderPath}`);
    }

    // Determine the file type based on the extension
    const fileExtension = path.extname(fileName).toLowerCase();
    let contentType;
    if (fileExtension === '.pdf') {
        contentType = 'application/pdf';
    } else if (fileExtension === '.docx') {
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (fileExtension === '.txt') {
        contentType = 'text/plain';
    } else {
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }

    // Upload the file to S3
    const fileContent = fs.readFileSync(filePath);
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Body: fileContent,
        Key: fileName,
        ContentType: contentType
    };

    try {
        const result = await s3.upload(params).promise();
        console.log('File uploaded successfully:', result.Location);
    } catch (error) {
        console.error('Error uploading file:', error);
    }
};

export const downloadFileS3 = async (fileName, res) => {
    // Download the file from S3
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName
    };

    try {
        const result = await s3.getObject(params).promise();
        console.log('File downloaded successfully:', result);

        // Determine the file type based on the extension
        const fileExtension = fileName.split('.').pop().toLowerCase();
        let contentType;
        if (fileExtension === 'pdf') {
            contentType = 'application/pdf';
        } else if (fileExtension === 'docx') {
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (fileExtension === 'txt') {
            contentType = 'text/plain';
        } else {
            throw new Error(`Unsupported file type: ${fileExtension}`);
        }

        // Set the response headers
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-Type', contentType);

        // Send the file content as the response
        res.send(result.Body);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).send('Error downloading file');
    }
}



