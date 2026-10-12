import { findUserByEmailser } from "../services/user.service";

export async function findUserByEmailcon(req,res) {
let authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            let token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);            
            req.user = await User.findUserByEmailser(decoded.userId).select('-password');
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'User with this token not found' });
            }
            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
        }
    } else {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }
}
