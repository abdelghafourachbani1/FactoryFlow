import {createMatierPrSer,getAllMatierPrSer,getMatierPrByIdSer,updateMatierPrSer,deleteMatierPrSer} from '../services/matierPr.service.js';

export async function createMatierPrCtrl(req, res) {
    try {
        const matier = await createMatierPrSer(req.body);
        return res.status(201).json({
            success: true,
            message: 'metier created succesfully',
            data: matier
        });
    } catch (error) {
        return res.status(400).json({
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
        return res.status(404).json({
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
        return res.status(400).json({
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
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
}