import express from 'express';
import * as controller from '../controllers/scheduleController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  createSchedule,
  updateSchedule,
  getById,
  deleteById,
} from '../validators/scheduleValidator.js';

const router = express.Router();
router.use(protect, adminOnly);

router.get('/', controller.list);
router.get('/:id', getById, validateRequest, controller.getById);
router.post('/', createSchedule, validateRequest, controller.create);
router.put('/:id', updateSchedule, validateRequest, controller.update);
router.delete('/:id', deleteById, validateRequest, controller.remove);

export default router;
