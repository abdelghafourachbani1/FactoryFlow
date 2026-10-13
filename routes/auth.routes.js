import express from 'express';
import { loginCtrl } from '../controllers/user.controller.js';

const router = express.Router();

router.post('/login', loginCtrl);

export default router;