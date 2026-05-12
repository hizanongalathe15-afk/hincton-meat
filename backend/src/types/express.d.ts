import 'express';


declare module 'express' {
  export interface Request {
      user?: {

        id: string;
        name: string;
        email: string;
        role: string;
        phone?: string;
        isVerified: boolean;
        roles?: string[];
      };
    }
  }

export {};
