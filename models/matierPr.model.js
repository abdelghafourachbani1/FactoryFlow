import mongoose from "mongoose";

let MatierPrShema = new mongoose.Schema({
    name : {type : String , required : true},
    referance : {type : String , required : true , unique : true},
    unit : {type : String , required : true},
    stockQuantity : {type : Number , required :  true , default : 0}
},{timestamps : true});

export default mongoose.model('MatierPr',MatierPrShema);