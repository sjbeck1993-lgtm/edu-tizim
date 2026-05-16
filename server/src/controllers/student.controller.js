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
        const activeGroup = profile.groups && profile.groups.length > 0 ? profile.groups[0] : null;

        res.json({
            name: user.name,
            courseName: activeGroup?.course?.name || "Biriktirilmagan",
            groupName: activeGroup?.name || "Biriktirilmagan",
            classDays: activeGroup?.classDays || [],
            classTime: activeGroup?.classTime || '',
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
                    include: { groups: true }
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
        console.log('--- NEW STUDENT REQUEST ---', req.body);
        let { name, phone, password, groupIds, joinedAt } = req.body;
        
        if (!name || !phone) {
            return res.status(400).json({ message: "Ism va telefon raqam majburiy!" });
        }

        // Clean phone number: remove spaces and extra characters if any
        phone = phone.replace(/\s/g, '');

        const hashedPassword = await bcrypt.hash(password || '123456', 10);

        let groupConnect = undefined;
        if (groupIds && Array.isArray(groupIds) && groupIds.length > 0) {
            groupConnect = { connect: groupIds.map(id => ({ id: parseInt(id) })) };
        }

        const newStudent = await prisma.user.create({
            data: {
                name,
                phone,
                password: hashedPassword,
                role: 'STUDENT',
                studentProfile: {
                    create: {
                        groups: groupConnect,
                        joinedAt: joinedAt ? new Date(joinedAt) : new Date()
                    }
                }
            },
            include: { studentProfile: true }
        });

        // Agar guruhlarga qo'shilgan bo'lsa, avtomatik birinchi qarzni yozamiz
        if (groupIds && Array.isArray(groupIds) && groupIds.length > 0) {
            try {
                const joinDateObj = joinedAt ? new Date(joinedAt) : new Date();
                const monthsName = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
                const formattedDate = monthsName[joinDateObj.getMonth()];

                for (let gId of groupIds) {
                    const group = await prisma.group.findUnique({
                        where: { id: parseInt(gId) },
                        include: { course: true }
                    });
                    if (group && group.course) {
                        await prisma.debt.create({
                            data: {
                                studentId: newStudent.id,
                                groupId: group.id,
                                amount: group.course.monthlyPrice,
                                month: formattedDate,
                                status: 'UNPAID'
                            }
                        });
                    }
                }
            } catch (pErr) {
                console.error('⚠️ Qarz yozishda xato (lekin o\'quvchi yaratildi):', pErr);
            }
        }

        console.log('✅ O\'QUVCHI QO\'SHILDI:', newStudent.id);
        res.status(201).json({ message: "O'quvchi qo'shildi!", student: newStudent });
    } catch (error) {
        console.error('❌ STUDENT CREATE ERROR:', error);
        require('fs').appendFileSync('student-error.log', new Date().toISOString() + ' ERROR in createStudent: ' + error.stack + '\nBody: ' + JSON.stringify(req.body) + '\n\n');
        
        if (error.code === 'P2002') return res.status(400).json({ message: "Bu telefon raqami allaqachon ro'yxatga olingan!" });
        
        res.status(500).json({ message: "Xatolik yuz berdi: " + error.message });
    }
};

// O'quvchi ma'lumotlarini tahrirlash
exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, password, groupIds, joinedAt } = req.body;

        const updateData = { name, phone };

        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        const profile = await prisma.studentProfile.findUnique({
            where: { userId: parseInt(id) },
            include: { groups: true }
        });

        let groupConnect = undefined;
        if (groupIds && Array.isArray(groupIds)) {
            groupConnect = { set: groupIds.map(gId => ({ id: parseInt(gId) })) };
        }

        if (profile) {
            await prisma.studentProfile.update({
                where: { userId: parseInt(id) },
                data: {
                    joinedAt: joinedAt ? new Date(joinedAt) : new Date(),
                    groups: groupConnect
                }
            });

            // Find newly added groups to create debts for them
            if (groupIds && Array.isArray(groupIds)) {
                const oldGroupIds = profile.groups.map(g => g.id);
                const newlyAddedIds = groupIds.filter(gId => !oldGroupIds.includes(parseInt(gId)));
                
                if (newlyAddedIds.length > 0) {
                    const joinDateObj = joinedAt ? new Date(joinedAt) : new Date();
                    const monthsName = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
                    const formattedDate = monthsName[joinDateObj.getMonth()];

                    for (let gId of newlyAddedIds) {
                        const group = await prisma.group.findUnique({
                            where: { id: parseInt(gId) },
                            include: { course: true }
                        });
                        if (group && group.course) {
                            await prisma.debt.create({
                                data: {
                                    studentId: parseInt(id),
                                    groupId: group.id,
                                    amount: group.course.monthlyPrice,
                                    month: formattedDate,
                                    status: 'UNPAID'
                                }
                            });
                        }
                    }
                }
            }
        } else {
            await prisma.studentProfile.create({
                data: {
                    userId: parseInt(id),
                    joinedAt: joinedAt ? new Date(joinedAt) : new Date(),
                    groups: groupConnect
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

// O'quvchini guruhga QO'SHISH (avvalgisidan o'chirmasdan)
exports.transferStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { groupId } = req.body;

        if (!groupId) return res.status(400).json({ message: "Guruh tanlanmagan!" });

        await prisma.studentProfile.update({
            where: { userId: parseInt(id) },
            data: { 
                groups: { connect: [{ id: parseInt(groupId) }] } 
            }
        });

        res.json({ message: "O'quvchi guruhga muvaffaqiyatli qo'shildi!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Guruhga qo'shishda xato" });
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
