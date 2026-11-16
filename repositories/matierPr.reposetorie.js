import MatierPr from '../models/matierPr.model.js';
import Product from '../models/product.model.js';
import OrdreFabrication from '../models/ordreFabrication.model.js';
import StockMovement from '../models/stockMovement.model.js';

export async function createMatierPrrep(data, session) {
    await MatierPr.init();
    let {name,referance,unit,stockQuantity,alertThreshold } = data
    let matier;
    if (session) [matier] = await MatierPr.create([{name,referance,unit, stockQuantity, alertThreshold}], { session });
    else matier = await MatierPr.create({name,referance,unit, stockQuantity, alertThreshold});
    return matier
}
export async function ensureMatierPrIndexesRep() { await MatierPr.init(); }

export async function allmatierPrrep() {
    let matiers = await MatierPr.find({});
    return matiers;
}

export async function matierPrByIdrep(id) {
    let matier = await MatierPr.findOne({_id : id});
    return matier;
}

export async function matierPrByRefrep(ref) {
    let matier = await MatierPr.findOne({referance : ref?.toUpperCase()});
    return matier;
}

export async function deleteMatierrep(id) {
    let matier = await MatierPr.deleteOne({_id : id});
    return matier;
}

export async function updatMatierrep(id,data) {
    let {name,referance,unit,alertThreshold } = data
    let matier = await MatierPr.findByIdAndUpdate(
        id, 
        { name, referance, unit, alertThreshold },
        { new: true, runValidators: true }
    );
    return matier;
}

export async function lowStockRep() { return MatierPr.find({ $expr: { $lte: ['$stockQuantity', '$alertThreshold'] } }).sort({ stockQuantity: 1 }); }
export async function hasMaterialReferencesRep(id) {
    const [product, order, movement] = await Promise.all([
        Product.exists({ 'composition.rawMaterial': id }),
        OrdreFabrication.exists({ 'compositionSnapshot.rawMaterial': id }),
        StockMovement.exists({ rawMaterial: id })
    ]);
    return Boolean(product || order || movement);
}

export async function incrementStockRep(id, quantity) {
    return await MatierPr.findByIdAndUpdate(
        id,
        { $inc: { stockQuantity: quantity } },
        { new: true }
    );
}
