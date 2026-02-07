import express from 'express';
import * as controller from '../controllers/facultyAssignmentController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect, adminOnly);

router.get('/class/:classId', controller.getByClass);

export default router;
