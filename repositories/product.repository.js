import Product from '../models/product.model.js';
import OrdreFabrication from '../models/ordreFabrication.model.js';

export async function createProductRep(data) {
    await Product.init();
    return await Product.create(data);
}

export async function allProductsRep() {
    return await Product.find().populate('composition.rawMaterial');
}

export async function productByIdRep(id) {
    return await Product.findById(id).populate('composition.rawMaterial');
}

export async function productByRefRep(reference) {
    return await Product.findOne({ reference: reference?.toUpperCase() });
}

export async function updateProductRep(id, data) {
    return await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('composition.rawMaterial');
}

export async function deleteProductRep(id) {
    return await Product.findByIdAndDelete(id);
}

export async function productHasOrdersRep(id) { return Boolean(await OrdreFabrication.exists({ product: id })); }
