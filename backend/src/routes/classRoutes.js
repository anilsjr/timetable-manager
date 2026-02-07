import express from 'express';
import * as controller from '../controllers/classController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  createClass,
  updateClass,
  getById,
  getClassSubjects,
  deleteById,
} from '../validators/classValidator.js';

const router = express.Router();
router.use(protect, adminOnly);

router.get('/', controller.list);
router.get('/:classId/subjects', getClassSubjects, validateRequest, controller.getClassSubjects);
router.get('/:id', getById, validateRequest, controller.getById);
router.post('/', createClass, validateRequest, controller.create);
router.put('/:id', updateClass, validateRequest, controller.update);
router.delete('/:id', deleteById, validateRequest, controller.remove);

export default router;
