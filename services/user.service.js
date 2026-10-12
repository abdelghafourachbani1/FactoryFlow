import { findUserByEmailrep } from "../repositories/user.reposetorie";
imp

export async function findUserByEmailser(email,password) {
    let user = await findUserByEmailrep(email);
    if(!user){
        throw new Error('invalid email');
    }
    let ismatch = await bcrypt.compare(password,user.password)
    if(!ismatch){
        throw new Error('invalid email or password');
    }
    let token = jwt.sign({userId: user._id , role : user.role},process.env.JWT_SECRET,{expiresIn : '1d'});
    return {token , user : { id: user._id, name: user.name, email: user.email, role: user.role }}
}
