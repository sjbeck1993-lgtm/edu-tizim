import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Trash2, Edit, X } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosClient from '../api/axiosClient';
import './Students.css';

const Students = () => {
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        password: '',
        groupId: '',
        joinedAt: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchStudents();
        fetchCoursesData();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await axiosClient.get('/students');
            setStudents(res.data);
        } catch (error) {
            toast.error("O'quvchilarni yuklashda xato!");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCoursesData = async () => {
        try {
            const res = await axiosClient.get('/courses');
            setCourses(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            if (isEditMode) {
                await axiosClient.put(`/students/${editingId}`, formData);
                toast.success("O'quvchi ma'lumotlari yangilandi!");
            } else {
                await axiosClient.post('/students', formData);
                toast.success("O'quvchi muvaffaqiyatli ro'yxatga olindi!");
            }
            closeModal();
            fetchStudents();
        } catch (error) {
            toast.error(error.response?.data?.message || "Xatolik yuz berdi");
        }
    };

    const openEditModal = (student) => {
        setIsEditMode(true);
        setEditingId(student.id);
        setFormData({
            name: student.name,
            phone: student.phone,
            password: '', // Bo'sh bo'lsa eski parol qoladi
            groupId: student.studentProfile?.groupId || '',
            joinedAt: student.studentProfile?.joinedAt ? new Date(student.studentProfile.joinedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsEditMode(false);
        setEditingId(null);
        setFormData({ name: '', phone: '', password: '', groupId: '', joinedAt: new Date().toISOString().split('T')[0] });
    };

    const handleDeleteStudent = async (id, name) => {
        if (!window.confirm(`Rostdan ham "${name}" bazadan butunlay o'chirilsinmi?`)) return;
        try {
            await axiosClient.delete(`/students/${id}`);
            toast.success("O'quvchi o'chirildi!");
            fetchStudents();
        } catch (error) {
            toast.error("O'chirishda xatolik yuz berdi");
        }
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.phone.includes(searchQuery)
    );

    return (
        <div className="students-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">O'quvchilar Bazasi</h1>
                    <p className="page-subtitle">Markazdagi jami o'quvchilarni boshqarish portal</p>
                </div>
                <div className="header-actions">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Ism yoki raqam..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} /> Yangi O'quvchi
                    </button>
                </div>
            </div>

            <div className="card students-table-container">
                {loading ? (
                    <div className="p-4 text-center text-muted">Yuklanmoqda...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>F.I.SH</th>
                                <th>Telefon raqam</th>
                                <th>Guruhi</th>
                                <th>Qo'shilgan sana</th>
                                <th>To'lov muddati</th>
                                <th>Sozlamalar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map(student => (
                                <tr key={student.id}>
                                    <td className="font-semibold">{student.name}</td>
                                    <td>{student.phone}</td>
                                    <td>
                                        <span className="group-badge">
                                            {student.studentProfile?.group?.name || 'Biriktirilmagan'}
                                        </span>
                                    </td>
                                    <td className="text-muted text-sm">
                                        {student.studentProfile?.joinedAt ? new Date(student.studentProfile.joinedAt).toLocaleDateString() : new Date(student.createdAt).toLocaleDateString()}
                                    </td>
                                    <td>
                                        {student.studentProfile?.subEndsAt ? (
                                            <span style={{ color: new Date(student.studentProfile.subEndsAt) >= new Date(new Date().setHours(0, 0, 0, 0)) ? 'var(--success)' : 'var(--danger)', fontWeight: '500' }}>
                                                {new Date(student.studentProfile.subEndsAt).toLocaleDateString()}
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--danger)', fontWeight: '500' }}>Qarzdor</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button
                                                className="icon-btn-small"
                                                title="Tahrirlash/Guruhga qo'shish"
                                                onClick={() => openEditModal(student)}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="icon-btn-small text-danger"
                                                title="O'chirish"
                                                onClick={() => handleDeleteStudent(student.id, student.name)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center py-4 text-muted">O'quvchilar vizual qidiruv natijasiga kura topilmadi.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content mt-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="modal-title m-0">{isEditMode ? "O'quvchini Tahrirlash" : "Yangi O'quvchi Qo'shish"}</h3>
                            <button className="icon-btn-small" onClick={closeModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddStudent}>
                            <div className="mb-2">
                                <label className="label">O'quvchi F.I.SH</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Masalan: Sardor Aliyev"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required />
                            </div>
                            <div className="mb-2">
                                <label className="label">Telefon raqam (Login uchun)</label>
                                <input
                                    type="tel"
                                    className="input-field"
                                    placeholder="+998"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    required />
                            </div>
                            <div className="mb-2">
                                <label className="label">{isEditMode ? "Yangi Parol (O'zgartirmaslik uchun bo'sh qoldiring)" : "Parol (Platformaga kirish uchun)"}</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder={isEditMode ? "***" : "123456"}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required={!isEditMode} />
                            </div>
                            <div className="mb-2">
                                <label className="label">O'quvchi Kelgan Sana</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={formData.joinedAt}
                                    onChange={e => setFormData({ ...formData, joinedAt: e.target.value })}
                                    required />
                            </div>
                            <div className="mb-4">
                                <label className="label">Qaysi guruhga (Ixtiyoriy)</label>
                                <select
                                    className="input-field"
                                    value={formData.groupId}
                                    onChange={e => setFormData({ ...formData, groupId: e.target.value })}
                                >
                                    <option value="">(Tasdiqlanmagan) Hali guruhga yo'q</option>
                                    {courses.map(course => (
                                        <optgroup key={course.id} label={course.name}>
                                            {course.groups.map(g => (
                                                <option key={g.id} value={g.id}>{g.name}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2 justify-end mt-4">
                                <button type="button" className="btn btn-outline" onClick={closeModal}>Bekor qilish</button>
                                <button type="submit" className="btn btn-primary">{isEditMode ? "Yangilash" : "Saqlash"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Students;
