import express from 'express';
import { 
    createProductCtrl, 
    getAllProductsCtrl, 
    getProductByIdCtrl, 
    updateProductCtrl, 
    deleteProductCtrl 
} from '../controllers/product.controller.js';
import { authmiddleware } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = express.Router();

router.use(authmiddleware);

router.post('/', authorizeRoles('ADMIN', 'OPERATOR'), createProductCtrl);
router.get('/', getAllProductsCtrl);
router.get('/:id', getProductByIdCtrl);
router.put('/:id', authorizeRoles('ADMIN', 'OPERATOR'), updateProductCtrl);
router.delete('/:id', authorizeRoles('ADMIN'), deleteProductCtrl);

export default router;  