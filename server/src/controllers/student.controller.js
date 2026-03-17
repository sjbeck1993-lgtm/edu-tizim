const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get full profile stats for the logged-in student
exports.getStudentDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                studentProfile: {
                    include: {
                        group: {
                            include: { course: true }
                        }
                    }
                },
                attendances: true,
                submissions: {
                    include: { task: true }
                }
            }
        });

        if (!user || user.role !== 'STUDENT') {
            return res.status(403).json({ message: "Siz o'quvchi emassiz" });
        }

        // Calculations
        const attendances = user.attendances || [];
        const presentCount = attendances.filter(a => a.present).length;
        const totalClasses = attendances.length;
        const attendancePercentage = totalClasses === 0 ? 100 : Math.round((presentCount / totalClasses) * 100);

        const submissions = user.submissions || [];
        const gradedSubs = submissions.filter(s => s.score !== null);
        const avgScore = gradedSubs.length === 0 ? 0 : Math.round(gradedSubs.reduce((acc, curr) => acc + curr.score, 0) / gradedSubs.length);

        // Subject breakdown
        const subjects = submissions.map(s => ({
            id: s.id,
            title: s.task.title,
            score: s.score || 0
        })).slice(0, 5); // Take recent 5

        const profile = user.studentProfile || {};

        res.json({
            name: user.name,
            courseName: profile.group?.course?.name || "Biriktirilmagan",
            groupName: profile.group?.name || "Biriktirilmagan",
            classDays: profile.group?.classDays || [],
            classTime: profile.group?.classTime || '',
            level: profile.level || 1,
            coins: profile.coins || 0,
            xp: (profile.level || 1) * 850, // Mock XP calc
            avgScore,
            attendancePercentage,
            subjects
        });

    } catch (error) {
        console.error("Student dashboard error:", error);
        res.status(500).json({ message: "Server xatosi" });
    }
};

const bcrypt = require('bcrypt');

// Admin qism uchun O'quvchilarni olish
exports.getAllStudents = async (req, res) => {
    try {
        const students = await prisma.user.findMany({
            where: { role: 'STUDENT' },
            include: {
                studentProfile: {
                    include: { group: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "O'quvchilarni yuklashda xato" });
    }
};

// Yangi o'quvchi (Student) yaratish (Admin orqali)
exports.createStudent = async (req, res) => {
    try {
        const { name, phone, password, groupId, joinedAt } = req.body;
        const hashedPassword = await bcrypt.hash(password || '123456', 10);

        const newStudent = await prisma.user.create({
            data: {
                name,
                phone,
                password: hashedPassword,
                role: 'STUDENT',
                studentProfile: {
                    create: {
                        groupId: groupId ? parseInt(groupId) : null,
                        joinedAt: joinedAt ? new Date(joinedAt) : new Date()
                    }
                }
            },
            include: { studentProfile: true }
        });

        // Agar guruhga qo'shilgan bo'lsa, avtomatik birinchi qarzni yozamiz
        if (groupId) {
            const group = await prisma.group.findUnique({
                where: { id: parseInt(groupId) },
                include: { course: true }
            });
            if (group && group.course) {
                const joinDateObj = joinedAt ? new Date(joinedAt) : new Date();

                const monthsName = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
                const formattedDate = monthsName[joinDateObj.getMonth()];

                await prisma.payment.create({
                    data: {
                        studentId: newStudent.id,
                        amount: group.course.monthlyPrice,
                        month: formattedDate,
                        periodStart: joinDateObj,
                        method: '-',
                        status: 'debt'
                    }
                });
            }
        }

        res.status(201).json({ message: "O'quvchi qo'shildi!", student: newStudent });
    } catch (error) {
        require('fs').appendFileSync('student-error.log', new Date().toISOString() + ' ERROR in createStudent: ' + error.stack + '\nBody: ' + JSON.stringify(req.body) + '\n\n');
        if (error.code === 'P2002') return res.status(400).json({ message: "Bu raqam band!" });
        res.status(500).json({ message: "Xatolik yuz berdi! Balki raqam banddir." });
    }
};

// O'quvchi ma'lumotlarini / guruhini tahrirlash
exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, password, groupId, joinedAt } = req.body;

        // Asosiy ma'lumotlarni yangilash uchun obyekt
        const updateData = { name, phone };

        // Agar parol ham kiritilgan bo'lsa, almashtiramiz
        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        // 1. Userni yangilaymiz
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        // 2. StudentProfileni yangilaymiz (yoki yo'q bo'lsa yaratamiz)
        const profile = await prisma.studentProfile.findUnique({
            where: { userId: parseInt(id) }
        });

        if (profile) {
            await prisma.studentProfile.update({
                where: { userId: parseInt(id) },
                data: {
                    groupId: groupId ? parseInt(groupId) : null,
                    joinedAt: joinedAt ? new Date(joinedAt) : new Date()
                }
            });
        } else {
            await prisma.studentProfile.create({
                data: {
                    userId: parseInt(id),
                    groupId: groupId ? parseInt(groupId) : null,
                    joinedAt: joinedAt ? new Date(joinedAt) : new Date()
                }
            });
        }

        res.json({ message: "O'quvchi ma'lumotlari yangilandi!" });
    } catch (error) {
        console.error(error);
        if (error.code === 'P2002') return res.status(400).json({ message: "Bu telefon raqam boshqa o'quvchida bor!" });
        res.status(500).json({ message: "Tahrirlashda xatolik yuz berdi" });
    }
};

// O'quvchini guruhdan guruhga o'tkazish
exports.transferStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { groupId } = req.body;

        await prisma.studentProfile.update({
            where: { userId: parseInt(id) },
            data: { groupId: groupId ? parseInt(groupId) : null }
        });

        res.json({ message: "O'quvchi boshqa guruhga o'tkazildi!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "O'tkazishda xatolik yuz berdi" });
    }
};

// O'quvchini o'chirish
exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.studentProfile.deleteMany({ where: { userId: parseInt(id) } });
        await prisma.attendance.deleteMany({ where: { studentId: parseInt(id) } });
        await prisma.payment.deleteMany({ where: { studentId: parseInt(id) } });
        await prisma.submission.deleteMany({ where: { studentId: parseInt(id) } });

        await prisma.user.delete({ where: { id: parseInt(id) } });

        res.json({ message: "O'quvchi ma'lumotlar bazasidan o'chirildi" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Tizimda xatolik." });
    }
};
