const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const courseController = {
    getAllCourses: async (req, res) => {
        try {
            const courses = await prisma.course.findMany({
                include: {
                    groups: {
                        include: {
                            students: {
                                include: {
                                    user: { select: { name: true, phone: true } }
                                }
                            },
                            teacher: { select: { name: true } }
                        }
                    }
                }
            });
            res.json(courses);
        } catch (error) {
            console.error('❌ GET ALL COURSES ERROR:', error);
            res.status(500).json({ message: "Kurslarni yuklashda xatolik yuz berdi: " + error.message });
        }
    },

    createCourse: async (req, res) => {
        try {
            console.log('--- NEW COURSE REQUEST ---', req.body);
            const { name, monthlyPrice, description } = req.body;
            
            if (!name) {
                return res.status(400).json({ message: "Kurs nomi majburiy!" });
            }

            const newCourse = await prisma.course.create({
                data: {
                    name,
                    monthlyPrice: monthlyPrice ? parseFloat(monthlyPrice) : 0,
                    description: description || ""
                }
            });
            res.status(201).json({ message: "Kurs muvaffaqiyatli yaratildi", course: newCourse });
        } catch (error) {
            console.error('❌ COURSE CREATE ERROR:', error);
            res.status(500).json({ message: "Kurs qo'shishda xatolik yuz berdi: " + error.message });
        }
    },

    updateCourse: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, monthlyPrice, description } = req.body;
            const updated = await prisma.course.update({
                where: { id: parseInt(id) },
                data: {
                    name,
                    monthlyPrice: monthlyPrice ? parseFloat(monthlyPrice) : undefined,
                    description
                }
            });
            res.json(updated);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Kursni tahrirlashda xatolik" });
        }
    },

    deleteCourse: async (req, res) => {
        try {
            const { id } = req.params;
            await prisma.course.delete({ where: { id: parseInt(id) } });
            res.json({ message: "Kurs o'chirildi" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "O'chirishda xato" });
        }
    },

    createGroup: async (req, res) => {
        try {
            console.log('--- NEW GROUP REQUEST ---', req.body);
            const { courseId, name, teacherId, schedule, classDays, classTime, telegramChatId } = req.body;
            
            if (!courseId || !name) {
                return res.status(400).json({ message: "Kurs va guruh nomi majburiy!" });
            }

            const newGroup = await prisma.group.create({
                data: {
                    courseId: parseInt(courseId),
                    name,
                    teacherId: teacherId && teacherId !== "" ? parseInt(teacherId) : null,
                    schedule: schedule || "Belgilanmagan",
                    classDays: classDays || [],
                    classTime: classTime || null,
                    telegramChatId: telegramChatId || null
                }
            });
            res.status(201).json({ message: "Yangi guruh ochildi", group: newGroup });
        } catch (error) {
            console.error('❌ GROUP CREATE ERROR:', error);
            res.status(500).json({ message: "Guruh qo'shishda xato yuz berdi: " + error.message });
        }
    },

    updateGroup: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, teacherId, schedule, classDays, classTime, telegramChatId } = req.body;

            const dataToUpdate = { name };
            if (teacherId !== undefined) dataToUpdate.teacherId = teacherId && teacherId !== "" ? parseInt(teacherId) : null;
            if (schedule !== undefined) dataToUpdate.schedule = schedule;
            if (classDays !== undefined) dataToUpdate.classDays = classDays;
            if (classTime !== undefined) dataToUpdate.classTime = classTime;
            if (telegramChatId !== undefined) dataToUpdate.telegramChatId = telegramChatId || null;

            const updatedGroup = await prisma.group.update({
                where: { id: parseInt(id) },
                data: dataToUpdate
            });
            res.json({ message: "Guruh ma'lumotlari yangilandi!", group: updatedGroup });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Tahrirlashda xatolik yuz berdi" });
        }
    },

    deleteGroup: async (req, res) => {
        try {
            const { id } = req.params;
            await prisma.group.delete({ where: { id: parseInt(id) } });
            res.json({ message: "Guruh o'chirildi" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "O'chirishda xato" });
        }
    }
};

module.exports = courseController;
