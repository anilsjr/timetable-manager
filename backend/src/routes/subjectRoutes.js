import express from 'express';
import * as controller from '../controllers/subjectController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  createSubject,
  updateSubject,
  getById,
  deleteById,
} from '../validators/subjectValidator.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/', controller.list);
router.get('/:id', getById, validateRequest, controller.getById);
router.post('/', createSubject, validateRequest, controller.create);
router.put('/:id', updateSubject, validateRequest, controller.update);
router.delete('/:id', deleteById, validateRequest, controller.remove);

export default router;
