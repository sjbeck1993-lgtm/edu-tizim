const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

const QUESTION_TYPES = ['MULTIPLE_CHOICE', 'NUMERIC', 'TEXT'];

// Agar barcha topshiriqlar tekshirilgan bo'lsa, vazifani "completed" deb belgilaydi
const maybeCompleteTask = async (taskId) => {
    const total = await prisma.submission.count({ where: { taskId } });
    const checked = await prisma.submission.count({ where: { taskId, status: 'checked' } });
    if (total > 0 && total === checked) {
        await prisma.task.update({ where: { id: taskId }, data: { status: 'completed' } });
    }
};

const gradeTextAnswerWithAI = async (questionText, expectedAnswer, studentAnswer) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY sozlanmagan");
    }

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: "Siz o'qituvchi yordamchisisiz. O'quvchining javobini savol va namunaviy/kutilgan javobga solishtirib, 0 dan 100 gacha baho qo'ying. Faqat quyidagi JSON formatida javob bering, boshqa hech narsa yozmang: {\"score\": <son>, \"feedback\": \"<o'zbek tilida qisqa izoh>\"}",
        messages: [{
            role: 'user',
            content: `Savol: ${questionText}\nKutilgan/namunaviy javob: ${expectedAnswer || "(berilmagan, mazmuniga qarab baholang)"}\nO'quvchi javobi: ${studentAnswer}`
        }]
    }, {
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
        }
    });

    const textBlock = response.data.content.find(b => b.type === 'text');
    const parsed = JSON.parse(textBlock.text.trim());
    const score = Math.max(0, Math.min(100, Math.round(parsed.score)));
    return { score, feedback: parsed.feedback || '' };
};

// Get all tasks and their summary for a teacher/admin
exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            include: {
                group: { select: { name: true } },
                submissions: true,
                questions: { select: { id: true, type: true } }
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
            submittedCount: t.submissions.filter(s => s.status !== 'pending').length,
            hasTextQuestions: t.questions.some(q => q.type === 'TEXT')
        }));

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Vazifalarni yuklashda xato" });
    }
};

// Create a new Task, together with its questions
exports.createTask = async (req, res) => {
    try {
        const { title, groupId, deadline, questions } = req.body;

        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: "Kamida bitta savol kiritish shart" });
        }
        for (const q of questions) {
            if (!QUESTION_TYPES.includes(q.type) || !q.text) {
                return res.status(400).json({ message: "Savollar noto'g'ri formatda" });
            }
            if (q.type === 'MULTIPLE_CHOICE' && (!Array.isArray(q.options) || q.options.length < 2 || !q.correctAnswer)) {
                return res.status(400).json({ message: "Variantli savolda kamida 2 ta variant va to'g'ri javob bo'lishi shart" });
            }
            if (q.type === 'NUMERIC' && (q.correctAnswer === undefined || q.correctAnswer === '')) {
                return res.status(400).json({ message: "Raqamli savolda to'g'ri javob kiritilishi shart" });
            }
        }

        const group = await prisma.group.findUnique({
            where: { id: parseInt(groupId) },
            include: { students: true }
        });

        if (!group) return res.status(404).json({ message: "Guruh topilmadi" });

        const task = await prisma.task.create({
            data: {
                title,
                groupId: parseInt(groupId),
                deadline: deadline ? new Date(deadline) : new Date(Date.now() + 86400000 * 2),
                totalCount: group.students.length,
                status: 'active',
                tenantId: req.user.tenantId,
                questions: {
                    create: questions.map((q, idx) => ({
                        type: q.type,
                        text: q.text,
                        options: q.type === 'MULTIPLE_CHOICE' ? q.options : undefined,
                        correctAnswer: q.type === 'TEXT' ? (q.correctAnswer || null) : String(q.correctAnswer),
                        order: idx
                    }))
                }
            }
        });

        const pendingSubmissions = group.students.map(s => ({
            taskId: task.id,
            studentId: s.userId,
            status: 'pending'
        }));

        if (pendingSubmissions.length > 0) {
            await prisma.submission.createMany({ data: pendingSubmissions });
        }

        res.status(201).json(task);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Vazifa yaratishda xato" });
    }
};

// AI orqali TEXT turidagi javoblarni baholaydi; MULTIPLE_CHOICE/NUMERIC
// javoblar o'quvchi topshirgan zahoti avtomatik baholanadi (submitAnswers'da)
exports.gradeWithAI = async (req, res) => {
    try {
        const { taskId } = req.params;
        const parsedTaskId = parseInt(taskId);

        if (!process.env.ANTHROPIC_API_KEY) {
            return res.status(400).json({ message: "AI kaliti hali sozlanmagan (ANTHROPIC_API_KEY). Admin bilan bog'laning." });
        }

        const submissions = await prisma.submission.findMany({
            where: { taskId: parsedTaskId, status: 'submitted' },
            include: { answers: { include: { question: true } } }
        });

        let gradedCount = 0;
        for (const submission of submissions) {
            for (const answer of submission.answers) {
                if (answer.question.type === 'TEXT' && answer.aiScore === null) {
                    try {
                        const { score, feedback } = await gradeTextAnswerWithAI(
                            answer.question.text,
                            answer.question.correctAnswer,
                            answer.answerText || ''
                        );
                        await prisma.studentAnswer.update({
                            where: { id: answer.id },
                            data: { aiScore: score, aiFeedback: feedback, isCorrect: score >= 60 }
                        });
                    } catch (aiError) {
                        console.error("AI grading error for answer", answer.id, aiError.message);
                    }
                }
            }

            const freshAnswers = await prisma.studentAnswer.findMany({ where: { submissionId: submission.id } });
            const stillUngraded = freshAnswers.some(a => a.isCorrect === null);
            if (!stillUngraded && freshAnswers.length > 0) {
                const correctCount = freshAnswers.filter(a => a.isCorrect).length;
                const score = Math.round((correctCount / freshAnswers.length) * 100);
                await prisma.submission.update({
                    where: { id: submission.id },
                    data: { status: 'checked', score }
                });
                gradedCount++;
            }
        }

        await maybeCompleteTask(parsedTaskId);

        res.json({ message: `${gradedCount} ta topshiriq AI yordamida baholandi!` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "AI baholashda xato yuz berdi" });
    }
};

// Get Submissions details for one task (admin/teacher view)
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
            time: s.submittedAt ? new Date(s.submittedAt).toLocaleString('uz-UZ') : '-'
        }));

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Submission yuklashda xato" });
    }
};

// --- O'quvchi tomoni ---

// O'quvchining o'z guruhlariga tegishli barcha vazifalari, o'z holati bilan
exports.getMyTasks = async (req, res) => {
    try {
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: req.user.id },
            include: { groups: true }
        });
        const groupIds = (studentProfile?.groups || []).map(g => g.id);

        const tasks = await prisma.task.findMany({
            where: { groupId: { in: groupIds } },
            include: {
                submissions: { where: { studentId: req.user.id } },
                group: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formatted = tasks.map(t => ({
            id: t.id,
            title: t.title,
            group: t.group.name,
            deadline: t.deadline,
            status: t.submissions[0]?.status || 'pending',
            score: t.submissions[0]?.score ?? null
        }));

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Vazifalarni yuklashda xato" });
    }
};

// Bitta vazifaning savollarini o'quvchiga ko'rsatish uchun (to'g'ri javobsiz)
exports.getTaskForStudent = async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await prisma.task.findUnique({
            where: { id: parseInt(taskId) },
            include: {
                questions: { orderBy: { order: 'asc' } },
                submissions: { where: { studentId: req.user.id } }
            }
        });

        if (!task) return res.status(404).json({ message: "Vazifa topilmadi" });

        const mySubmission = task.submissions[0];
        if (mySubmission && mySubmission.status !== 'pending') {
            return res.status(400).json({ message: "Siz bu vazifani allaqachon topshirgansiz" });
        }

        res.json({
            id: task.id,
            title: task.title,
            deadline: task.deadline,
            questions: task.questions.map(q => ({
                id: q.id,
                type: q.type,
                text: q.text,
                options: q.options
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Vazifani yuklashda xato" });
    }
};

// O'quvchi javoblarni topshiradi; MULTIPLE_CHOICE/NUMERIC darhol avtomatik baholanadi
exports.submitAnswers = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { answers } = req.body;
        const parsedTaskId = parseInt(taskId);

        if (!Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ message: "Javoblar topilmadi" });
        }

        const submission = await prisma.submission.findFirst({
            where: { taskId: parsedTaskId, studentId: req.user.id }
        });
        if (!submission) return res.status(404).json({ message: "Sizga bu vazifa biriktirilmagan" });
        if (submission.status !== 'pending') return res.status(400).json({ message: "Siz bu vazifani allaqachon topshirgansiz" });

        const questions = await prisma.question.findMany({ where: { taskId: parsedTaskId } });
        const questionMap = new Map(questions.map(q => [q.id, q]));

        const answerRows = answers.map(a => {
            const question = questionMap.get(parseInt(a.questionId));
            if (!question) return null;

            let isCorrect = null;
            if (question.type === 'MULTIPLE_CHOICE') {
                isCorrect = String(a.answerText).trim() === String(question.correctAnswer).trim();
            } else if (question.type === 'NUMERIC') {
                const given = parseFloat(a.answerText);
                const correct = parseFloat(question.correctAnswer);
                isCorrect = !Number.isNaN(given) && !Number.isNaN(correct) && given === correct;
            }
            // TEXT turi uchun isCorrect keyinroq AI orqali belgilanadi (null qoladi)

            return {
                submissionId: submission.id,
                questionId: question.id,
                answerText: String(a.answerText ?? ''),
                isCorrect
            };
        }).filter(Boolean);

        await prisma.studentAnswer.createMany({ data: answerRows });

        const hasTextQuestions = questions.some(q => q.type === 'TEXT');
        if (hasTextQuestions) {
            await prisma.submission.update({
                where: { id: submission.id },
                data: { status: 'submitted', submittedAt: new Date() }
            });
        } else {
            const correctCount = answerRows.filter(a => a.isCorrect).length;
            const score = answerRows.length > 0 ? Math.round((correctCount / answerRows.length) * 100) : 0;
            await prisma.submission.update({
                where: { id: submission.id },
                data: { status: 'checked', score, submittedAt: new Date() }
            });
            await maybeCompleteTask(parsedTaskId);
        }

        res.json({ message: "Javoblaringiz qabul qilindi!", autoGraded: !hasTextQuestions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Javoblarni yuborishda xato" });
    }
};
