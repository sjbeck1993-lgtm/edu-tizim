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
            res.status(500).json({ message: "Kurslarni yuklashda xatolik" });
        }
    },

    createCourse: async (req, res) => {
        try {
            const { name, monthlyPrice, description } = req.body;
            const newCourse = await prisma.course.create({
                data: {
                    name,
                    monthlyPrice: parseFloat(monthlyPrice) || 0,
                    description: description || ""
                }
            });
            res.status(201).json(newCourse);
        } catch (error) {
            res.status(500).json({ message: "Xatolik" });
        }
    },

    updateCourse: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, monthlyPrice, description } = req.body;
            const updated = await prisma.course.update({
                where: { id: parseInt(id) },
                data: { name, monthlyPrice: parseFloat(monthlyPrice), description }
            });
            res.json(updated);
        } catch (error) {
            res.status(500).json({ message: "Xatolik" });
        }
    },

    deleteCourse: async (req, res) => {
        try {
            const { id } = req.params;
            await prisma.course.delete({ where: { id: parseInt(id) } });
            res.json({ message: "O'chirildi" });
        } catch (error) {
            res.status(500).json({ message: "Xatolik" });
        }
    },

    createGroup: async (req, res) => {
        try {
            const { courseId, name, teacherId, schedule, classDays, classTime, telegramChatId } = req.body;
            const newGroup = await prisma.group.create({
                data: {
                    name,
                    courseId: parseInt(courseId),
                    teacherId: teacherId ? parseInt(teacherId) : null,
                    schedule: schedule || "",
                    classDays: classDays || [],
                    classTime: classTime || "",
                    telegramChatId: telegramChatId || null
                }
            });
            res.status(201).json(newGroup);
        } catch (error) {
            console.error('Create Group Error:', error);
            res.status(500).json({ message: "Guruh yaratishda xato: " + error.message });
        }
    },

    updateGroup: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, teacherId, schedule, classDays, classTime, telegramChatId, courseId } = req.body;
            const updated = await prisma.group.update({
                where: { id: parseInt(id) },
                data: {
                    name,
                    teacherId: teacherId ? parseInt(teacherId) : null,
                    schedule,
                    classDays,
                    classTime,
                    telegramChatId: telegramChatId || null,
                    courseId: courseId ? parseInt(courseId) : undefined
                }
            });
            res.json(updated);
        } catch (error) {
            console.error('Update Group Error:', error);
            res.status(500).json({ message: "Guruhni tahrirlashda xato" });
        }
    },

    deleteGroup: async (req, res) => {
        try {
            const { id } = req.params;
            await prisma.group.delete({ where: { id: parseInt(id) } });
            res.json({ message: "O'chirildi" });
        } catch (error) {
            res.status(500).json({ message: "Xatolik" });
        }
    },

    getMaterials: async (req, res) => {
        try {
            const materials = await prisma.material.findMany({ orderBy: { createdAt: 'desc' } });
            res.json(materials);
        } catch (error) {
            res.status(500).json({ message: "Xatolik" });
        }
    },

    uploadMaterial: async (req, res) => {
        try {
            const { name, type, courseId, groupId } = req.body;
            const newMaterial = await prisma.material.create({
                data: {
                    name,
                    type,
                    courseId: courseId ? parseInt(courseId) : null,
                    groupId: groupId ? parseInt(groupId) : null,
                    size: "Noma'lum"
                }
            });
            res.status(201).json(newMaterial);
        } catch (error) {
            res.status(500).json({ message: "Xatolik" });
        }
    },

    deleteMaterial: async (req, res) => {
        try {
            const { id } = req.params;
            await prisma.material.delete({ where: { id: parseInt(id) } });
            res.json({ message: "O'chirildi" });
        } catch (error) {
            res.status(500).json({ message: "Xatolik" });
        }
    }
};

module.exports = courseController;
