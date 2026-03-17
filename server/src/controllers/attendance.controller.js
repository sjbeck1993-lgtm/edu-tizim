const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get students for a specific group for attendance
exports.getGroupAttendance = async (req, res) => {
    try {
        const { groupId } = req.params;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find all students in this group
        const group = await prisma.group.findUnique({
            where: { id: parseInt(groupId) },
            include: {
                students: {
                    include: {
                        user: {
                            select: { id: true, name: true }
                        }
                    }
                }
            }
        });

        if (!group) return res.status(404).json({ message: "Guruh topilmadi" });

        // Check if attendance already exists for today
        const existingAttendance = await prisma.attendance.findMany({
            where: {
                groupId: parseInt(groupId),
                date: {
                    gte: today
                }
            }
        });

        // Map students with their attendance status
        const students = group.students.map(s => {
            const record = existingAttendance.find(a => a.studentId === s.user.id);
            return {
                id: s.user.id,
                name: s.user.name,
                present: record ? record.present : true // Default true if not yet marked
            };
        });

        res.json({
            groupName: group.name,
            students
        });
    } catch (error) {
        console.error("Davomatni yuklashda xato:", error);
        res.status(500).json({ message: "Server xatosi" });
    }
};

// Save attendance for a group
exports.saveAttendance = async (req, res) => {
    try {
        const { groupId, records } = req.body;
        // records: [{ studentId: 1, present: false }, ...]

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Delete existing records for today to handle updates
        await prisma.attendance.deleteMany({
            where: {
                groupId: parseInt(groupId),
                date: {
                    gte: today
                }
            }
        });

        // Insert new records
        const attendanceData = records.map(record => ({
            studentId: record.studentId,
            groupId: parseInt(groupId),
            present: record.present,
            date: new Date()
        }));

        await prisma.attendance.createMany({
            data: attendanceData
        });

        res.json({ message: "Davomat muvaffaqiyatli saqlandi" });
    } catch (error) {
        console.error("Davomatni saqlashda xato:", error);
        res.status(500).json({ message: "Server xatosi" });
    }
};
