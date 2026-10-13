import { loginService } from '../services/user.service.js';

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
            message: error.message || 'Server error during login' 
        });
    }
}
