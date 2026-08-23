export const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY || '',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
  passkey: process.env.MPESA_PASSKEY || '',
  shortcode: process.env.MPESA_SHORTCODE || '174379',
  callbackUrl:
    process.env.MPESA_CALLBACK_URL ||
    ((process.env.BACKEND_URL || process.env.API_URL)
      ? `${(process.env.BACKEND_URL || process.env.API_URL).replace(/\/+$/,'')}/api/mpesa/callback`
      : ''),
  baseUrl: process.env.MPESA_ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke'
};

export const getAccessToken = async (): Promise<string> => {
  try {
    const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');
    
    const response = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    const data: { access_token?: string } = await response.json();
    if (!data.access_token) {
      throw new Error('MPESA access_token missing from response')
    }
    return data.access_token;

  } catch (error) {
    console.error('MPESA Access Token Error:', error);
    throw new Error('Failed to get MPESA access token');
  }
};
