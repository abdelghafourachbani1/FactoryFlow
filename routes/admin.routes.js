import { admincheck , createAdminCon} from "../controllers/admin.controller.js";
import { Router } from "express";

const route = Router();

route.get('/status',admincheck);
route.post('/',createAdminCon);

export default route;