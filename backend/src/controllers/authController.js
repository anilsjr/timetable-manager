import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

/**
 * @route   POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    logger.info('Login attempt', { email });
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      logger.warn('Login failed: invalid credentials', { email });
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    const token = generateToken(user._id);
    logger.info('Login success', { email, userId: user._id.toString() });
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Login error', { email: req.body?.email, message: error.message });
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }
    const user = await User.create({ email, password, role: 'admin' });
    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};
