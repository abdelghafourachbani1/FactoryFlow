import User from '../models/user.model.js';

export async function findAdmin() {
    let admin = await User.findOne({role : 'ADMIN'})
    return admin;
}

export async function createAdminrep(name,email,password) {
    let role = 'ADMIN';
    let newadmin = await User.create({name,email,password,role})
    return newadmin;
}