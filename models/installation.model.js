import mongoose from 'mongoose';
export default mongoose.model('Installation', new mongoose.Schema({ key: { type: String, unique: true, required: true } }, { timestamps: true }));
