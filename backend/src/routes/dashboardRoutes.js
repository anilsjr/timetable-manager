import express from 'express';
import { getStats } from '../controllers/dashboardController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect, adminOnly);

router.get('/stats', getStats);

export default router;
