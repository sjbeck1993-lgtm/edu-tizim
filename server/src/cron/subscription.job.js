const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const startSubscriptionCron = () => {
    // Har kuni tungi soat 00:01 da ishga tushadi
    cron.schedule('1 0 * * *', async () => {
        console.log("Cron Job ishga tushdi: Obuna muddatlarini tekshirish...");
        try {
            // Find students whose subscription has ended and who are in a group
            const studentsToCharge = await prisma.user.findMany({
                where: {
                    role: 'STUDENT',
                    studentProfile: {
                        OR: [
                            { subEndsAt: { lt: new Date() } },
                            { subEndsAt: null }
                        ],
                        groupId: { not: null }
                    }
                },
                include: {
                    studentProfile: {
                        include: {
                            group: {
                                include: { course: true }
                            }
                        }
                    }
                }
            });

            let chargedCount = 0;
            const todayDateStr = new Date().toISOString().split('T')[0];

            for (const student of studentsToCharge) {
                const group = student.studentProfile?.group;
                if (!group || !group.course) continue;

                // Shu o'quvchida to'lanmagan qarz mavjudligini tekshiramiz. (Ustma-ust qarz tushmasligi uchun)
                const existingDebt = await prisma.payment.findFirst({
                    where: {
                        studentId: student.id,
                        status: 'debt'
                    }
                });

                if (!existingDebt) {
                    await prisma.payment.create({
                        data: {
                            studentId: student.id,
                            amount: group.course.monthlyPrice,
                            month: todayDateStr,
                            periodStart: new Date(),
                            method: '-',
                            status: 'debt'
                        }
                    });
                    chargedCount++;
                }
            }

            console.log(`Cron yakunlandi: ${chargedCount} ta o'quvchiga avtomatik qarz yozildi.`);
        } catch (error) {
            console.error("Cron Job xatosi:", error);
        }
    });
};

module.exports = startSubscriptionCron;
