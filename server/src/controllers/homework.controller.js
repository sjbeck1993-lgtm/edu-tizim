const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all tasks and their summary for a teacher/admin
exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            include: {
                group: {
                    select: { name: true }
                },
                submissions: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const formatted = tasks.map(t => ({
            id: t.id,
            title: t.title,
            deadline: t.deadline,
            group: t.group.name,
            totalCount: t.totalCount,
            status: t.status,
            submissions: t.submissions,
            submittedCount: t.submissions.length
        }));

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Vazifalarni yuklashda xato" });
    }
};

// Create a new Task
exports.createTask = async (req, res) => {
    try {
        const { title, groupId, deadline } = req.body;

        const group = await prisma.group.findUnique({
            where: { id: parseInt(groupId) },
            include: { students: true }
        });

        if (!group) return res.status(404).json({ message: "Guruh topilmadi" });

        const task = await prisma.task.create({
            data: {
                title,
                groupId: parseInt(groupId),
                deadline: new Date(deadline),
                totalCount: group.students.length, // Capture total group members size
                status: 'active'
            }
        });

        // Optional: Pre-populate empty submissions for all students in group 
        // to show "Pending" status on UI immediately.
        const pendingSubmissions = group.students.map(s => ({
            taskId: task.id,
            studentId: s.userId,
            status: 'pending'
        }));

        await prisma.submission.createMany({ data: pendingSubmissions });

        res.status(201).json(task);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Vazifa yaratishda xato" });
    }
};

// Simulate AI grading
exports.gradeSubmissions = async (req, res) => {
    try {
        const { taskId } = req.params;

        // Fetch all pending submissions
        const pending = await prisma.submission.findMany({
            where: { taskId: parseInt(taskId), status: 'pending' }
        });

        // Grade them randomly between 60 to 100
        for (const sub of pending) {
            await prisma.submission.update({
                where: { id: sub.id },
                data: {
                    status: 'checked',
                    score: Math.floor(Math.random() * (100 - 60 + 1)) + 60
                }
            });
        }

        // Mark task as completed
        await prisma.task.update({
            where: { id: parseInt(taskId) },
            data: { status: 'completed' }
        });

        res.json({ message: "Barcha javoblar muvaffaqiyatli baholandi!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "AI baholashda xato yuz berdi" });
    }
};

// Get Submissions details for one task
exports.getTaskSubmissions = async (req, res) => {
    try {
        const { taskId } = req.params;
        const subs = await prisma.submission.findMany({
            where: { taskId: parseInt(taskId) },
            include: {
                student: { select: { name: true } }
            }
        });

        const formatted = subs.map(s => ({
            id: s.id,
            name: s.student.name,
            score: s.score,
            status: s.status,
            time: 'Yaqinda' // Simplified for demo
        }));

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Submission yuklashda xato" });
    }
};
