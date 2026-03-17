import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, MoreHorizontal, MessageCircle, Phone, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosClient from '../api/axiosClient';
import './Leads.css';

const Leads = () => {
    const [leads, setLeads] = useState({ new: [], thinking: [], rejected: [] });
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form states
    const [courses, setCourses] = useState([]);
    const [formData, setFormData] = useState({ name: '', phone: '', course: '' });

    useEffect(() => {
        fetchLeads();
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await axiosClient.get('/courses');
            setCourses(res.data);
            if (res.data.length > 0) {
                setFormData(prev => ({ ...prev, course: res.data[0].name }));
            }
        } catch (error) {
            console.error("Kurslarni yuklashda xato:", error);
        }
    };

    const fetchLeads = async () => {
        try {
            const res = await axiosClient.get('/leads');
            // Categorize by status
            const categorized = { new: [], thinking: [], rejected: [] };
            res.data.forEach(lead => {
                if (lead.status === 'NEW') categorized.new.push(lead);
                if (lead.status === 'THINKING') categorized.thinking.push(lead);
                if (lead.status === 'REJECTED') categorized.rejected.push(lead);
            });
            setLeads(categorized);
        } catch (error) {
            toast.error("Lidlarni yuklashda xato!");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePhone = (name) => {
        toast.success(`${name} ga qo'ng'iroq qilinmoqda...`, { icon: '📞' });
    };

    const handleMsg = (name) => {
        toast.success(`${name} ga xabar yuborilmoqda...`, { icon: '💬' });
    };

    const handleFilter = () => {
        toast('Filtr menyusi tez orada!', { icon: '⚙️' });
    };

    const handleStatusChange = async (id, newStatus, currentStatus) => {
        if (newStatus === currentStatus) return;

        let reason = '';
        if (newStatus === 'REJECTED') {
            reason = window.prompt("Rad etish sababini kiriting:");
            if (reason === null) return; // User cancelled
        }

        try {
            await axiosClient.patch(`/leads/${id}/status`, { status: newStatus, reason });
            toast.success("Lid holati yangilandi!");
            fetchLeads(); // Refresh leads
        } catch (error) {
            toast.error("Holatni yangilashda xatolik yuz berdi");
            console.error(error);
        }
    };

    const handleDeleteLead = async (id, name) => {
        if (!window.confirm(`Rostdan ham "${name}" ni o'chirib tashlamoqchimisiz?`)) return;
        try {
            await axiosClient.delete(`/leads/${id}`);
            toast.success("Lid muvaffaqiyatli o'chirildi!");
            fetchLeads();
        } catch (error) {
            toast.error("Lidni o'chirishda xatolik yuz berdi");
            console.error(error);
        }
    };

    const handleAddLead = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post('/leads', {
                name: formData.name,
                phone: formData.phone,
                course: formData.course,
                source: 'Veb-sayt'
            });
            toast.success("Yangi lid muvaffaqiyatli qo'shildi!");
            setIsModalOpen(false);
            setFormData({ name: '', phone: '', course: courses.length > 0 ? courses[0].name : '' });
            fetchLeads(); // Refresh board
        } catch (error) {
            toast.error("Lid qo'shishda xatolik yuz berdi");
        }
    };

    const filterLeads = (leadArray) => {
        return leadArray.filter(lead =>
            lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.course.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const renderLeadCard = (lead, type) => (
        <div key={lead.id} className="lead-card animate-fade-in">
            <div className="lead-header">
                <h4 className="lead-name">{lead.name}</h4>
                <div className="flex gap-2 items-center">
                    <select
                        className="status-select-small"
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value, lead.status)}
                        style={{ fontSize: '11px', padding: '2px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                    >
                        <option value="NEW">Yangi</option>
                        <option value="THINKING">O'ylanyapti</option>
                        <option value="REJECTED">Rad etdi</option>
                    </select>
                    <button className="icon-btn-small text-danger" title="O'chirish" onClick={() => handleDeleteLead(lead.id, lead.name)}>
                        <Trash2 size={16} />
                    </button>
                    <button className="icon-btn-small" onClick={() => toast('Batafsil ma\'lumotlar joriy etilmoqda')}><MoreHorizontal size={16} /></button>
                </div>
            </div>
            <div className="lead-course">{lead.course}</div>
            <div className="lead-meta">
                <span className="lead-source">{lead.source}</span>
                <span className="lead-date">{new Date(lead.createdAt).toLocaleDateString()}</span>
            </div>

            {type !== 'rejected' && (
                <div className="lead-actions">
                    <button className="lead-action-btn phone" onClick={() => handlePhone(lead.name)}>
                        <Phone size={14} /> Qo'ng'iroq
                    </button>
                    <button className="lead-action-btn msg" onClick={() => handleMsg(lead.name)}>
                        <MessageCircle size={14} /> Xabar
                    </button>
                </div>
            )}

            {type === 'rejected' && (
                <div className="lead-reason">
                    Sabab: {lead.reason}
                </div>
            )}
        </div>
    );

    return (
        <div className="leads-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Lidlar va Sotuv Voronkasi</h1>
                    <p className="page-subtitle">Yangi so'rovlar va potensial mijozlar bilan ishlash</p>
                </div>
                <div className="header-actions">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Ism yoki kurs izlash..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-outline" onClick={handleFilter}>
                        <Filter size={18} /> Filtr
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} /> Yangi Lid
                    </button>
                </div>
            </div>

            <div className="kanban-board">
                {/* Yangi so'rovlar column */}
                <div className="kanban-column">
                    <div className="column-header new-leads">
                        <div className="column-title-wrapper">
                            <span className="color-dot blue"></span>
                            <h3 className="column-title">Yangi so'rovlar</h3>
                        </div>
                        <span className="lead-count">{filterLeads(leads.new).length}</span>
                    </div>
                    <div className="column-content">
                        {filterLeads(leads.new).map(lead => renderLeadCard(lead, 'new'))}
                    </div>
                </div>

                {/* O'ylanayotganlar column */}
                <div className="kanban-column">
                    <div className="column-header thinking-leads">
                        <div className="column-title-wrapper">
                            <span className="color-dot warning"></span>
                            <h3 className="column-title">O'ylanayotganlar</h3>
                        </div>
                        <span className="lead-count">{filterLeads(leads.thinking).length}</span>
                    </div>
                    <div className="column-content">
                        {filterLeads(leads.thinking).map(lead => renderLeadCard(lead, 'thinking'))}
                    </div>
                </div>

                {/* Rad etilganlar column */}
                <div className="kanban-column">
                    <div className="column-header rejected-leads">
                        <div className="column-title-wrapper">
                            <span className="color-dot danger"></span>
                            <h3 className="column-title">Rad etganlar</h3>
                        </div>
                        <span className="lead-count">{filterLeads(leads.rejected).length}</span>
                    </div>
                    <div className="column-content">
                        {filterLeads(leads.rejected).map(lead => renderLeadCard(lead, 'rejected'))}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="modal-title m-0">Yangi Lid Qo'shish</h3>
                            <button className="icon-btn-small" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddLead}>
                            <div className="mb-2">
                                <label className="label">O'quvchi ism familiyasi</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Masalan: Sardor Aliyev"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required />
                            </div>
                            <div className="mb-2">
                                <label className="label">Telefon raqam</label>
                                <input
                                    type="tel"
                                    className="input-field"
                                    placeholder="+998"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    required />
                            </div>
                            <div className="mb-4">
                                <label className="label">Qiziqayotgan kurs</label>
                                <select
                                    className="input-field"
                                    value={formData.course}
                                    onChange={e => setFormData({ ...formData, course: e.target.value })}
                                >
                                    {courses.map(course => (
                                        <option key={course.id} value={course.name}>{course.name}</option>
                                    ))}
                                    {courses.length === 0 && <option value="">Kurslar topilmadi</option>}
                                </select>
                            </div>
                            <div className="flex gap-2 justify-end mt-4">
                                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Bekor qilish</button>
                                <button type="submit" className="btn btn-primary">Saqlash</button>
                            </div>
                        </form>
                    </div>
                </div >
            )}
        </div >
    );
};

export default Leads;
