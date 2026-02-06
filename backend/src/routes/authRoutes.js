import express from 'express';
import { body } from 'express-validator';
import { login, register, getMe } from '../controllers/authController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

router.post('/login', loginValidation, validateRequest, login);
router.post('/register', registerValidation, validateRequest, register);
router.get('/me', protect, getMe);

export default router;
