import express from 'express';
import { loginCtrl, profileCtrl, createOperatorCtrl, createAdminUserCtrl, listOperatorsCtrl } from '../controllers/user.controller.js';
import { authmiddleware } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = express.Router();

router.post('/login', loginCtrl);
router.get('/profile', authmiddleware, profileCtrl);
router.post('/users/operators', authmiddleware, authorizeRoles('ADMIN'), createOperatorCtrl);
router.post('/users/admins', authmiddleware, authorizeRoles('ADMIN'), createAdminUserCtrl);
router.get('/users/operators', authmiddleware, authorizeRoles('ADMIN'), listOperatorsCtrl);

export default router;
