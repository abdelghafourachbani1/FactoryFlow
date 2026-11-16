import express from 'express';
import { createMatierPrCtrl, getAllMatierPrCtrl, getMatierPrByIdCtrl, updateMatierPrCtrl, deleteMatierPrCtrl , addStockCtrl
} from '../controllers/matierPr.controller.js';
import { authmiddleware } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js'; 
import { getStockMovementsCtrl, getLowStockCtrl } from '../controllers/matierPr.controller.js';

const router = express.Router();

router.use(authmiddleware);
router.post('/', authorizeRoles('ADMIN'), createMatierPrCtrl);
router.get('/', getAllMatierPrCtrl);
router.get('/movements', authorizeRoles('ADMIN'), getStockMovementsCtrl);
router.get('/alerts', getLowStockCtrl);
router.get('/:id', getMatierPrByIdCtrl);
router.put('/:id', authorizeRoles('ADMIN'), updateMatierPrCtrl);
router.delete('/:id', authorizeRoles('ADMIN'), deleteMatierPrCtrl); 
router.post('/:id/stock', authorizeRoles('ADMIN'), addStockCtrl);
export default router;
