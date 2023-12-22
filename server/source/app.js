import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from './logger.js';
import walletRoutes from './routes/walletRoute.js';
import fileRoutes from './routes/fileRoute.js';



dotenv.config();
const app = express();


app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use((req, res, next) => {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    logger.info(`Incoming request from IP: ${ip} and User Agent: ${userAgent}`);
    next();
});

app.use('/api/wallet', walletRoutes);
app.use('/services/transcription', fileRoutes);


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    logger.info(`Server is running on port http://localhost:${PORT}`);
});

