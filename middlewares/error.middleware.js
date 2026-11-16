export function errorHandler(err, req, res, next) {
    console.error(`Erreur interceptée : ${err.message}`);
    let statusCode = err.statusCode || err.status || 500;
    if (err.name === 'CastError') {
        statusCode = 404;
        err.message = "Ressource introuvable (ID invalide).";
    } else if (err.name === 'ValidationError') {
        statusCode = 400;
    } else if (err.code === 11000) {
        statusCode = 409;
        err.message = 'Une ressource avec cette référence existe déjà.';
    }
    return res.status(statusCode).json({
        success: false,
        message: err.message || "Erreur interne du serveur.",
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}
