import User from '../models/user.model.js';

export async function findAdmin() {
    let admin = await User.findOne({role : 'ADMIN'})
    return admin;
}