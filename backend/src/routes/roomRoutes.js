import express from 'express';
import * as controller from '../controllers/roomController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  createRoom,
  updateRoom,
  getById,
  deleteById,
} from '../validators/roomValidator.js';

const router = express.Router();
router.use(protect, adminOnly);

router.get('/', controller.list);
router.get('/:id', getById, validateRequest, controller.getById);
router.post('/', createRoom, validateRequest, controller.create);
router.put('/:id', updateRoom, validateRequest, controller.update);
router.delete('/:id', deleteById, validateRequest, controller.remove);

export default router;
