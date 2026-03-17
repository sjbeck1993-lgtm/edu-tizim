import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { UserPlus, Search, Star, TrendingUp, DollarSign, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './HR.css';

const HR = () => {
    const [teachers, setTeachers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ name: '', phone: '', subject: '', baseSalary: '' });

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            const res = await axiosClient.get('/hr/teachers');
            const formatted = res.data.map(t => ({
                id: t.id,
                name: t.name,
                subject: t.teacherProfile?.subject || 'Belgilanmagan',
                baseSalary: t.teacherProfile?.baseSalary || 0,
                rating: t.teacherProfile?.rating || 0,
                bonus: t.teacherProfile?.bonus || 0,
                students: t.groupsTaught?.reduce((acc, curr) => acc + curr.students.length, 0) || 0
            }));
            setTeachers(formatted);
        } catch (error) {
            console.error(error);
            toast.error("O'qituvchilarni yuklashda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    const filterTeachers = () => {
        return teachers.filter(t =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.subject.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const calculateTotal = (teacher) => {
        return teacher.baseSalary + teacher.bonus;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('uz-UZ').format(amount) + ' UZS';
    };

    const handlePayment = async (teacher) => {
        try {
            await axiosClient.post('/hr/pay', { teacherId: teacher.id });
            toast.success(`${teacher.name} hisobiga ${formatCurrency(calculateTotal(teacher))} o'tkazildi!`, { icon: '💸', duration: 4000 });
            fetchTeachers(); // Refresh to set bonus to 0
        } catch (error) {
            toast.error("Amaliyotda xato yuz berdi");
        }
    };

    const handleDeleteTeacher = async (id, name) => {
        if (!window.confirm(`${name} ismli o'qituvchini tizimdan o'chirishga ishonchingiz komilmi?`)) return;

        try {
            await axiosClient.delete(`/hr/teachers/${id}`);
            toast.success("O'qituvchi o'chirildi!");
            fetchTeachers();
        } catch (error) {
            toast.error("O'chirishda xatolik! Balki bu o'qituvchida darslar mavjud.");
        }
    };

    const handleAddTeacher = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post('/hr/teachers', formData);
            toast.success("Yangi o'qituvchi muvaffaqiyatli saqlandi!");
            setIsModalOpen(false);
            setFormData({ name: '', phone: '', subject: '', baseSalary: '' });
            fetchTeachers();
        } catch (error) {
            toast.error("Xatolik yuz berdi");
        }
    };

    return (
        <div className="hr-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">HR va KPI (O'qituvchilar)</h1>
                    <p className="page-subtitle">Xodimlar ro'yxati, oylik maosh va KPI hisoboti</p>
                </div>
                <div className="header-actions">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Ism yoki fan izlash..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        <UserPlus size={18} /> Yangi O'qituvchi
                    </button>
                </div>
            </div>

            <div className="hr-stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-blue)' }}>
                        <UserPlus size={24} />
                    </div>
                    <div className="stat-info">
                        <h3 className="stat-value">{loading ? '...' : `${teachers.length} ta`}</h3>
                        <p className="stat-label">Jami o'qituvchilar</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                        <Star size={24} />
                    </div>
                    <div className="stat-info">
                        <h3 className="stat-value">4.7</h3>
                        <p className="stat-label">O'rtacha reyting</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-info">
                        <h3 className="stat-value">Jarayonda...</h3>
                        <p className="stat-label">Joriy oydagi maoshlar fondi</p>
                    </div>
                </div>
            </div>

            <div className="teachers-list-container">
                <h2 className="section-title">O'qituvchilar ro'yxati va KPI</h2>
                <div className="teachers-grid">
                    {filterTeachers().map(teacher => (
                        <div key={teacher.id} className="teacher-card animate-fade-in">
                            <div className="teacher-header">
                                <div className="teacher-avatar">
                                    {teacher.name.charAt(0)}
                                </div>
                                <div className="teacher-info">
                                    <h3 className="teacher-name">{teacher.name}</h3>
                                    <p className="teacher-subject">{teacher.subject}</p>
                                </div>
                                <div className="flex flex-col gap-2 items-end">
                                    <div className="teacher-rating">
                                        <Star size={16} fill="var(--warning)" color="var(--warning)" />
                                        <span>{teacher.rating}</span>
                                    </div>
                                    <button
                                        className="icon-btn-small hover:bg-red-50 hover:text-red-500"
                                        onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}
                                        title="O'chirish"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="kpi-details">
                                <div className="kpi-item">
                                    <span className="kpi-label">Biriktirilgan o'quvchilar:</span>
                                    <span className="kpi-value">{teacher.students} ta</span>
                                </div>
                                <div className="kpi-item">
                                    <span className="kpi-label">Fiks oylik:</span>
                                    <span className="kpi-value">{formatCurrency(teacher.baseSalary)}</span>
                                </div>
                                <div className="kpi-item">
                                    <span className="kpi-label">KPI Bonus (Davomat + Reyting):</span>
                                    <span className="kpi-value text-success">+{formatCurrency(teacher.bonus)}</span>
                                </div>
                            </div>

                            <div className="teacher-footer">
                                <div className="total-salary">
                                    <span className="total-label">Jami to'lanadi:</span>
                                    <span className="total-amount">{formatCurrency(calculateTotal(teacher))}</span>
                                </div>
                                <button
                                    className="btn btn-primary w-full mt-3"
                                    onClick={() => handlePayment(teacher)}
                                >
                                    To'lov qilish
                                </button>
                            </div>
                        </div>
                    ))}
                    {filterTeachers().length === 0 && (
                        <div className="col-span-full text-center text-muted p-6">
                            O'qituvchi topilmadi
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="modal-title m-0">Yangi O'qituvchi</h3>
                            <button className="icon-btn-small" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddTeacher}>
                            <div className="mb-2">
                                <label className="label">Ism familiya</label>
                                <input type="text" className="input-field" placeholder="Masalan: Sardor Aliyev"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="mb-2">
                                <label className="label">Telefon raqami</label>
                                <input type="text" className="input-field" placeholder="+998"
                                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
                            </div>
                            <div className="mb-2">
                                <label className="label">Fani</label>
                                <input type="text" className="input-field" placeholder="Masalan: Ingliz tili"
                                    value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} required />
                            </div>
                            <div className="mb-4">
                                <label className="label">Fiks maoshi (UZS)</label>
                                <input type="number" className="input-field" placeholder="2000000"
                                    value={formData.baseSalary} onChange={e => setFormData({ ...formData, baseSalary: e.target.value })} required />
                            </div>
                            <div className="flex gap-2 justify-end mt-4">
                                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Bekor qilish</button>
                                <button type="submit" className="btn btn-primary">Saqlash</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HR;
