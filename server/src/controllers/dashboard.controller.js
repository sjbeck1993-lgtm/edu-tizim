const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const dashboardController = {
    getStats: async (req, res) => {
        try {
            const { month } = req.query; // e.g. "2026-03"

            let startDate, endDate;
            if (month) {
                startDate = new Date(`${month}-01`);
                endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + 1);
            }

            const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
            const totalActiveGroups = await prisma.group.count();

            const leadsQuery = { where: { status: 'NEW' } };
            if (startDate) {
                leadsQuery.where.createdAt = { gte: startDate, lt: endDate };
            }
            const totalLeads = await prisma.lead.count(leadsQuery);

            const paymentsQuery = { where: { status: 'paid' } };
            if (startDate) {
                paymentsQuery.where.paymentDate = { gte: startDate, lt: endDate };
            }
            const periodPayments = await prisma.payment.findMany(paymentsQuery);
            const monthlyRevenue = periodPayments.reduce((acc, curr) => acc + curr.amount, 0);

            const allPayments = await prisma.payment.findMany({ where: { status: 'paid' } }); // Graph uchun

            // Recent Payments
            const latestPayments = await prisma.payment.findMany({
                where: paymentsQuery.where,
                orderBy: { paymentDate: 'desc' },
                take: 5,
                include: {
                    student: {
                        include: {
                            studentProfile: {
                                include: { group: { include: { course: true } } }
                            }
                        }
                    }
                }
            });

            const recentActivities = latestPayments.map(p => {
                const courseName = p.student?.studentProfile?.group?.course?.name || 'Umumiy';
                return {
                    id: p.id,
                    studentName: p.student.name,
                    course: courseName,
                    amount: p.amount,
                    date: p.paymentDate
                };
            });

            // Revenue Data
            const revenueMap = {};
            allPayments.forEach(p => {
                const d = new Date(p.paymentDate);
                const monthName = d.toLocaleString('uz-UZ', { month: 'short' });
                if (!revenueMap[monthName]) revenueMap[monthName] = 0;
                revenueMap[monthName] += p.amount;
            });

            const revenueData = Object.keys(revenueMap).map(m => ({
                name: m.charAt(0).toUpperCase() + m.slice(1),
                value: revenueMap[m] / 1000000
            }));
            if (revenueData.length === 0) {
                revenueData.push({ name: 'Yan', value: 0 });
            }

            // Real Attendance Tracking (Last 7 days approx)
            const attendances = await prisma.attendance.findMany({
                where: { date: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) } },
                orderBy: { date: 'asc' }
            });

            const attendanceMap = { 'Dush': { k: 0, m: 0 }, 'Sesh': { k: 0, m: 0 }, 'Chor': { k: 0, m: 0 }, 'Pay': { k: 0, m: 0 }, 'Jum': { k: 0, m: 0 }, 'Shan': { k: 0, m: 0 } };
            const days = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];

            attendances.forEach(a => {
                const d = new Date(a.date);
                const dayName = days[d.getDay()];
                if (attendanceMap[dayName]) {
                    if (a.present) attendanceMap[dayName].k += 1;
                    else attendanceMap[dayName].m += 1;
                }
            });

            const attendanceData = Object.keys(attendanceMap).map(k => ({
                name: k,
                kelgan: attendanceMap[k].k || 0,
                kelmagan: attendanceMap[k].m || 0
            })).filter(d => d.kelgan > 0 || d.kelmagan > 0);

            // Fallback mock if completely empty database
            if (attendanceData.length === 0) {
                attendanceData.push({ name: 'Dush', kelgan: 120, kelmagan: 15 }, { name: 'Sesh', kelgan: 132, kelmagan: 8 });
            }

            // Today's classes
            const currentDayIndex = new Date().getDay();
            const allGroups = await prisma.group.findMany({
                include: { course: true, teacher: true }
            });
            const todaysClasses = allGroups
                .filter(g => g.classDays && g.classDays.includes(currentDayIndex))
                .map(g => ({
                    id: g.id,
                    name: g.name,
                    course: g.course?.name || "Noma'lum",
                    time: g.classTime || "Belgilanmagan",
                    teacher: g.teacher?.name || "Biriktirilmagan"
                }));

            res.json({
                students: totalStudents,
                revenue: monthlyRevenue,
                groups: totalActiveGroups,
                newLeads: totalLeads,
                recentActivities,
                revenueData,
                attendanceData,
                todaysClasses
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Statistikani yuklashda xatolik yuz berdi" });
        }
    }
};

module.exports = dashboardController;
