const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const leadController = {
    // GET all leads (for CRM Kanban board)
    getAllLeads: async (req, res) => {
        try {
            const leads = await prisma.lead.findMany({
                orderBy: { createdAt: 'desc' }
            });
            res.json(leads);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Lidlarni yuklashda xatolik yuz berdi" });
        }
    },

    // POST create a new lead
    createLead: async (req, res) => {
        try {
            const { name, course, phone, source } = req.body;
            const newLead = await prisma.lead.create({
                data: { name, course, phone, source, status: 'NEW' }
            });
            res.status(201).json({ message: "Yangi lid muvaffaqiyatli qo'shildi!", lead: newLead });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Lid qo'shishda xatolik yuz berdi" });
        }
    },

    // PATCH update lead status
    updateLeadStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, reason } = req.body;

            const updatedLead = await prisma.lead.update({
                where: { id: parseInt(id) },
                data: { status, reason }
            });
            res.json({ message: "Lid holati yangilandi!", lead: updatedLead });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Lid holatini o'zgartirishda xatolik yuz berdi" });
        }
    },

    // DELETE a lead
    deleteLead: async (req, res) => {
        try {
            const { id } = req.params;
            await prisma.lead.delete({
                where: { id: parseInt(id) }
            });
            res.json({ message: "Lid o'chirildi!" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Lidni o'chirishda xatolik yuz berdi" });
        }
    }
};

module.exports = leadController;
