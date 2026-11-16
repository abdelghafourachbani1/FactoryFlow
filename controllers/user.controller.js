import { loginService } from '../services/user.service.js';
import { createOperatorService, createAdminUserService, getProfileService } from '../services/user.service.js';
import { findOperatorsRep } from '../repositories/user.reposetorie.js';

export async function loginCtrl(req, res) {
    try {
        const { email, password } = req.body;
        const result = await loginService(email, password);
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            ...result
        });
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: error.message  
        });
    }
}

export async function profileCtrl(req, res) { res.json({ success: true, data: await getProfileService(req.user.userId) }); }
export async function createOperatorCtrl(req, res) {
    try { const user = await createOperatorService(req.body); return res.status(201).json({ success: true, data: user }); }
    catch (error) { return res.status(error.statusCode || (error.code === 11000 ? 409 : 400)).json({ success: false, message: error.message }); }
}
export async function createAdminUserCtrl(req, res) {
    try { const user = await createAdminUserService(req.body); return res.status(201).json({ success: true, data: user }); }
    catch (error) { return res.status(error.statusCode || (error.code === 11000 ? 409 : 400)).json({ success: false, message: error.message }); }
}
export async function listOperatorsCtrl(req, res) { res.json({ success: true, data: await findOperatorsRep() }); }
