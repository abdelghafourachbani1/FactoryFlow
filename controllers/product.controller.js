import { 
    createProductSer, 
    getAllProductsSer, 
    getProductByIdSer, 
    updateProductSer, 
    deleteProductSer 
} from '../services/product.service.js';

export async function createProductCtrl(req, res) {
    try {
        const product = await createProductSer(req.body);
        return res.status(201).json({
            success: true,
            message: 'Produit créé avec succès',
            data: product
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}

export async function getAllProductsCtrl(req, res) {
    try {
        const products = await getAllProductsSer();
        return res.status(200).json({ success: true, count: products.length, data: products });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function getProductByIdCtrl(req, res) {
    try {
        const product = await getProductByIdSer(req.params.id);
        return res.status(200).json({ success: true, data: product });
    } catch (error) {
        return res.status(404).json({ success: false, message: error.message });
    }
}

export async function updateProductCtrl(req, res) {
    try {
        const product = await updateProductSer(req.params.id, req.body);
        return res.status(200).json({
            success: true,
            message: 'Produit mis à jour avec succès',
            data: product
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}

export async function deleteProductCtrl(req, res) {
    try {
        await deleteProductSer(req.params.id);
        return res.status(200).json({
            success: true,
            message: 'Produit supprimé avec succès'
        });
    } catch (error) {
        return res.status(404).json({ success: false, message: error.message });
    }
}