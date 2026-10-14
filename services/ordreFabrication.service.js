import { 
    createOrderRep, 
    findAllOrdersRep, 
    findOrderByIdRep, 
    updateOrderRep 
} from '../repositories/ordreFabrication.repository.js';
import { productByIdRep } from '../repositories/product.repository.js';
import User from '../models/user.model.js';
import StockMovement from '../models/stockMovement.model.js';
import MatierPr from '../models/matierPr.model.js';
import Product from '../models/product.model.js';
import mongoose from 'mongoose';

export async function createOrderService(data) {
    const { product: productId, operator: operatorId, quantityToProduce, plannedDate, reference } = data;

    // 1. Verify Product exists and has a composition
    const product = await productByIdRep(productId);
    if (!product) {
        throw new Error("Produit introuvable.");
    }
    if (!product.composition || product.composition.length === 0) {
        throw new Error("Impossible de créer un ordre pour un produit sans composition (recette).");
    }

    // 2. Verify Operator exists
    const operator = await User.findById(operatorId);
    if (!operator) {
        throw new Error("Opérateur introuvable.");
    }

    // 3. Create composition snapshot
    const compositionSnapshot = product.composition.map(item => ({
        rawMaterial: item.rawMaterial._id || item.rawMaterial,
        quantityRequiredPerUnit: item.quantityRequired
    }));

    // 4. Create the order
    const orderData = {
        reference: reference || `OF-${Date.now()}`,
        product: productId,
        quantityToProduce,
        operator: operatorId,
        plannedDate,
        compositionSnapshot,
        status: 'PLANIFIED'
    };

    return await createOrderRep(orderData);
}

export async function getAllOrdersService(queryParams) {
    const { status, product, startDate, endDate, page = 1, limit = 10 } = queryParams;

    let filterQuery = {};

    // Filters
    if (status) filterQuery.status = status;
    if (product) filterQuery.product = product;
    if (startDate || endDate) {
        filterQuery.plannedDate = {};
        if (startDate) filterQuery.plannedDate.$gte = new Date(startDate);
        if (endDate) filterQuery.plannedDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const { orders, total } = await findAllOrdersRep(filterQuery, skip, parseInt(limit));

    return {
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
        data: orders
    };
}

export async function getOrderByIdService(id) {
    const order = await findOrderByIdRep(id);
    if (!order) {
        throw new Error("Ordre de fabrication introuvable.");
    }
    return order;
}

export async function updateOrderService(id, data) {
    const order = await getOrderByIdService(id);

    // Rule: Modification only allowed if status is PLANIFIED
    if (order.status !== 'PLANIFIED') {
        throw new Error("Modification impossible : cet ordre de fabrication n'est plus au statut PLANIFIED.");
    }

    return await updateOrderRep(id, data);
}

export async function cancelOrderService(id) {
    const order = await getOrderByIdService(id);

    // Rule: Cancellation only allowed if status is PLANIFIED
    if (order.status !== 'PLANIFIED') {
        throw new Error("Annulation impossible : cet ordre de fabrication n'est plus au statut PLANIFIED.");
    }

    return await updateOrderRep(id, { status: 'CANCELLED' });
}


export async function startOrderService(orderId, currentUser) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await findOrderByIdRep(orderId);
        if (!order) {
            throw new Error("Ordre de fabrication introuvable.");
        }

        // 1. Vérification du rôle Opérateur : ne peut démarrer que ses propres ordres
        if (currentUser.role === 'OPERATOR' && order.operator._id.toString() !== currentUser.userId.toString()) {
            throw new Error("Accès refusé : cet ordre est affecté à un autre opérateur.");
        }

        // 2. Empêcher le démarrage multiple (doit être PLANIFIED)
        if (order.status !== 'PLANIFIED') {
            throw new Error(`Impossible de démarrer cet ordre. Statut actuel : ${order.status}`);
        }

        // 3. Calculer les besoins et vérifier la disponibilité des matières
        for (const item of order.compositionSnapshot) {
            const requiredQuantity = order.quantityToProduce * item.quantityRequiredPerUnit;
            const rawMaterial = await MatierPr.findById(item.rawMaterial).session(session);

            if (!rawMaterial) {
                throw new Error(`Matière première introuvable dans le stock.`);
            }

            if (rawMaterial.stockQuantity < requiredQuantity) {
                throw new Error(`Stock insuffisant pour la matière '${rawMaterial.name}'. Requis : ${requiredQuantity}, Disponible : ${rawMaterial.stockQuantity}`);
            }
        }

        // 4. Déduire les matières, créer les mouvements de sortie et mettre à jour le stock
        for (const item of order.compositionSnapshot) {
            const requiredQuantity = order.quantityToProduce * item.quantityRequiredPerUnit;

            // Déduction atomique du stock
            await MatierPr.findByIdAndUpdate(
                item.rawMaterial,
                { $inc: { stockQuantity: -requiredQuantity } },
                { session }
            );

            // Enregistrer le mouvement de sortie
            await StockMovement.create([{
                rawMaterial: item.rawMaterial,
                type: 'EXIT',
                quantity: requiredQuantity,
                order: order._id,
                user: currentUser.userId
            }], { session });
        }

        // 5. Mettre à jour l'ordre : statut IN_PROGRESS et date de démarrage
        order.status = 'IN_PROGRESS';
        order.startDate = new Date();
        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        return order;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

// Terminer un ordre de fabrication
export async function completeOrderService(orderId, currentUser) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await findOrderByIdRep(orderId);
        if (!order) {
            throw new Error("Ordre de fabrication introuvable.");
        }

        // Vérification de l'opérateur
        if (currentUser.role === 'OPERATOR' && order.operator._id.toString() !== currentUser.userId.toString()) {
            throw new Error("Accès refusé : cet ordre est affecté à un autre opérateur.");
        }

        if (order.status !== 'IN_PROGRESS') {
            throw new Error("Cet ordre ne peut pas être terminé car il n'est pas en cours (IN_PROGRESS).");
        }

        // Mettre à jour le stock du produit fini fabriqué
        await Product.findByIdAndUpdate(
            order.product._id,
            { $inc: { stockQuantity: order.quantityToProduce } },
            { session }
        );

        // Mettre à jour l'ordre : statut COMPLETED et date de fin
        order.status = 'COMPLETED';
        order.endDate = new Date();
        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        return order;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}   