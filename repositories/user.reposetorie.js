import User from "../models/user.model";

export async function findUserByEmailrep(email) {
    let user = await User.findOne({email : email})
    return user;
}