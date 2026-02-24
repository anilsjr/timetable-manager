import express from 'express';
import * as controller from '../controllers/teacherController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  createTeacher,
  updateTeacher,
  getById,
  getTeachersBySubject,
  getTeachersByLab,
  deleteById,
} from '../validators/teacherValidator.js';

const router = express.Router();
router.use(protect, adminOnly);

router.get('/', controller.list);
router.get('/by-subject/:subjectId', getTeachersBySubject, validateRequest, controller.getTeachersBySubject);
router.get('/by-lab/:labId', getTeachersByLab, validateRequest, controller.getTeachersByLab);
router.get('/:id', getById, validateRequest, controller.getById);
router.post('/', createTeacher, validateRequest, controller.create);
router.put('/:id', updateTeacher, validateRequest, controller.update);
router.delete('/:id', deleteById, validateRequest, controller.remove);

export default router;
