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
            
            if (!name || !monthlyPrice) {
                return res.status(400).json({ message: "Kurs nomi va narxi majburiy!" });
            }

            const newCourse = await prisma.course.create({
                data: { 
                    name, 
                    monthlyPrice: parseFloat(monthlyPrice) || 0, 
                    description 
                }
            });
            res.status(201).json({ message: "Yangi kurs yaratildi!", course: newCourse });
        } catch (error) {
            console.error('❌ COURSE CREATE ERROR:', error);
            res.status(500).json({ message: "Kurs qo'shishda xatolik yuz berdi: " + error.message });
        }
    },

    updateCourse: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, monthlyPrice, description } = req.body;
            const updatedCourse = await prisma.course.update({
                where: { id: parseInt(id) },
                data: {
                    name,
                    monthlyPrice: parseFloat(monthlyPrice),
                    description
                }
            });
            res.json({ message: "Kurs ma'lumotlari yangilandi!", course: updatedCourse });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Kursni yangilashda xato yuz berdi" });
        }
    },

    deleteCourse: async (req, res) => {
        try {
            const { id } = req.params;

            const course = await prisma.course.findUnique({
                where: { id: parseInt(id) },
                include: { groups: true }
            });

            if (course && course.groups.length > 0) {
                return res.status(400).json({ message: "Bu kursda faol guruhlar mavjud! Avval guruhlarni o'chiring." });
            }

            await prisma.material.deleteMany({ where: { courseId: parseInt(id) } });
            await prisma.course.delete({ where: { id: parseInt(id) } });

            res.json({ message: "Kurs o'chirildi" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Kursni o'chirishda xatolik yuz berdi" });
        }
    },

    createGroup: async (req, res) => {
        try {
            console.log('--- NEW GROUP REQUEST ---', req.body);
            const { courseId, name, teacherId, schedule, classDays, classTime } = req.body;
            
            if (!courseId || !name) {
                return res.status(400).json({ message: "Kurs va guruh nomi majburiy!" });
            }

            const newGroup = await prisma.group.create({
                data: {
                    courseId: parseInt(courseId),
                    name,
                    teacherId: teacherId ? parseInt(teacherId) : null,
                    schedule: schedule || "Belgilanmagan",
                    classDays: classDays || [],
                    classTime: classTime || null
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
            const { name, teacherId, schedule, classDays, classTime } = req.body;

            // Build the update payload dynamically based on what is sent
            const dataToUpdate = { name };
            if (teacherId !== undefined) dataToUpdate.teacherId = teacherId ? parseInt(teacherId) : null;
            if (schedule !== undefined) dataToUpdate.schedule = schedule;
            if (classDays !== undefined) dataToUpdate.classDays = classDays;
            if (classTime !== undefined) dataToUpdate.classTime = classTime;

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

            // Xavfsizlik: Guruhda talabalar bormi?
            const group = await prisma.group.findUnique({
                where: { id: parseInt(id) },
                include: { students: true }
            });

            if (group && group.students.length > 0) {
                return res.status(400).json({ message: "Bu guruhda o'quvchilar bor! Avval ularni boshqa guruhga o'tkazing." });
            }

            // Qoldiq fayllarni va darslarni tozalash (Cascading)
            await prisma.attendance.deleteMany({ where: { groupId: parseInt(id) } });
            await prisma.material.deleteMany({ where: { groupId: parseInt(id) } });

            const tasks = await prisma.task.findMany({ where: { groupId: parseInt(id) } });
            if (tasks.length > 0) {
                const taskIds = tasks.map(t => t.id);
                await prisma.submission.deleteMany({ where: { taskId: { in: taskIds } } });
                await prisma.task.deleteMany({ where: { groupId: parseInt(id) } });
            }

            await prisma.group.delete({ where: { id: parseInt(id) } });
            res.json({ message: "Guruh muvaffaqiyatli o'chirildi!" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Guruhni o'chirishda tizim xatosi yuz berdi" });
        }
    },

    getMaterials: async (req, res) => {
        try {
            const materials = await prisma.material.findMany({ orderBy: { createdAt: 'desc' } });
            res.json(materials);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Materiallarni yuklashda xato" });
        }
    },

    uploadMaterial: async (req, res) => {
        try {
            const { name, type, size, courseId } = req.body;
            const newMaterial = await prisma.material.create({
                data: {
                    name,
                    type: type || 'document',
                    size: size || '1.0 MB',
                    courseId: courseId ? parseInt(courseId) : null
                }
            });
            res.status(201).json({ message: "Fayl muvaffaqiyatli yuklandi", material: newMaterial });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Yuklashda xatolik yuz berdi" });
        }
    },

    deleteMaterial: async (req, res) => {
        try {
            const { id } = req.params;
            await prisma.material.delete({ where: { id: parseInt(id) } });
            res.json({ message: "Material o'chirildi" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "O'chirishda xatolik yuz berdi" });
        }
    }
};

module.exports = courseController;
