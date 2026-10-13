import mongoose from 'mongoose';

const ordreFabricationSchema = new mongoose.Schema({
    reference: {type: String,required: true,unique: true,uppercase: true},
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantityToProduce: {
        type: Number,
        required: true,
        min: 1
    },
    operator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['PLANIFIED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        default: 'PLANIFIED'
    },
    compositionSnapshot: [
        {
            rawMaterial: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'MatierPr',
                required: true
            },
            quantityRequiredPerUnit: {
                type: Number,
                required: true
            }
        }
    ],
    plannedDate: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.model('OrdreFabrication', ordreFabricationSchema);