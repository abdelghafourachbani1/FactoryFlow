import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export async function authmiddleware(req, res, next) {
    let authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            let token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);            
            req.user = await User.findById(decoded.userId).select('-password');
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'User with this token not found' });
            }
            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ success: false, message: 'Token is invalid' });
        }
    } else {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
}