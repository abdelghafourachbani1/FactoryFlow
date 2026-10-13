import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import findUserByEmailrep from '../repositories/user.reposetorie.js';

export async function loginService(email, password) {
    const user = await findUserByEmailrep(email)
    if (!user) {
        throw new Error('Invalid email or password');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid email or password');
    }
    const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );
    return {token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    };
}