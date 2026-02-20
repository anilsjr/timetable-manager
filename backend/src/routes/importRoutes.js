import express from 'express';
import multer from 'multer';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';
import * as importController from '../controllers/importController.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'text/csv',
      'application/csv',
      'text/plain',
      'application/json',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (allowed.some((m) => file.mimetype === m || file.mimetype?.startsWith(m))) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Use CSV, Excel (.xlsx), or JSON.'), false);
    }
  },
});

router.use(protect, adminOnly);

router.post('/subjects', upload.single('file'), importController.importSubjects);
router.post('/teachers', upload.single('file'), importController.importTeachers);
router.post('/labs', upload.single('file'), importController.importLabs);
router.post('/classes', upload.single('file'), importController.importClasses);

export default router;
