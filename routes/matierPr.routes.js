import express from 'express';
import { createMatierPrCtrl, getAllMatierPrCtrl, getMatierPrByIdCtrl, updateMatierPrCtrl, deleteMatierPrCtrl 
} from '../controllers/matierPr.controller.js';
import { authmiddleware } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js'; 

const router = express.Router();

router.use(authmiddleware);
router.post('/', authorizeRoles('ADMIN', 'OPERATOR'), createMatierPrCtrl);
router.get('/', getAllMatierPrCtrl);
router.get('/:id', getMatierPrByIdCtrl);
router.put('/:id', authorizeRoles('ADMIN', 'OPERATOR'), updateMatierPrCtrl);
router.delete('/:id', authorizeRoles('ADMIN'), deleteMatierPrCtrl); 

export default router;