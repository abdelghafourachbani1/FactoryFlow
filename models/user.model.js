import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

let userSchema = new mongoose.Schema({
    name : {type : String, required : true},
    email : {type : String , required : true , unique : true},
    password : {type : String , required : true },
    role : {type : String , enum :['ADMIN','OPERATOR'], default : 'OPERATOR'},
},{
    timestamps : true
});

userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
})

userSchema.methods.toJSON = function () {
    const value = this.toObject();
    delete value.password;
    return value;
};

export default mongoose.model('User',userSchema)

