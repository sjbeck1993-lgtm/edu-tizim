const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

const paymentController = {
    getAllPayments: async (req, res) => {
        try {
            const payments = await prisma.payment.findMany({
                include: {
                    student: { select: { name: true, phone: true } },
                    group: { select: { name: true } }
                },
                orderBy: { paymentDate: 'desc' }
            });
            res.json(payments);
        } catch (error) {
            console.error("Get payments error:", error);
            res.status(500).json({ message: "To'lovlarni yuklashda xato" });
        }
    },

    createPayment: async (req, res) => {
        try {
            const { studentId, amount, month, method, status, groupId } = req.body;

            if (!studentId || !amount || !month || !method) {
                return res.status(400).json({ message: "studentId, amount, month va method maydonlari majburiy." });
            }

            const parsedStudentId = parseInt(studentId);
            const parsedAmount = parseFloat(amount);
            if (Number.isNaN(parsedStudentId) || Number.isNaN(parsedAmount)) {
                return res.status(400).json({ message: "studentId yoki amount noto'g'ri formatda." });
            }

            const newPayment = await prisma.payment.create({
                data: {
                    studentId: parsedStudentId,
                    groupId: groupId ? parseInt(groupId) : null,
                    amount: parsedAmount,
                    month,
                    method,
                    status: status || 'paid',
                    tenantId: req.user.tenantId
                }
            });

            // Avtomatik ravishda qarzdorlikni yopish (Avvalgi oylardan boshlab)
            if (groupId) {
                const unpaidDebts = await prisma.debt.findMany({
                    where: {
                        studentId: parsedStudentId,
                        groupId: parseInt(groupId),
                        status: 'UNPAID'
                    },
                    orderBy: { createdAt: 'asc' } // Eski qarzlardan boshlab
                });

                if (unpaidDebts.length > 0) {
                    // Agar faqat bitta qarzni yopmoqchi bo'lsak:
                    await prisma.debt.update({
                        where: { id: unpaidDebts[0].id },
                        data: { status: 'PAID' }
                    });
                }
            }

            res.status(201).json(newPayment);
        } catch (error) {
            console.error("Payment creation error:", error);
            res.status(500).json({ message: "To'lovni saqlashda xato" });
        }
    },

    getDebts: async (req, res) => {
        try {
            const debts = await prisma.debt.findMany({
                where: { status: 'UNPAID' },
                include: {
                    student: {
                        select: { id: true, name: true, phone: true, telegramId: true }
                    },
                    group: true // Debt modelining o'zida group bor endi
                },
                orderBy: { month: 'desc' }
            });
            res.json(debts);
        } catch (error) {
            res.status(500).json({ message: "Qarzdorlarni yuklashda xato" });
        }
    },

    sendSMS: async (req, res) => {
        try {
            const { type, studentName, amount, month } = req.body;
            const botToken = process.env.TELEGRAM_BOT_TOKEN;

            if (type === 'bulk' || type === 'bulk-private') {
                const debtStudents = await prisma.debt.findMany({
                    where: { status: 'UNPAID' },
                    include: {
                        student: true,
                        group: true
                    }
                });

                if (type === 'bulk') {
                    if (!botToken) {
                        return res.status(500).json({ message: "TELEGRAM_BOT_TOKEN sozlanmagan! Serverga murojaat qiling." });
                    }

                    const groupedDebts = {};
                    const skippedGroups = new Set();
                    debtStudents.forEach(d => {
                        const targetId = d.group?.telegramChatId;
                        if (targetId) {
                            if (!groupedDebts[targetId]) {
                                groupedDebts[targetId] = { name: d.group.name, students: [] };
                            }
                            groupedDebts[targetId].students.push(d);
                        } else if (d.group?.name) {
                            skippedGroups.add(d.group.name);
                        }
                    });

                    let sentGroups = 0;
                    const failedGroups = [];
                    for (const [chatId, data] of Object.entries(groupedDebts)) {
                        let msg = `⚠️ <b>${data.name.toUpperCase()} GURUHI: QARZDORLIK!</b>\n\n`;
                        let total = 0;
                        data.students.forEach((s, idx) => {
                            msg += `${idx + 1}. <b>${s.student.name}</b> - ${s.amount} so'm. <i>(${s.month})</i>\n`;
                            total += s.amount;
                        });
                        msg += `\n🔴 Jami: <b>${total} so'm</b>`;
                        try {
                            await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, { chat_id: chatId, text: msg, parse_mode: 'HTML' });
                            sentGroups++;
                        } catch (sendError) {
                            console.error(`Telegram sendMessage xatosi (guruh: ${data.name}, chatId: ${chatId}):`, sendError.response?.data || sendError.message);
                            failedGroups.push(data.name);
                        }
                    }

                    if (sentGroups === 0) {
                        return res.status(400).json({
                            message: failedGroups.length > 0
                                ? `Hech qaysi guruhga xabar yuborilmadi. Xatolik: ${failedGroups.join(', ')} (botni guruhga admin qilib qo'shganingizni tekshiring).`
                                : `Hech qaysi guruhda Telegram Chat ID sozlanmagan (${[...skippedGroups].join(', ') || 'guruhlar'}). "Kurslar" bo'limida guruh sozlamalaridan Telegram Chat ID kiriting.`
                        });
                    }

                    let message = `${sentGroups} ta guruhga xabar yuborildi.`;
                    if (skippedGroups.size > 0) message += ` ${skippedGroups.size} ta guruhda Chat ID sozlanmagani uchun o'tkazib yuborildi (${[...skippedGroups].join(', ')}).`;
                    if (failedGroups.length > 0) message += ` ${failedGroups.length} ta guruhga yuborishda xatolik chiqdi (${failedGroups.join(', ')}).`;
                    return res.json({ message });
                }
                
                if (type === 'bulk-private') {
                    if (!botToken) {
                        return res.status(500).json({ message: "TELEGRAM_BOT_TOKEN sozlanmagan! Serverga murojaat qiling." });
                    }

                    let sent = 0;
                    let failed = 0;
                    const notLinked = debtStudents.filter(d => !d.student.telegramId).length;
                    for (const d of debtStudents) {
                        const tid = d.student.telegramId;
                        if (tid) {
                            const msg = `🔔 <b>TO'LOV ESLATMASI:</b>\n\nHurmatli <b>${d.student.name}</b>, sizning <b>${d.group?.name}</b> kursi uchun <b>${d.amount}</b> so'm qarzdorligingiz mavjud.`;
                            try {
                                await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, { chat_id: tid, text: msg, parse_mode: 'HTML' });
                                sent++;
                            } catch (sendError) {
                                console.error(`Telegram sendMessage xatosi (o'quvchi: ${d.student.name}, telegramId: ${tid}):`, sendError.response?.data || sendError.message);
                                failed++;
                            }
                        }
                    }

                    let message = `${sent} kishiga shaxsiy xabar yuborildi.`;
                    if (notLinked > 0) message += ` ${notLinked} kishi botga ulanmagan (Telegramda /start bosmagan).`;
                    if (failed > 0) message += ` ${failed} kishiga yuborishda xatolik chiqdi.`;
                    return res.json({ message });
                }
            } else {
                // Single SMS
                const debt = await prisma.debt.findFirst({
                    where: { student: { name: studentName }, status: 'UNPAID' },
                    include: { student: true, group: true }
                });
                
                const targetChatId = debt?.group?.telegramChatId;
                if (!targetChatId) return res.status(400).json({ message: "Guruh ID si sozlanmagan!" });

                const msg = `🔔 <b>TO'LOV ESLATMASI:</b>\n\nHurmatli <b>${studentName}</b>, sizning <b>${debt.group.name}</b> kursi uchun ${month ? month + ' oyi uchun ' : ''}<b>${amount}</b> so'm qarzdorligingiz mavjud.`;
                await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, { chat_id: targetChatId, text: msg, parse_mode: 'HTML' });
                return res.json({ message: "Xabar yuborildi!" });
            }
        } catch (error) {
            console.error("Telegram sendMessage xatosi:", error.response?.data || error.message);
            res.status(500).json({ message: "Telegram xatosi" });
        }
    },

    getStudents: async (req, res) => {
        try {
            const students = await prisma.user.findMany({
                where: { role: 'STUDENT' },
                select: { id: true, name: true, phone: true }
            });
            res.json(students);
        } catch (error) {
            res.status(500).json({ message: "Xato" });
        }
    },

    autoGenerateDebts: async (req, res) => {
        res.json({ message: "Avtomatik qarz yozish jarayoni yakunlandi!" });
    },

    approvePayment: async (req, res) => {
        try {
            const { id } = req.params;
            await prisma.payment.update({
                where: { id: parseInt(id) },
                data: { status: 'paid' }
            });
            res.json({ message: "Tasdiqlandi" });
        } catch (error) {
            res.status(500).json({ message: "Xato" });
        }
    },

    deletePayment: async (req, res) => {
        try {
            const { id } = req.params;
            await prisma.payment.delete({
                where: { id: parseInt(id) }
            });
            res.json({ message: "O'chirildi" });
        } catch (error) {
            res.status(500).json({ message: "Xato" });
        }
    },

    uploadReceipt: async (req, res) => {
        res.json({ message: "Yuklandi" });
    }
};

module.exports = paymentController;
