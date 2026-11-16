import mongoose from 'mongoose';

let connectDB = async() => {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI doit être configuré.');
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET doit contenir au moins 32 caractères.');
    try{
        let connect = await mongoose.connect(process.env.MONGO_URI);
        console.log(`mongo connected ${connect.connection.host}`);
    }catch(error){
        console.error(`Error de conexion avec databse${error.message}`);
        throw error;
    }
}

export default connectDB;
