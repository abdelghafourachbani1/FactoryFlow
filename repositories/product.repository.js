import Product from '../models/product.model.js';

export async function createProductRep(data) {
    return await Product.create(data);
}

export async function allProductsRep() {
    return await Product.find().populate('composition.rawMaterial');
}

export async function productByIdRep(id) {
    return await Product.findById(id).populate('composition.rawMaterial');
}

export async function productByRefRep(reference) {
    return await Product.findOne({ reference });
}

export async function updateProductRep(id, data) {
    return await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('composition.rawMaterial');
}

export async function deleteProductRep(id) {
    return await Product.findByIdAndDelete(id);
}