import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema({
    rawMaterial: {type: mongoose.Schema.Types.ObjectId,ref: 'MatierPr',required: true},
    type: {type: String,enum: ['ENTRY', 'EXIT'], required: true},
    quantity: {type: Number,required: true,min: 0.01},
    order: {type: mongoose.Schema.Types.ObjectId,ref: 'OrdreFabrication',required: false },
    user: {type: mongoose.Schema.Types.ObjectId,ref: 'User',required: true}
}, {
    timestamps: true
});

export default mongoose.model('StockMovement', stockMovementSchema);