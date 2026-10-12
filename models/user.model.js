import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

let userSchema = new mongoose.Schema({
    name : {type : String, required : true},
    email : {type : String , required : true , unique : true},
    password : {type : String , required : true },
    role : {type : String , enum :['ADMIN','OPERATOR'], default : 'OPERATOR'},
},{
    timestamp : true
});



