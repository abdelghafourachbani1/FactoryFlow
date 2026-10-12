import { admincheck } from "../controllers/admin.controller.js";
import { Router } from "express";

const route = Router();

route.get('/status',admincheck);

export default route;