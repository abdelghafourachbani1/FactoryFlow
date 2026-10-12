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

userSchema.pre('save', async (next) => {
    if (!this.isModified("password")) return next();
    try {
        const saltRounds = 10;
        this.password = await bcrypt.hash(this.password, saltRounds);
        next();
    } catch (error) {
        next(error);
    }
})

export default mongoose.model('User',userSchema)

