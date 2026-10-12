export async function authmiddleware(req,res,next) {
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        try{
            let token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'user with this token not found' });
            }
            next();
        }catch(error){
            console.error(error);
            return res.status(401).json({ success: false, message: 'token non valid' });
    };
}
}