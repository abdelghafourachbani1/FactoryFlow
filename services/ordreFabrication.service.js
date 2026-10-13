import { 
    createOrderRep, 
    findAllOrdersRep, 
    findOrderByIdRep, 
    updateOrderRep 
} from '../repositories/ordreFabrication.repository.js';
import { productByIdRep } from '../repositories/product.repository.js';
import User from '../models/user.model.js';

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