const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const hrController = {
    // GET all teachers with profiling
    getAllTeachers: async (req, res) => {
        try {
            const teachers = await prisma.user.findMany({
                where: { role: 'TEACHER' },
                include: {
                    teacherProfile: true,
                    groupsTaught: {
                        include: { students: true }
                    }
                }
            });
            res.json(teachers);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "O'qituvchilar ro'yxatini yuklashda xatolik yuz berdi" });
        }
    },

    // POST calculate KPI (Salary based on percentage)
    calculateTeacherKPI: async (req, res) => {
        try {
            const { teacherId } = req.body;

            const teacher = await prisma.user.findUnique({
                where: { id: parseInt(teacherId) },
                include: { teacherProfile: true, groupsTaught: true }
            });

            if (!teacher || teacher.role !== 'TEACHER') {
                return res.status(404).json({ message: "Bunday o'qituvchi topilmadi" });
            }

            const groupIds = teacher.groupsTaught.map(g => g.id);

            // Get current month start and end dates
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            // Find all payments made to this teacher's groups this month
            const payments = await prisma.payment.findMany({
                where: {
                    groupId: { in: groupIds },
                    paymentDate: {
                        gte: firstDay,
                        lte: lastDay
                    }
                }
            });

            const totalPayments = payments.reduce((acc, curr) => acc + curr.amount, 0);
            const percentage = teacher.teacherProfile.paymentPercentage || 0;
            
            // Calculate salary
            const calculatedSalary = totalPayments * (percentage / 100);

            const updatedProfile = await prisma.teacherProfile.update({
                where: { userId: parseInt(teacherId) },
                data: { bonus: Math.round(calculatedSalary) }
            });

            res.json({ message: "Oylik maosh hisoblandi!", bonus: updatedProfile.bonus, totalPayments, percentage });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Hisoblashda xatolik yuz berdi" });
        }
    },

    // POST create teacher
    createTeacher: async (req, res) => {
        try {
            const { name, phone, password, subject, baseSalary, paymentPercentage } = req.body;

            // Create the teacher user and profile in a transaction
            const newTeacher = await prisma.user.create({
                data: {
                    name,
                    phone,
                    password: password || '123456', // simplified for demo
                    role: 'TEACHER',
                    teacherProfile: {
                        create: {
                            subject: subject || 'Noma\'lum',
                            baseSalary: parseFloat(baseSalary) || 0,
                            paymentPercentage: parseFloat(paymentPercentage) || 0,
                            rating: 0,
                            bonus: 0
                        }
                    }
                },
                include: {
                    teacherProfile: true,
                    groupsTaught: { include: { students: true } }
                }
            });

            res.status(201).json({ message: "Yangi o'qituvchi qo'shildi!", teacher: newTeacher });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "O'qituvchi qo'shishda xatolik yuz berdi" });
        }
    },

    // DELETE teacher
    deleteTeacher: async (req, res) => {
        try {
            const { id } = req.params;
            // Profile is deleted first due to foreign key constraints, though deleteMany works around constraints safely
            await prisma.teacherProfile.deleteMany({ where: { userId: parseInt(id) } });
            await prisma.user.delete({ where: { id: parseInt(id) } });
            res.json({ message: "O'qituvchi o'chirildi" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "O'chirishda xatolik yuz berdi. Balki guruhlarga biriktirilgan?" });
        }
    },

    // PUT update teacher
    updateTeacher: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, phone, password, subject, paymentPercentage } = req.body;

            const updateData = { name, phone };
            if (password && password.trim() !== '') {
                updateData.password = password; // simple demo, ideally hashed
            }

            const updatedTeacher = await prisma.user.update({
                where: { id: parseInt(id) },
                data: updateData
            });

            await prisma.teacherProfile.upsert({
                where: { userId: parseInt(id) },
                update: {
                    subject: subject || 'Noma\'lum',
                    paymentPercentage: parseFloat(paymentPercentage) || 0
                },
                create: {
                    userId: parseInt(id),
                    subject: subject || 'Noma\'lum',
                    baseSalary: 0,
                    paymentPercentage: parseFloat(paymentPercentage) || 0,
                    rating: 0,
                    bonus: 0
                }
            });

            res.json({ message: "O'qituvchi ma'lumotlari yangilandi!" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Xatolik: " + error.message });
        }
    },
    // DELETE teacher
    deleteTeacher: async (req, res) => {
        try {
            const { id } = req.params;
            // Profile is deleted first due to foreign key constraints, though deleteMany works around constraints safely
            await prisma.teacherProfile.deleteMany({ where: { userId: parseInt(id) } });
            await prisma.user.delete({ where: { id: parseInt(id) } });
            res.json({ message: "O'qituvchi o'chirildi" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "O'chirishda xatolik yuz berdi. Balki guruhlarga biriktirilgan?" });
        }
    },

    // POST pay teacher (mock transaction that resets bonus)
    payTeacher: async (req, res) => {
        try {
            const { teacherId } = req.body;
            await prisma.teacherProfile.updateMany({
                where: { userId: parseInt(teacherId) },
                data: { bonus: 0 }
            });
            res.json({ message: "To'lov o'tkazildi" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "To'lov amaliyotida xato" });
        }
    }
};

module.exports = hrController;
