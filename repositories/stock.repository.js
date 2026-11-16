import MatierPr from '../models/matierPr.model.js';
import Product from '../models/product.model.js';
import StockMovement from '../models/stockMovement.model.js';

export async function findMaterialInSession(id, session) { return MatierPr.findById(id).session(session); }
export async function addMaterialStockInSession(id, quantity, session) {
  return MatierPr.findByIdAndUpdate(id, { $inc: { stockQuantity: quantity } }, { new: true, session });
}
export async function deductMaterialInSession(id, quantity, session) {
  return MatierPr.findOneAndUpdate({ _id: id, stockQuantity: { $gte: quantity } }, { $inc: { stockQuantity: -quantity } }, { session, new: true });
}
export async function addFinishedProductInSession(id, quantity, session) {
  return Product.findByIdAndUpdate(id, { $inc: { stockQuantity: quantity } }, { session, new: true });
}
export async function createStockMovementInSession(data, session) { return StockMovement.create([data], { session }); }
export async function listStockMovements(filter, limit) {
  return StockMovement.find(filter).populate('rawMaterial', 'name referance unit').populate('user', 'name email').populate('order', 'reference').sort({ createdAt: -1 }).limit(limit);
}
