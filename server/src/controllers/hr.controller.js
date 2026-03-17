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

    // POST calculate KPI
    calculateTeacherKPI: async (req, res) => {
        try {
            const { teacherId } = req.body;

            const teacher = await prisma.user.findUnique({
                where: { id: parseInt(teacherId) },
                include: { teacherProfile: true, groupsTaught: { include: { students: true } } }
            });

            if (!teacher || teacher.role !== 'TEACHER') {
                return res.status(404).json({ message: "Bunday o'qituvchi topilmadi" });
            }

            // Business logic mapping: 1 student = 15 coins for bonus example
            let totalStudentsCount = 0;
            teacher.groupsTaught.forEach(group => {
                totalStudentsCount += group.students.length;
            });

            // Simple mock logic: Rating determines bonus multiplication
            const calculatedBonus = totalStudentsCount * 15000 * (teacher.teacherProfile.rating / 5);

            const updatedProfile = await prisma.teacherProfile.update({
                where: { userId: parseInt(teacherId) },
                data: { bonus: Math.round(calculatedBonus) }
            });

            res.json({ message: "KPI Bonus hisoblandi!", bonus: updatedProfile.bonus });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "KPI hisoblashda xatolik yuz berdi" });
        }
    },

    // POST create teacher
    createTeacher: async (req, res) => {
        try {
            const { name, phone, password, subject, baseSalary } = req.body;

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
