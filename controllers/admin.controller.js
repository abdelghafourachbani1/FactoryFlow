import { checkadmin , createAdminser} from "../services/admin.service.js";

export async function admincheck(req,res) {
    try{
        let isInstalled = await checkadmin();
        return res.status(200).json({isInstalled });
    }catch(error){
            return res.status(500).json({ message: "Internal server error" });
    }
}

export async function createAdminCon(req,res) {
    try{
        let {name , email , password }= req.body
        let newadmin = await createAdminser(name,email,password)
        return res.status(201).json({ 
            success: true, 
            message: "app installed succesfully", 
            user: { id: newadmin._id, name: newadmin.name, email: newadmin.email, role: newadmin.role } 
        });
    }catch(error){
        res.status(error.statusCode || (error.code === 11000 ? 409 : 400)).json({ success: false, message: error.message });
    }
}
