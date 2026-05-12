import crypto from 'crypto';

export const generateTransactionId = (): string => {
  return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?(254|0)?[7]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return cleaned;
  }
  
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '254' + cleaned.substring(1);
  }
  
  if (cleaned.startsWith('7') && cleaned.length === 9) {
    return '254' + cleaned;
  }
  
  return cleaned;
};

export const calculateHash = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};
