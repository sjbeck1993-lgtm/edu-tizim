const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Ruxsat berilmagan! Token topilmadi.' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_123', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token muddati tugagan yoki yaroqsiz.' });
        }
        req.user = user;
        next();
    });
};

const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Siz bu amalni bajarish uchun yetarli huquqqa ega emassiz!' });
        }
        next();
    };
};

module.exports = { authenticateToken, authorizeRole };
