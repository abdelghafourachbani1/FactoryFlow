import { checkadmin } from "../services/admin.service.js";

export async function admincheck(req,res) {
    try{
        let admin = await checkadmin();
        let isInstalled = !!admin
        return res.status(200).json({isInstalled });
    }catch(error){
        return res.status(500).json({ message: "Internal server error" });
    }
}