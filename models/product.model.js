import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    reference: { type: String, required: true, unique: true, uppercase: true, trim: true },
    price: { type: Number, default: 0, min: 0 },
    stockQuantity: { type: Number, default: 0, min: 0 },
    composition: [{
            rawMaterial: { type: mongoose.Schema.Types.ObjectId, ref: 'MatierPr', required: true },
            quantityRequired: { type: Number, required: true, min: 0.0000001 }
        }]
}, 
{
    timestamps: true
});

export default mongoose.model('Product', productSchema);
