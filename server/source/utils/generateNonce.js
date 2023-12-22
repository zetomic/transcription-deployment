import crypto from 'crypto';

export const generateNonce = (walletAddress) => {
    const timestamp = Date.now().toString();
    const randomPart = crypto.randomBytes(16).toString('hex');
    return crypto.createHash('sha256').update(walletAddress + timestamp + randomPart).digest('hex');
}