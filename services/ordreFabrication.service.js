import { 
    createOrderRep, 
    findAllOrdersRep, 
    findOrderByIdRep, 
    updateOrderRep 
} from '../repositories/ordreFabrication.repository.js';
import { findOperatorOrdersRep, changeOrderStatusInSession } from '../repositories/ordreFabrication.repository.js';
import { productByIdRep } from '../repositories/product.repository.js';
import mongoose from 'mongoose';
import { findUserWithRoleRep } from '../repositories/user.reposetorie.js';
import { findMaterialInSession, deductMaterialInSession, addFinishedProductInSession, createStockMovementInSession } from '../repositories/stock.repository.js';

export function calculateMaterialRequirements(order) {
    return order.compositionSnapshot.map(item => ({
        rawMaterial: item.rawMaterial?._id || item.rawMaterial,
        quantity: Number(order.quantityToProduce) * Number(item.quantityRequiredPerUnit)
    }));
}

const businessError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

export async function createOrderService(data, dependencies = {}) {
    const getProduct = dependencies.findProduct || productByIdRep;
    const getUser = dependencies.findUser || findUserWithRoleRep;
    const saveOrder = dependencies.createOrder || createOrderRep;
    const { product: productId, operator: operatorId, quantityToProduce, plannedDate, reference } = data;

    // 1. Verify Product exists and has a composition
    if (!mongoose.isValidObjectId(productId) || !mongoose.isValidObjectId(operatorId)) throw new Error('Produit ou opérateur invalide.');
    if (!Number.isFinite(Number(quantityToProduce)) || Number(quantityToProduce) <= 0) throw new Error('La quantité à fabriquer doit être strictement positive.');
    if (!plannedDate || Number.isNaN(new Date(plannedDate).getTime())) throw new Error('Une date de planification valide est obligatoire.');
    const product = await getProduct(productId);
    if (!product) {
        throw new Error("Produit introuvable.");
    }
    if (!product.composition || product.composition.length === 0) {
        throw new Error("Impossible de créer un ordre pour un produit sans composition (recette).");
    }

    // 2. Verify Operator exists
    const operator = await getUser(operatorId);
    if (!operator) {
        throw new Error("Opérateur introuvable.");
    }
    if (operator.role !== 'OPERATOR') throw new Error('L’ordre doit être affecté à un opérateur.');

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

    return saveOrder(orderData);
}

export async function getAllOrdersService(queryParams, operatorId, findOrders = findAllOrdersRep) {
    const { status, product, startDate, endDate, page = 1, limit = 10 } = queryParams;

    const pageNumber = Number(page), limitNumber = Number(limit);
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || !Number.isInteger(limitNumber) || limitNumber < 1 || limitNumber > 100) throw new Error('Pagination invalide (page >= 1, limit entre 1 et 100).');
    if (status && !['PLANIFIED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) throw new Error('Statut invalide.');
    if (product && !mongoose.isValidObjectId(product)) throw new Error('Identifiant de produit invalide.');
    let filterQuery = {};
    if (operatorId) filterQuery.operator = operatorId;

    // Filters
    if (status) filterQuery.status = status;
    if (product) filterQuery.product = product;
    if (startDate || endDate) {
        filterQuery.plannedDate = {};
        if ((startDate && Number.isNaN(new Date(startDate).getTime())) || (endDate && Number.isNaN(new Date(endDate).getTime()))) throw new Error('Période invalide.');
        if (startDate) filterQuery.plannedDate.$gte = new Date(startDate);
        if (endDate) {
            filterQuery.plannedDate.$lte = new Date(endDate);
            if (/^\d{4}-\d{2}-\d{2}$/.test(endDate)) filterQuery.plannedDate.$lte.setUTCHours(23, 59, 59, 999);
        }
        if (filterQuery.plannedDate.$gte && filterQuery.plannedDate.$lte && filterQuery.plannedDate.$gte > filterQuery.plannedDate.$lte) throw new Error('La date de début doit précéder la date de fin.');
    }

    const skip = (pageNumber - 1) * limitNumber;
    const { orders, total } = await findOrders(filterQuery, skip, limitNumber);

    return {
        total,
        page: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        data: orders
    };
}

export async function getMyOrdersService(userId, status) { return findOperatorOrdersRep(userId, status); }

export async function getOrderByIdService(id) {
    if (!mongoose.isValidObjectId(id)) throw new Error('Ordre introuvable.');
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
        throw businessError("Modification impossible : cet ordre de fabrication n'est plus au statut PLANIFIED.", 409);
    }
    const allowed = ['reference', 'quantityToProduce', 'operator', 'plannedDate'];
    if (Object.keys(data).some(key => !allowed.includes(key))) throw new Error('Champ de modification non autorisé.');
    if (data.quantityToProduce !== undefined && Number(data.quantityToProduce) <= 0) throw new Error('La quantité doit être strictement positive.');
    if (data.operator !== undefined) {
        const newOperator = await findUserWithRoleRep(data.operator);
        if (!newOperator || newOperator.role !== 'OPERATOR') throw new Error('L’ordre doit être affecté à un opérateur existant.');
    }
    if (data.plannedDate !== undefined && Number.isNaN(new Date(data.plannedDate).getTime())) throw new Error('Date de planification invalide.');

    return await updateOrderRep(id, data);
}

export async function cancelOrderService(id) {
    const order = await getOrderByIdService(id);

    // Rule: Cancellation only allowed if status is PLANIFIED
    if (order.status !== 'PLANIFIED') {
        throw businessError("Annulation impossible : cet ordre de fabrication n'est plus au statut PLANIFIED.", 409);
    }

    return await updateOrderRep(id, { status: 'CANCELLED' });
}


export async function startOrderService(orderId, currentUser, dependencies = {}) {
    const startSession = dependencies.startSession || (() => mongoose.startSession());
    const getOrder = dependencies.findOrder || findOrderByIdRep;
    const findMaterial = dependencies.findMaterial || findMaterialInSession;
    const deductMaterial = dependencies.deductMaterial || deductMaterialInSession;
    const recordMovement = dependencies.recordMovement || createStockMovementInSession;
    const changeStatus = dependencies.changeStatus || changeOrderStatusInSession;
    const session = await startSession();
    session.startTransaction();

    try {
        const order = await getOrder(orderId, session);
        if (!order) {
            throw businessError("Ordre de fabrication introuvable.", 404);
        }

        // 1. Vérification du rôle Opérateur : ne peut démarrer que ses propres ordres
        if (currentUser.role === 'OPERATOR' && order.operator._id.toString() !== currentUser.userId.toString()) {
            throw businessError("Accès refusé : cet ordre est affecté à un autre opérateur.", 403);
        }

        // 2. Empêcher le démarrage multiple (doit être PLANIFIED)
        if (order.status !== 'PLANIFIED') {
            throw businessError(`Impossible de démarrer cet ordre. Statut actuel : ${order.status}`, 409);
        }

        // 3. Calculer les besoins et vérifier la disponibilité des matières
        for (const { rawMaterial: materialId, quantity: requiredQuantity } of calculateMaterialRequirements(order)) {
            const rawMaterial = await findMaterial(materialId, session);

            if (!rawMaterial) {
                throw businessError('Matière première introuvable dans le stock.', 404);
            }

            if (rawMaterial.stockQuantity < requiredQuantity) {
                throw businessError(`Stock insuffisant pour la matière '${rawMaterial.name}'. Requis : ${requiredQuantity}, Disponible : ${rawMaterial.stockQuantity}`, 409);
            }
        }

        // 4. Déduire les matières, créer les mouvements de sortie et mettre à jour le stock
        for (const { rawMaterial: materialId, quantity: requiredQuantity } of calculateMaterialRequirements(order)) {

            // Déduction atomique du stock
            const updatedMaterial = await deductMaterial(materialId, requiredQuantity, session);
            if (!updatedMaterial) throw businessError('Le stock a changé pendant le démarrage. Réessayez.', 409);
            // Enregistrer le mouvement de sortie
            await recordMovement({
                rawMaterial: materialId,
                type: 'EXIT',
                quantity: requiredQuantity,
                order: order._id,
                user: currentUser.userId
            }, session);
        }

        // 5. Mettre à jour l'ordre : statut IN_PROGRESS et date de démarrage
        const changed = await changeStatus(order._id, 'PLANIFIED', 'IN_PROGRESS', 'startDate', new Date(), session);
        if (!changed.modifiedCount) throw businessError('Cet ordre a déjà été démarré.', 409);
        order.status = 'IN_PROGRESS'; order.startDate = new Date();

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
export async function completeOrderService(orderId, currentUser, dependencies = {}) {
    const startSession = dependencies.startSession || (() => mongoose.startSession());
    const getOrder = dependencies.findOrder || findOrderByIdRep;
    const addFinishedProduct = dependencies.addFinishedProduct || addFinishedProductInSession;
    const changeStatus = dependencies.changeStatus || changeOrderStatusInSession;
    const session = await startSession();
    session.startTransaction();

    try {
        const order = await getOrder(orderId, session);
        if (!order) {
            throw businessError("Ordre de fabrication introuvable.", 404);
        }

        // Vérification de l'opérateur
        if (currentUser.role === 'OPERATOR' && order.operator._id.toString() !== currentUser.userId.toString()) {
            throw businessError("Accès refusé : cet ordre est affecté à un autre opérateur.", 403);
        }

        if (order.status !== 'IN_PROGRESS') {
            throw businessError("Cet ordre ne peut pas être terminé car il n'est pas en cours (IN_PROGRESS).", 409);
        }

        // Mettre à jour le stock du produit fini fabriqué
        const updatedProduct = await addFinishedProduct(order.product._id, order.quantityToProduce, session);
        if (!updatedProduct) throw businessError('Produit fini introuvable.', 404);

        // Mettre à jour l'ordre : statut COMPLETED et date de fin
        const changed = await changeStatus(order._id, 'IN_PROGRESS', 'COMPLETED', 'endDate', new Date(), session);
        if (!changed.modifiedCount) throw businessError('Cet ordre ne peut plus être terminé.', 409);
        order.status = 'COMPLETED'; order.endDate = new Date();

        await session.commitTransaction();
        session.endSession();

        return order;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}
