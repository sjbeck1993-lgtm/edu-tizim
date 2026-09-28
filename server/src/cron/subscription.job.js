const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obuna muddati tugagan o'quvchilarni tekshirib, har biriga (agar hali
// yopilmagan qarzi bo'lmasa) yangi qarz yozuvi yaratadi. Kechasi cron orqali
// avtomatik, yoki Moliya sahifasidagi "Avtomatik Qarz" tugmasi orqali qo'lda
// ishga tushiriladi - ikkalasi ham aynan shu funksiyani chaqiradi.
const runDebtCheck = async () => {
    const studentsToCharge = await prisma.user.findMany({
        where: {
            role: 'STUDENT',
            studentProfile: {
                OR: [
                    { subEndsAt: { lt: new Date() } },
                    { subEndsAt: null }
                ]
            }
        },
        include: {
            studentProfile: {
                include: {
                    groups: {
                        include: { course: true }
                    }
                }
            }
        }
    });

    let chargedCount = 0;
    const todayDateStr = new Date().toISOString().split('T')[0];

    for (const student of studentsToCharge) {
        const groups = student.studentProfile?.groups || [];

        for (const group of groups) {
            if (!group.course) continue;

            // Shu o'quvchi shu guruh uchun to'lanmagan qarz mavjudligini tekshiramiz (ustma-ust qarz tushmasligi uchun)
            const existingDebt = await prisma.payment.findFirst({
                where: {
                    studentId: student.id,
                    groupId: group.id,
                    status: 'debt'
                }
            });

            if (!existingDebt) {
                await prisma.payment.create({
                    data: {
                        studentId: student.id,
                        groupId: group.id,
                        amount: group.course.monthlyPrice,
                        month: todayDateStr,
                        periodStart: new Date(),
                        method: '-',
                        status: 'debt',
                        tenantId: student.tenantId
                    }
                });
                chargedCount++;
            }
        }
    }

    return chargedCount;
};

const startSubscriptionCron = () => {
    // Har kuni tungi soat 00:01 da ishga tushadi
    cron.schedule('1 0 * * *', async () => {
        console.log("Cron Job ishga tushdi: Obuna muddatlarini tekshirish...");
        try {
            const chargedCount = await runDebtCheck();
            console.log(`Cron yakunlandi: ${chargedCount} ta qarz yozuvi yaratildi.`);
        } catch (error) {
            console.error("Cron Job xatosi:", error);
        }
    });
};

module.exports = startSubscriptionCron;
module.exports.runDebtCheck = runDebtCheck;
