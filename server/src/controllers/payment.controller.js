const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

const paymentController = {
    getAllPayments: async (req, res) => {
        try {
            const payments = await prisma.payment.findMany({
                include: {
                    student: { select: { name: true, phone: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json(payments);
        } catch (error) {
            res.status(500).json({ message: "To'lovlarni yuklashda xato" });
        }
    },

    createPayment: async (req, res) => {
        try {
            const { studentId, amount, type, description, date } = req.body;
            const newPayment = await prisma.payment.create({
                data: {
                    studentId: parseInt(studentId),
                    amount: parseFloat(amount),
                    type,
                    description,
                    date: date ? new Date(date) : new Date()
                }
            });

            // Update student balance
            await prisma.studentProfile.update({
                where: { userId: parseInt(studentId) },
                data: { balance: { increment: parseFloat(amount) } }
            });

            res.status(201).json(newPayment);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "To'lovni saqlashda xato" });
        }
    },

    getDebts: async (req, res) => {
        try {
            const debts = await prisma.debt.findMany({
                where: { status: 'UNPAID' },
                include: {
                    student: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            telegramId: true,
                            studentProfile: {
                                include: { group: true }
                            }
                        }
                    }
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
            const globalChatId = process.env.TELEGRAM_CHAT_ID;

            if (type === 'bulk' || type === 'bulk-private') {
                const debtStudents = await prisma.debt.findMany({
                    where: { status: 'UNPAID' },
                    include: {
                        student: {
                            include: {
                                studentProfile: { include: { group: true } }
                            }
                        }
                    }
                });

                if (type === 'bulk') {
                    const groupedDebts = {};
                    debtStudents.forEach(d => {
                        const targetId = d.student.studentProfile?.group?.telegramChatId;
                        if (targetId) {
                            if (!groupedDebts[targetId]) {
                                groupedDebts[targetId] = { name: d.student.studentProfile.group.name, students: [] };
                            }
                            groupedDebts[targetId].students.push(d);
                        }
                    });

                    for (const [chatId, data] of Object.entries(groupedDebts)) {
                        let msg = `⚠️ <b>${data.name.toUpperCase()} GURUHI: QARZDORLIK!</b>\n\n`;
                        let total = 0;
                        data.students.forEach((s, idx) => {
                            msg += `${idx + 1}. <b>${s.student.name}</b> - ${s.amount} so'm. <i>(${s.month})</i>\n`;
                            total += s.amount;
                        });
                        msg += `\n🔴 Jami: <b>${total} so'm</b>`;
                        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, { chat_id: chatId, text: msg, parse_mode: 'HTML' });
                    }
                    return res.json({ message: "Guruhlarga xabarlar yuborildi!" });
                } 
                
                if (type === 'bulk-private') {
                    let sent = 0;
                    for (const d of debtStudents) {
                        const tid = d.student.telegramId;
                        if (tid) {
                            const msg = `🔔 <b>TO'LOV ESLATMASI:</b>\n\nHurmatli <b>${d.student.name}</b>, sizning <b>${d.student.studentProfile?.group?.name}</b> kursi uchun <b>${d.amount}</b> so'm qarzdorligingiz mavjud.`;
                            await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, { chat_id: tid, text: msg, parse_mode: 'HTML' });
                            sent++;
                        }
                    }
                    return res.json({ message: `${sent} kishiga shaxsiy xabar yuborildi.` });
                }
            } else {
                // Single SMS
                const student = await prisma.user.findFirst({
                    where: { name: studentName },
                    include: { studentProfile: { include: { group: true } } }
                });
                const targetChatId = student?.studentProfile?.group?.telegramChatId;
                if (!targetChatId) return res.status(400).json({ message: "Guruh ID si sozlanmagan!" });

                const msg = `🔔 <b>TO'LOV ESLATMASI:</b>\n\nHurmatli <b>${studentName}</b>, sizning <b>${student.studentProfile?.group?.name}</b> kursi uchun ${month ? month + ' oyi uchun ' : ''}<b>${amount}</b> so'm qarzdorligingiz mavjud.`;
                await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, { chat_id: targetChatId, text: msg, parse_mode: 'HTML' });
                return res.json({ message: "Xabar yuborildi!" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Telegram xatosi" });
        }
    }
};

module.exports = paymentController;
