const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Ruxsat berilmagan! Token topilmadi.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token muddati tugagan yoki yaroqsiz.' });
        }

        try {
            // tenantId har doim bazadan yangilanadi — token eskirgan (tenant qo'shilishidan oldingi) bo'lsa ham to'g'ri ishlashi uchun
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: { tenantId: true }
            });

            req.user = { ...decoded, tenantId: user?.tenantId ?? null };
            next();
        } catch (dbError) {
            next(dbError);
        }
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
