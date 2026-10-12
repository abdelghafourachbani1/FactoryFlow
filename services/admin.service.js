import { findAdmin } from "../repositories/admin.reposetorie.js";

export async function checkadmin() {
    let admin = await findAdmin();
    return admin;
}