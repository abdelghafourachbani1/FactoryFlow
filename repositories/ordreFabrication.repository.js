import OrdreFabrication from '../models/ordreFabrication.model.js';

export async function createOrderRep(data) {
    return await OrdreFabrication.create(data);
}

export async function findAllOrdersRep(filterQuery, skip, limit) {
    const orders = await OrdreFabrication.find(filterQuery)
        .populate('product', 'name reference price')
        .populate('operator', 'name email role')
        .populate('compositionSnapshot.rawMaterial', 'name unit')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const total = await OrdreFabrication.countDocuments(filterQuery);
    return { orders, total };
}

export async function findOrderByIdRep(id) {
    return await OrdreFabrication.findById(id)
        .populate('product')
        .populate('operator', 'name email role')
        .populate('compositionSnapshot.rawMaterial');
}

export async function updateOrderRep(id, data) {
    return await OrdreFabrication.findByIdAndUpdate(id, data, { new: true, runValidators: true })
        .populate('product')
        .populate('operator');
}