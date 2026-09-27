const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

const authController = {
    login: async (req, res) => {
        try {
            let { phone, password } = req.body;
            if (process.env.NODE_ENV !== 'production') {
                console.log('--- LOGIN ATTEMPT ---', { phone });
            }

            if (!phone || !password) {
                return res.status(400).json({ message: "Telefon raqam va parol kiritilishi shart." });
            }

            // Clean phone number (remove spaces, etc)
            phone = phone.trim().replace(/\s/g, '');

            // Find user
            const user = await prisma.user.findUnique({ where: { phone } });
            if (!user) {
                return res.status(401).json({ message: "Telefon raqam yoki parol xato!" });
            }

            // Check Password
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ message: "Telefon raqam yoki parol xato!" });
            }

            // Generate JWT Token
            const token = jwt.sign(
                { id: user.id, name: user.name, role: user.role },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: "Muvaffaqiyatli kirdingiz!",
                token,
                user: { id: user.id, name: user.name, role: user.role }
            });

        } catch (error) {
            console.error("Login Error:", error);
            res.status(500).json({ message: "Serverda xatolik yuz berdi" });
        }
    },

    getMe: async (req, res) => {
        try {
            // Returns user info from token (handled by middleware)
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: { id: true, name: true, phone: true, role: true }
            });
            res.json(user);
        } catch (error) {
            res.status(500).json({ message: "Serverda xatolik" });
        }
    },

    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ message: "Joriy va yangi parol kiritilishi shart." });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ message: "Yangi parol kamida 6 belgidan iborat bo'lishi kerak." });
            }

            const user = await prisma.user.findUnique({ where: { id: req.user.id } });
            if (!user) {
                return res.status(404).json({ message: "Foydalanuvchi topilmadi." });
            }

            const validPassword = await bcrypt.compare(currentPassword, user.password);
            if (!validPassword) {
                return res.status(401).json({ message: "Joriy parol noto'g'ri." });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await prisma.user.update({
                where: { id: req.user.id },
                data: { password: hashedPassword }
            });

            res.json({ message: "Parol muvaffaqiyatli o'zgartirildi!" });
        } catch (error) {
            console.error("Change password error:", error);
            res.status(500).json({ message: "Serverda xatolik yuz berdi" });
        }
    }
};

module.exports = authController;
