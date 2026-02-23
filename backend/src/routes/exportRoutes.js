import express from 'express';
import * as exportController from '../controllers/exportController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Protect all export routes - only authenticated admin users can export
router.use(protect, adminOnly);

// GET /api/timetable/export?classId=xxx&format=excel|pdf
router.get('/', exportController.exportTimetable);

// POST /api/timetable/export/bulk
// Body: { classIds: ["id1", "id2"...], format: "excel|pdf" }
router.post('/bulk', exportController.exportBulkTimetables);

export default router;