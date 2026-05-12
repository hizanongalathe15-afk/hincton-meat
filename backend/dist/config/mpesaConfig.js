"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccessToken = exports.MPESA_CONFIG = void 0;
exports.MPESA_CONFIG = {
    consumerKey: process.env.MPESA_CONSUMER_KEY || '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
    passkey: process.env.MPESA_PASSKEY || '',
    shortcode: process.env.MPESA_SHORTCODE || '174379',
    callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://your-domain.com/api/mpesa/callback',
    baseUrl: 'https://sandbox.safaricom.co.ke' // Use production URL in production
};
const getAccessToken = async () => {
    try {
        const auth = Buffer.from(`${exports.MPESA_CONFIG.consumerKey}:${exports.MPESA_CONFIG.consumerSecret}`).toString('base64');
        const response = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });
        const data = await response.json();
        if (!data.access_token) {
            throw new Error('MPESA access_token missing from response');
        }
        return data.access_token;
    }
    catch (error) {
        console.error('MPESA Access Token Error:', error);
        throw new Error('Failed to get MPESA access token');
    }
};
exports.getAccessToken = getAccessToken;
//# sourceMappingURL=mpesaConfig.js.map