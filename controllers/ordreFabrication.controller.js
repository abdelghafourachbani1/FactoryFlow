import {
    createOrderService,
    getAllOrdersService,
    getOrderByIdService,
    updateOrderService,
    cancelOrderService
} from '../services/ordreFabrication.service.js';
import { startOrderService, completeOrderService } from '../services/ordreFabrication.service.js';

export async function createOrderCtrl(req, res) {
    try {
        const order = await createOrderService(req.body);
        return res.status(201).json({
            success: true,
            message: 'Ordre de fabrication créé avec succès',
            data: order
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}

export async function getAllOrdersCtrl(req, res) {
    try {
        const result = await getAllOrdersService(req.query);
        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function getOrderByIdCtrl(req, res) {
    try {
        const order = await getOrderByIdService(req.params.id);
        return res.status(200).json({ success: true, data: order });
    } catch (error) {
        return res.status(404).json({ success: false, message: error.message });
    }
}

export async function updateOrderCtrl(req, res) {
    try {
        const order = await updateOrderService(req.params.id, req.body);
        return res.status(200).json({
            success: true,
            message: 'Ordre de fabrication mis à jour avec succès',
            data: order
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}

export async function cancelOrderCtrl(req, res) {
    try {
        const order = await cancelOrderService(req.params.id);
        return res.status(200).json({
            success: true,
            message: 'Ordre de fabrication annulé avec succès',
            data: order
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}

export async function startOrderCtrl(req, res) {
    try {
        // req.user provient de votre middleware JWT d'authentification
        const order = await startOrderService(req.params.id, req.user);
        return res.status(200).json({
            success: true,
            message: 'Ordre de fabrication démarré avec succès. Stocks déduits.',
            data: order
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}

export async function completeOrderCtrl(req, res) {
    try {
        const order = await completeOrderService(req.params.id, req.user);
        return res.status(200).json({
            success: true,
            message: 'Ordre de fabrication terminé avec succès. Produits finis ajoutés au stock.',
            data: order
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}