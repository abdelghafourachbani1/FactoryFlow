import User from "../models/user.model.js";

export async function findUserByEmailrep(email) {
    let user = await User.findOne({email : email})
    return user;
}

export async function createUserRep(data) { await User.init(); return User.create(data); }
export async function findUserByIdRep(id) { return User.findById(id).select('-password'); }
export async function findUserWithRoleRep(id) { return User.findById(id).select('role name email'); }
export async function findOperatorsRep() { return User.find({ role: 'OPERATOR' }).select('-password'); }
