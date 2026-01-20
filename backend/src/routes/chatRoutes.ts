import { Router } from 'express';
import { processChat } from '../controllers/chatController';

const router = Router();

router.post('/chat', processChat);

export default router;
