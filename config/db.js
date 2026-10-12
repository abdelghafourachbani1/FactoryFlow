import mongoose from 'mongoose';

let connectDB = async() => {
    try{
        let connect = await mongoose.connect(process.env.MONGO_URI);
        console.log(`mongo connected ${connect.connection.host}`);
    }catch(error){
        console.error(`Error de conexion avec databse${error.message}`);
        process.exit(1);
    }
}

export default connectDB;