import express from 'express';
import * as controller from '../controllers/labController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  createLab,
  updateLab,
  getById,
  deleteById,
} from '../validators/labValidator.js';

const router = express.Router();
router.use(protect, adminOnly);

router.get('/', controller.list);
router.get('/:id', getById, validateRequest, controller.getById);
router.post('/', createLab, validateRequest, controller.create);
router.put('/:id', updateLab, validateRequest, controller.update);
router.delete('/:id', deleteById, validateRequest, controller.remove);

export default router;
