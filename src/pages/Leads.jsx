import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, MoreHorizontal, MessageCircle, Phone, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosClient from '../api/axiosClient';
import './Leads.css';

const Leads = () => {
    const [leads, setLeads] = useState({ new: [], thinking: [], rejected: [] });
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [courseFilter, setCourseFilter] = useState('Barchasi');
    const [sourceFilter, setSourceFilter] = useState('Barchasi');
    const [loading, setLoading] = useState(true);
    const [viewingLead, setViewingLead] = useState(null);

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

    const handlePhone = (phone) => {
        window.location.href = `tel:${phone}`;
    };

    const handleMsg = (phone) => {
        window.location.href = `sms:${phone}`;
    };

    const handleFilter = () => {
        setIsFilterOpen(prev => !prev);
    };

    const clearFilters = () => {
        setCourseFilter('Barchasi');
        setSourceFilter('Barchasi');
    };

    const allLeadsFlat = [...leads.new, ...leads.thinking, ...leads.rejected];
    const uniqueSources = [...new Set(allLeadsFlat.map(l => l.source).filter(Boolean))];

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
        return leadArray.filter(lead => {
            const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lead.course.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCourse = courseFilter === 'Barchasi' || lead.course === courseFilter;
            const matchesSource = sourceFilter === 'Barchasi' || lead.source === sourceFilter;
            return matchesSearch && matchesCourse && matchesSource;
        });
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
                    <button className="icon-btn-small" onClick={() => setViewingLead(lead)}><MoreHorizontal size={16} /></button>
                </div>
            </div>
            <div className="lead-course">{lead.course}</div>
            <div className="lead-meta">
                <span className="lead-source">{lead.source}</span>
                <span className="lead-date">{new Date(lead.createdAt).toLocaleDateString()}</span>
            </div>

            {type !== 'rejected' && (
                <div className="lead-actions">
                    <button className="lead-action-btn phone" onClick={() => handlePhone(lead.phone)}>
                        <Phone size={14} /> Qo'ng'iroq
                    </button>
                    <button className="lead-action-btn msg" onClick={() => handleMsg(lead.phone)}>
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
                    <div style={{ position: 'relative' }}>
                        <button className="btn btn-outline" onClick={handleFilter}>
                            <Filter size={18} /> Filtr {(courseFilter !== 'Barchasi' || sourceFilter !== 'Barchasi') && '•'}
                        </button>
                        {isFilterOpen && (
                            <div className="card" style={{ position: 'absolute', top: '110%', right: 0, zIndex: 20, width: '240px', padding: '1rem' }}>
                                <div className="mb-2">
                                    <label className="label">Kurs bo'yicha</label>
                                    <select className="input-field" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
                                        <option value="Barchasi">Barchasi</option>
                                        {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="mb-2">
                                    <label className="label">Manba bo'yicha</label>
                                    <select className="input-field" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
                                        <option value="Barchasi">Barchasi</option>
                                        {uniqueSources.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <button type="button" className="btn btn-outline btn-sm" style={{ width: '100%' }} onClick={clearFilters}>Tozalash</button>
                            </div>
                        )}
                    </div>
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
                                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}><X size={16} /> Bekor qilish</button>
                                <button type="submit" className="btn btn-primary"><Plus size={16} /> Saqlash</button>
                            </div>
                        </form>
                    </div>
                </div >
            )}

            {viewingLead && (
                <div className="modal-overlay" onClick={() => setViewingLead(null)}>
                    <div className="modal-content" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="modal-title m-0">{viewingLead.name}</h3>
                            <button className="icon-btn-small" onClick={() => setViewingLead(null)}><X size={20} /></button>
                        </div>
                        <div className="flex flex-col gap-2 text-sm">
                            <div className="flex justify-between"><span className="text-muted">Telefon:</span><span className="font-semibold">{viewingLead.phone}</span></div>
                            <div className="flex justify-between"><span className="text-muted">Kurs:</span><span className="font-semibold">{viewingLead.course}</span></div>
                            <div className="flex justify-between"><span className="text-muted">Manba:</span><span className="font-semibold">{viewingLead.source}</span></div>
                            <div className="flex justify-between"><span className="text-muted">Kelgan sana:</span><span className="font-semibold">{new Date(viewingLead.createdAt).toLocaleDateString()}</span></div>
                            {viewingLead.reason && (
                                <div className="flex justify-between"><span className="text-muted">Rad etish sababi:</span><span className="font-semibold">{viewingLead.reason}</span></div>
                            )}
                        </div>
                        <div className="flex gap-2 justify-end mt-4">
                            <button className="btn btn-outline" onClick={() => handlePhone(viewingLead.phone)}><Phone size={16} /> Qo'ng'iroq</button>
                            <button className="btn btn-primary" onClick={() => setViewingLead(null)}>Yopish</button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Leads;
