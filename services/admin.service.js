import { findAdmin , createAdminrep} from "../repositories/admin.reposetorie.js";

export async function checkadmin() {
    let admin = await findAdmin();
    return admin;
}

export async function createAdminser(name,email,password) {
    let existingAdmin = await findAdmin(); 
    if(existingAdmin){
        throw new Error('app already installed ')
    }
    let newadmin = await createAdminrep(name,email,password);
    return newadmin;
}