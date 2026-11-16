import OrdreFabrication from '../models/ordreFabrication.model.js';

export async function createOrderRep(data) {
    await OrdreFabrication.init();
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

export async function findOperatorOrdersRep(operatorId, status) {
    const filter = { operator: operatorId };
    if (status) filter.status = status;
    return OrdreFabrication.find(filter).populate('product', 'name reference').populate('compositionSnapshot.rawMaterial', 'name unit').sort({ createdAt: -1 });
}

export async function changeOrderStatusInSession(id, fromStatus, toStatus, dateField, date, session) {
    return OrdreFabrication.updateOne({ _id: id, status: fromStatus }, { $set: { status: toStatus, [dateField]: date } }, { session });
}

export async function findOrderByIdRep(id, session) {
    let query = OrdreFabrication.findById(id)
        .populate('product')
        .populate('operator', 'name email role')
        .populate('compositionSnapshot.rawMaterial');
    if (session) query = query.session(session);
    return query;
}

export async function updateOrderRep(id, data) {
    return await OrdreFabrication.findByIdAndUpdate(id, data, { new: true, runValidators: true })
        .populate('product')
        .populate('operator');
}
