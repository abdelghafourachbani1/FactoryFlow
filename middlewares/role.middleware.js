export function authorizeRoles(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Non autorisé. Utilisateur non authentifié.' });}
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: `Accès refusé. Le rôle '${req.user.role}' n'a pas les permissions nécessaires.` });
        }
        next();
    };
}