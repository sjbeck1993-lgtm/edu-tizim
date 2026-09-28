const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Jamoatchilikka ochiq (autentifikatsiyasiz) endpointlar - marketing sayti uchun.

const publicController = {
    // Bosh sahifada ko'rsatiladigan kurslar ro'yxati
    getPublicCourses: async (req, res) => {
        try {
            const courses = await prisma.course.findMany({
                select: { id: true, name: true, monthlyPrice: true, description: true },
                orderBy: { id: 'asc' }
            });
            res.json(courses);
        } catch (error) {
            console.error("Public courses error:", error);
            res.status(500).json({ message: "Kurslarni yuklashda xatolik yuz berdi" });
        }
    },

    // Saytdagi "Ro'yxatdan o'tish" formasidan kelgan ariza - to'g'ridan-to'g'ri
    // CRM'dagi Lidlar bo'limiga tushadi.
    submitPublicLead: async (req, res) => {
        try {
            const { name, phone, course } = req.body;

            if (!name || !phone) {
                return res.status(400).json({ message: "Ism va telefon raqam kiritilishi shart." });
            }

            const tenant = await prisma.tenant.findFirst();

            const lead = await prisma.lead.create({
                data: {
                    name,
                    phone,
                    course: course || "Ko'rsatilmagan",
                    source: 'Veb-sayt',
                    status: 'NEW',
                    tenantId: tenant?.id ?? null
                }
            });

            res.status(201).json({ message: "Arizangiz qabul qilindi! Tez orada siz bilan bog'lanamiz.", lead: { id: lead.id } });
        } catch (error) {
            console.error("Public lead submit error:", error);
            res.status(500).json({ message: "Arizani yuborishda xatolik yuz berdi" });
        }
    }
};

module.exports = publicController;
