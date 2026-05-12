import { Router } from 'express';
import { register, login, getProfile, updateProfile, changePassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateBody, userRegistrationSchema, userLoginSchema } from '../middleware/validation';

const router = Router();

router.post('/register', validateBody(userRegistrationSchema), register);
router.post('/login', validateBody(userLoginSchema), login);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

export default router;
