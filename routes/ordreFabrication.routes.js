import express from 'express';
import {
    createOrderCtrl,
    getAllOrdersCtrl,
    getOrderByIdCtrl,
    updateOrderCtrl,
    cancelOrderCtrl
} from '../controllers/ordreFabrication.controller.js';
import { getMyOrdersCtrl, getOrderHistoryCtrl } from '../controllers/ordreFabrication.controller.js';
import { authmiddleware } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { startOrderCtrl, completeOrderCtrl } from '../controllers/ordreFabrication.controller.js';

const router = express.Router();

router.use(authmiddleware);

router.post('/', authorizeRoles('ADMIN'), createOrderCtrl);
router.get('/history', authorizeRoles('OPERATOR'), getOrderHistoryCtrl);
router.get('/mine', authorizeRoles('OPERATOR'), getMyOrdersCtrl);
router.get('/', getAllOrdersCtrl);
router.get('/:id', getOrderByIdCtrl);
router.put('/:id', authorizeRoles('ADMIN'), updateOrderCtrl);
router.patch('/:id/cancel', authorizeRoles('ADMIN'), cancelOrderCtrl);
router.post('/:id/start', authorizeRoles('ADMIN', 'OPERATOR'), startOrderCtrl);
router.post('/:id/complete', authorizeRoles('ADMIN', 'OPERATOR'), completeOrderCtrl);

export default router;
