import {createMatierPrSer,getAllMatierPrSer,getMatierPrByIdSer,updateMatierPrSer,deleteMatierPrSer,addStockService,getLowStockService,getMovementsService} from '../services/matierPr.service.js';

export async function createMatierPrCtrl(req, res) {
    try {
        const matier = await createMatierPrSer(req.body, req.user.userId);
        return res.status(201).json({
            success: true,
            message: 'metier created succesfully',
            data: matier
        });
    } catch (error) {
        return res.status(error.statusCode || (error.code === 11000 ? 409 : 400)).json({
            success: false,
            message: error.message
        });
    }
}

export async function getAllMatierPrCtrl(req, res) {
    try {
        const matiers = await getAllMatierPrSer();
        return res.status(200).json({
            success: true,
            data: matiers
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function getMatierPrByIdCtrl(req, res) {
    try {
        const matier = await getMatierPrByIdSer(req.params.id);
        return res.status(200).json({
            success: true,
            data: matier
        });
    } catch (error) {
        return res.status(error.name === 'CastError' ? 404 : (error.statusCode || 400)).json({
            success: false,
            message: error.message
        });
    }
}

export async function updateMatierPrCtrl(req, res) {
    try {
        const matier = await updateMatierPrSer(req.params.id, req.body);
        return res.status(200).json({
            success: true,
            message: 'Matière première mise à jour avec succès',
            data: matier
        });
    } catch (error) {
        return res.status(error.statusCode || (error.code === 11000 ? 409 : 400)).json({
            success: false,
            message: error.message
        });
    }
}

export async function deleteMatierPrCtrl(req, res) {
    try {
        await deleteMatierPrSer(req.params.id);
        return res.status(200).json({
            success: true,
            message: 'Matière première supprimée avec succès'
        });
    } catch (error) {
        return res.status(error.statusCode || (error.name === 'CastError' ? 404 : 400)).json({
            success: false,
            message: error.message
        });
    }
}

export async function addStockCtrl(req, res) {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        const updatedMatier = await addStockService(id, quantity, req.user.userId);
        return res.status(200).json({
            success: true,
            message: 'stock augmented',
            data: updatedMatier
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export async function getLowStockCtrl(req, res) { return res.json({ success: true, data: await getLowStockService() }); }
export async function getStockMovementsCtrl(req, res) { return res.json({ success: true, data: await getMovementsService(req.query) }); }
