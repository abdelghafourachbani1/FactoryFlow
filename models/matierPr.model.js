import mongoose from "mongoose";

let MatierPrShema = new mongoose.Schema({
    name : {type : String , required : true, trim: true},
    referance : {type : String , required : true , unique : true, uppercase: true, trim: true},
    unit : {type : String , required : true, trim: true},
    stockQuantity : {type : Number , required : true , default : 0, min: 0},
    alertThreshold: {type: Number, required: true, default: 0, min: 0}
},{timestamps : true});

export default mongoose.model('MatierPr',MatierPrShema);
