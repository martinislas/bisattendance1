import { Router } from 'express';
import {
  recordAttendance,
  getAttendanceByDate,
  getAttendanceByStudent,
  getAttendanceStats,
  bulkRecordAttendance,
} from '../controllers/attendanceController';

const router = Router();

router.post('/', recordAttendance);
router.post('/bulk', bulkRecordAttendance);
router.get('/date/:date', getAttendanceByDate);
router.get('/student/:studentId', getAttendanceByStudent);
router.get('/stats', getAttendanceStats);

export default router;
