import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Book, Users, FileText, Upload, MoreVertical, PlayCircle, Folder, X, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import './Courses.css';


const initialMaterials = [];

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [activeTab, setActiveTab] = useState('courses'); // 'courses' or 'materials'

    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [isEditCourseMode, setIsEditCourseMode] = useState(false);
    const [editingCourseId, setEditingCourseId] = useState(null);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isGroupDetailsModalOpen, setIsGroupDetailsModalOpen] = useState(false);
    const [isEditGroupMode, setIsEditGroupMode] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [selectedStudentForTransfer, setSelectedStudentForTransfer] = useState(null);
    const [targetGroupId, setTargetGroupId] = useState('');
    const [selectedCourseForGroups, setSelectedCourseForGroups] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form state
    const [formData, setFormData] = useState({ name: '', monthlyPrice: '' });
    const [groupData, setGroupData] = useState({ id: null, courseId: '', name: '', teacherId: '', schedule: '', classDays: [], classTime: '', telegramChatId: '' });
    const [materialData, setMaterialData] = useState({ name: '', type: 'document', courseId: '' });

    const WEEK_DAYS = [
        { value: 1, label: 'Du' },
        { value: 2, label: 'Se' },
        { value: 3, label: 'Ch' },
        { value: 4, label: 'Pa' },
        { value: 5, label: 'Ju' },
        { value: 6, label: 'Sh' }
    ];

    useEffect(() => {
        fetchCourses();
        fetchMaterials();
        fetchTeachers();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await axiosClient.get('/courses');
            const data = res.data.map(c => {
                const groups = c.groups || [];
                const studentsCount = groups.reduce((acc, curr) => acc + (curr.students?.length || 0), 0);
                return {
                    id: c.id,
                    name: c.name,
                    rawGroups: groups,
                    groups: groups.length,
                    students: studentsCount,
                    price: new Intl.NumberFormat('uz-UZ').format(c.monthlyPrice || 0) + ' UZS'
                };
            });
            setCourses(data);
            if (data.length > 0) {
                setGroupData(prev => ({ ...prev, courseId: data[0].id }));
                setMaterialData(prev => ({ ...prev, courseId: data[0].id }));
            }
        } catch (error) {
            console.error('Fetch Courses Error:', error);
            const msg = error.response?.data?.message || error.message || "Kurslarni yuklashda xatolik";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const fetchMaterials = async () => {
        try {
            const res = await axiosClient.get('/courses/materials/all');
            setMaterials(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchTeachers = async () => {
        try {
            const res = await axiosClient.get('/hr/teachers');
            setTeachers(res.data);
            if (res.data.length > 0) {
                setGroupData(prev => ({ ...prev, teacherId: res.data[0].id }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const renderIcon = (type) => {
        switch (type) {
            case 'document': return <FileText size={24} className="text-blue-500" />;
            case 'presentation': return <FileText size={24} className="text-orange-500" />;
            case 'video': return <PlayCircle size={24} className="text-purple-500" />;
            case 'folder': return <Folder size={24} className="text-yellow-500" fill="currentColor" />;
            default: return <FileText size={24} />;
        }
    };

    const handleActionClick = () => {
        if (activeTab === 'courses') {
            setIsCourseModalOpen(true);
        } else {
            setIsUploadModalOpen(true);
        }
    };

    const saveCourse = async (e) => {
        e.preventDefault();
        try {
            if (isEditCourseMode) {
                await axiosClient.put(`/courses/${editingCourseId}`, {
                    name: formData.name,
                    monthlyPrice: formData.monthlyPrice
                });
                toast.success("Kurs muvaffaqiyatli yangilandi!");
            } else {
                await axiosClient.post('/courses', {
                    name: formData.name,
                    monthlyPrice: formData.monthlyPrice
                });
                toast.success("Yangi kurs yaratildi!");
            }

            setIsCourseModalOpen(false);
            setIsEditCourseMode(false);
            setEditingCourseId(null);
            setFormData({ name: '', monthlyPrice: '' });
            fetchCourses(); // refresh
        } catch (error) {
            toast.error(error.response?.data?.message || "Kurs ma'lumotlarini saqlashda xato!");
        }
    };

    const handleEditCourseClick = (course) => {
        setIsEditCourseMode(true);
        setEditingCourseId(course.id);
        setFormData({ name: course.name, monthlyPrice: parseInt(course.price.replace(/\D/g, ''), 10) || '' });
        setIsCourseModalOpen(true);
    };

    const handleDeleteCourse = async (id) => {
        if (!window.confirm("Kursni o'chirishga ishonchingiz komilmi?")) return;
        try {
            await axiosClient.delete(`/courses/${id}`);
            toast.success("Kurs o'chirildi!");
            fetchCourses();
        } catch (error) {
            toast.error(error.response?.data?.message || "O'chirishda xatolik yuz berdi");
        }
    };

    const handleAddGroup = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...groupData, schedule: buildScheduleString(groupData.classDays, groupData.classTime) };
            if (groupData.id) {
                await axiosClient.put(`/courses/groups/${groupData.id}`, payload);
                toast.success("Guruh tahrirlandi!", { icon: '📝' });
            } else {
                await axiosClient.post('/courses/groups', payload);
                toast.success("Yangi guruh ochildi!", { icon: '🎊' });
            }
            setIsGroupModalOpen(false);
            setGroupData({ id: null, courseId: courses[0]?.id || '', name: '', teacherId: teachers[0]?.id || '', schedule: '', classDays: [], classTime: '', telegramChatId: '' });
            fetchCourses();
            if (isGroupDetailsModalOpen) setIsGroupDetailsModalOpen(false);

            // Agar guruhlar ro'yxati ochilgan bo'lsa, o'zgarish sezilishi uchun yopamiz
            if (isGroupDetailsModalOpen) setIsGroupDetailsModalOpen(false);

        } catch (error) {
            toast.error(error.response?.data?.message || "Guruh saqlashda xatolik");
        }
    };

    const handleEditGroupClick = (group, courseId) => {
        setGroupData({
            id: group.id,
            courseId: courseId,
            name: group.name,
            teacherId: group.teacherId || '',
            schedule: group.schedule,
            classDays: group.classDays || [],
            classTime: group.classTime || '',
            telegramChatId: group.telegramChatId || ''
        });
        setIsEditGroupMode(true);
        setIsGroupModalOpen(true);
    };

    const handleDayToggle = (dayValue) => {
        setGroupData(prev => {
            const currentDays = prev.classDays || [];
            if (currentDays.includes(dayValue)) {
                return { ...prev, classDays: currentDays.filter(d => d !== dayValue) };
            } else {
                return { ...prev, classDays: [...currentDays, dayValue].sort((a, b) => a - b) };
            }
        });
    };

    const buildScheduleString = (days, time) => {
        if (!days || days.length === 0) return time || "Belgilanmagan";
        const labels = days.map(d => WEEK_DAYS.find(w => w.value === d)?.label).filter(l => l);
        return `${labels.join('-')} ${time || ''}`.trim();
    };

    const handleDeleteGroup = async (groupId) => {
        if (!window.confirm("Guruhni butunlay o'chirasizmi?")) return;
        try {
            await axiosClient.delete(`/courses/groups/${groupId}`);
            toast.success("Guruh o'chirildi!");
            fetchCourses();
            setIsGroupDetailsModalOpen(false); // Reload details
        } catch (error) {
            toast.error(error.response?.data?.message || "O'chirishda xatolik yuz berdi");
        }
    };

    const handleTransferClick = (student) => {
        setSelectedStudentForTransfer({ id: student.userId, name: student.user?.name });
        setTargetGroupId('');
        setIsTransferModalOpen(true);
    };

    const submitTransfer = async (e) => {
        e.preventDefault();
        if (!targetGroupId) return toast.error("Iltimos, guruhni tanlang");
        try {
            await axiosClient.put(`/students/${selectedStudentForTransfer.id}/transfer`, { groupId: targetGroupId });
            toast.success("O'quvchi muvaffaqiyatli boshqa guruhga o'tkazildi!");
            setIsTransferModalOpen(false);
            fetchCourses();
            setIsGroupDetailsModalOpen(false); // Automatically closes so user can reopen group to see changes
        } catch (err) {
            toast.error("O'tkazishda xatolik yuz berdi");
        }
    };

    const saveUpload = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post('/courses/materials/upload', materialData);
            toast.success("Material muvaffaqiyatli yuklandi!", { icon: '⬆️' });
            setIsUploadModalOpen(false);
            setMaterialData(prev => ({ ...prev, name: '' }));
            fetchMaterials();
        } catch (error) {
            toast.error("Yuklashda xato yuz berdi");
        }
    };

    const handleDeleteMaterial = async (id) => {
        if (!window.confirm("Materialni o'chirishga ruxsat berasizmi?")) return;
        try {
            await axiosClient.delete(`/courses/materials/${id}`);
            toast.success("Material o'chirildi!");
            fetchMaterials();
        } catch (error) {
            toast.error("O'chirishda xatolik yuz berdi");
        }
    };

    const handleOpenFolder = (name) => {
        toast(`"${name}" ochilmoqda...`, { icon: '📂' });
    };

    const openGroupDetails = (course) => {
        setSelectedCourseForGroups(course);
        setIsGroupDetailsModalOpen(true);
    };

    return (
        <div className="courses-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Kurslar va Materiallar</h1>
                    <p className="page-subtitle">O'quv dasturlari, guruhlar va avtorlik materiallari bazasi</p>
                </div>
                <div className="header-actions">
                    {activeTab === 'courses' ? (
                        <>
                            <button className="btn btn-outline" onClick={() => setIsGroupModalOpen(true)}>
                                Yangi Guruh
                            </button>
                            <button className="btn btn-primary" onClick={() => setIsCourseModalOpen(true)}>
                                + Yangi Kurs
                            </button>
                        </>
                    ) : (
                        <button className="btn btn-primary" onClick={() => setIsUploadModalOpen(true)}>
                            <Upload size={18} /> Material Yuklash
                        </button>
                    )}
                </div>
            </div>

            <div className="tabs-container">
                <button
                    className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('courses')}
                >
                    <Book size={18} /> Kurslar va Guruhlar
                </button>
                <button
                    className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`}
                    onClick={() => setActiveTab('materials')}
                >
                    <Folder size={18} /> Avtorlik Materiallari
                </button>
            </div>

            {activeTab === 'courses' && (
                <div className="courses-grid animate-fade-in">
                    {courses.map(course => (
                        <div key={course.id} className="course-card">
                            <div className="course-header">
                                <div className="course-icon">
                                    <Book size={24} />
                                </div>
                                <div className="flex gap-2">
                                    <button className="icon-btn-small" onClick={() => handleEditCourseClick(course)} title="Tahrirlash"><Edit size={18} /></button>
                                    <button className="icon-btn-small text-danger" onClick={() => handleDeleteCourse(course.id)} title="O'chirish"><Trash2 size={18} /></button>
                                </div>
                            </div>
                            <h3 className="course-name">{course.name}</h3>

                            <div className="course-stats">
                                <div className="course-stat-item">
                                    <Users size={16} />
                                    <span>{course.groups} ta guruh</span>
                                </div>
                                <div className="course-stat-item">
                                    <Users size={16} />
                                    <span>{course.students} o'quvchi</span>
                                </div>
                            </div>

                            <div className="course-footer">
                                <span className="course-price">{course.price} <small>/ 45 kun</small></span>
                                <button className="btn btn-sm btn-outline" onClick={() => openGroupDetails(course)}>Guruhlarni ko'rish</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'materials' && (
                <div className="materials-container animate-fade-in">
                    <div className="upload-zone" onClick={() => setIsUploadModalOpen(true)}>
                        <Upload size={32} className="upload-icon" />
                        <p className="upload-text">Fayllarni shu yerga tashlang yoki <b>kompyuterdan tanlang</b></p>
                        <p className="upload-hint">PDF, PPTX, DOCX, MP4 (Maks: 500MB)</p>
                    </div>

                    <h3 className="section-title mt-6">Mening fayllarim</h3>
                    <div className="materials-list">
                        {materials.map(material => (
                            <div key={material.id} className="material-item">
                                <div className="material-icon-wrapper">
                                    {renderIcon(material.type)}
                                </div>
                                <div className="material-info">
                                    <h4 className="material-name">{material.name}</h4>
                                    <p className="material-meta">
                                        {material.type === 'folder' ? `${material.items} ta fayl` : material.size} • {new Date(material.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="material-actions">
                                    <button className="btn btn-sm btn-outline" onClick={() => handleOpenFolder(material.name)}>Ochish</button>
                                    <button className="icon-btn-small text-danger" onClick={() => handleDeleteMaterial(material.id)}><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))}
                        {materials.length === 0 && <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>Hozircha materiallar yo'q</p>}
                    </div>
                </div>
            )}

            {isCourseModalOpen && (
                <div className="modal-overlay" onClick={() => setIsCourseModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="modal-title m-0">{isEditCourseMode ? "Kursni Tahrirlash" : "Yangi Kurs Qo'shish"}</h3>
                            <button className="icon-btn-small" onClick={() => { setIsCourseModalOpen(false); setIsEditCourseMode(false); }}><X size={20} /></button>
                        </div>
                        <form onSubmit={saveCourse}>
                            <div className="mb-2">
                                <label className="label">Kurs nomi</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Masalan: Arab tili"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required />
                            </div>
                            <div className="mb-4">
                                <label className="label">45 kunlik narxi (UZS)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="300000"
                                    value={formData.monthlyPrice}
                                    onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
                                    required />
                            </div>
                            <div className="flex gap-2 justify-end mt-4">
                                <button type="button" className="btn btn-outline" onClick={() => { setIsCourseModalOpen(false); setIsEditCourseMode(false); }}>Bekor qilish</button>
                                <button type="submit" className="btn btn-primary">{isEditCourseMode ? "Yangilash" : "Saqlash"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isGroupModalOpen && (
                <div className="modal-overlay" onClick={() => { setIsGroupModalOpen(false); setIsEditGroupMode(false); }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="modal-title m-0">{isEditGroupMode ? "Guruhni Tahrirlash" : "Yangi Guruh Qo'shish"}</h3>
                            <button className="icon-btn-small" onClick={() => { setIsGroupModalOpen(false); setIsEditGroupMode(false); }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddGroup}>
                            <div className="mb-2">
                                <label className="label">Qaysi kurs uchun?</label>
                                <select
                                    className="input-field"
                                    value={groupData.courseId}
                                    onChange={e => setGroupData({ ...groupData, courseId: e.target.value })}
                                    required
                                >
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="mb-2">
                                <label className="label">Guruh nomi</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Masalan: G13 - Beginner"
                                    value={groupData.name}
                                    onChange={(e) => setGroupData({ ...groupData, name: e.target.value })}
                                    required />
                            </div>
                            <div className="mb-2">
                                <label className="label">O'qituvchi</label>
                                <select
                                    className="input-field"
                                    value={groupData.teacherId}
                                    onChange={e => setGroupData({ ...groupData, teacherId: e.target.value })}
                                    required
                                >
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    {teachers.length === 0 && <option value="">O'qituvchilar mavjud emas</option>}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="label">Dars kunlari (Hafta kunlari)</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {WEEK_DAYS.map(day => (
                                        <button
                                            key={day.value}
                                            type="button"
                                            onClick={() => handleDayToggle(day.value)}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-md border ${groupData.classDays?.includes(day.value) ? 'bg-primary-blue text-white border-primary-blue' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="form-group">
                            <label>Dars vaqti</label>
                            <input
                                type="time"
                                className="form-input"
                                value={groupData.classTime}
                                onChange={(e) => setGroupData({ ...groupData, classTime: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Telegram Chat ID (Guruh kodi)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="-100..."
                                value={groupData.telegramChatId || ''}
                                onChange={(e) => setGroupData({ ...groupData, telegramChatId: e.target.value })}
                            />
                            <small style={{color: '#666'}}>* Ushbu guruh uchun maxsus Telegram guruh ID sini kiriting. Bo'sh qolsa umumiyga yuboriladi.</small>
                        </div>        <p className="text-xs text-gray-500 mt-2 text-right">Preview: <span className="font-semibold text-gray-700">{buildScheduleString(groupData.classDays, groupData.classTime)}</span></p>
                            </div>
                            <div className="flex gap-2 justify-end mt-4">
                                <button type="button" className="btn btn-outline" onClick={() => { setIsGroupModalOpen(false); setIsEditGroupMode(false); }}>Bekor qilish</button>
                                <button type="submit" className="btn btn-primary">{isEditGroupMode ? "Yangilash" : "Saqlash"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isUploadModalOpen && (
                <div className="modal-overlay" onClick={() => setIsUploadModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="modal-title m-0">Fayl Yuklash</h3>
                            <button className="icon-btn-small" onClick={() => setIsUploadModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={saveUpload}>
                            <div className="mb-3">
                                <label className="label">Masalan fayl nomi:</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Leksikologiya asari"
                                    required
                                    value={materialData.name}
                                    onChange={e => setMaterialData({ ...materialData, name: e.target.value })}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="label">Fayl turi</label>
                                <select
                                    className="input-field"
                                    value={materialData.type}
                                    onChange={e => setMaterialData({ ...materialData, type: e.target.value })}
                                >
                                    <option value="document">Hujjat (PDF/Doc)</option>
                                    <option value="presentation">Prezentatsiya (PPTX)</option>
                                    <option value="video">Video Dars (MP4)</option>
                                    <option value="folder">Papka</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="label">Fayl tanlang (Mock)</label>
                                <input type="file" className="input-field" required />
                            </div>
                            <div className="mb-4">
                                <label className="label">Qaysi kurs yoki guruhga?</label>
                                <select
                                    className="input-field"
                                    value={materialData.courseId}
                                    onChange={e => setMaterialData({ ...materialData, courseId: e.target.value })}
                                >
                                    <option value="">Barcha guruhlar (Umumiy)</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2 justify-end mt-4">
                                <button type="button" className="btn btn-outline" onClick={() => setIsUploadModalOpen(false)}>Bekor qilish</button>
                                <button type="submit" className="btn btn-primary">Yuklash</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isGroupDetailsModalOpen && selectedCourseForGroups && (
                <div className="modal-overlay" onClick={() => setIsGroupDetailsModalOpen(false)}>
                    <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="modal-title m-0">{selectedCourseForGroups.name} guruhlari</h3>
                            <button className="icon-btn-small" onClick={() => setIsGroupDetailsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="groups-list mt-4">
                            {selectedCourseForGroups.rawGroups.length > 0 ? (
                                <div className="grid gap-3">
                                    {selectedCourseForGroups.rawGroups.map(g => (
                                        <div key={g.id} className="p-3 border rounded-lg hover:border-primary-blue transition-colors bg-gray-50 dark:bg-gray-800">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{g.name}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{g.students?.length || 0} o'quvchi</span>
                                                    <button className="icon-btn-small" onClick={() => handleEditGroupClick(g, selectedCourseForGroups.id)} title="Tahrirlash">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button className="icon-btn-small text-danger" onClick={() => handleDeleteGroup(g.id)} title="O'chirish">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                                                <p><span className="font-medium">O'qituvchi:</span> {g.teacher?.name || 'Biriktirilmagan'}</p>
                                                <p><span className="font-medium">Jadval:</span> {g.schedule}</p>
                                            </div>
                                            {g.students && g.students.length > 0 && (
                                                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                                                    <p className="text-xs font-semibold text-gray-500 mb-2">O'QUVCHILAR RO'YXATI:</p>
                                                    <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
                                                        <table className="w-full text-left text-sm whitespace-nowrap">
                                                            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                                <tr>
                                                                    <th className="px-4 py-2 font-medium border-b dark:border-gray-600">F.I.SH</th>
                                                                    <th className="px-4 py-2 font-medium border-b dark:border-gray-600">Telefon</th>
                                                                    <th className="px-4 py-2 font-medium border-b dark:border-gray-600 text-right">Amal</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                                {g.students.map(s => (
                                                                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                                        <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{s.user?.name || 'Noma\'lum'}</td>
                                                                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{s.user?.phone || '-'}</td>
                                                                        <td className="px-4 py-2 text-right">
                                                                            <button
                                                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium text-xs transition-colors"
                                                                                onClick={() => handleTransferClick(s)}
                                                                            >
                                                                                O'tkazish
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-500">
                                    <p>Bu kursda hozircha faol guruhlar yo'q</p>
                                    <button
                                        className="btn btn-sm btn-primary mt-3"
                                        onClick={() => {
                                            setIsGroupDetailsModalOpen(false);
                                            setGroupData(prev => ({ ...prev, courseId: selectedCourseForGroups.id }));
                                            setIsGroupModalOpen(true);
                                        }}
                                    >
                                        Yangi guruh ochish
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isTransferModalOpen && selectedStudentForTransfer && (
                <div className="modal-overlay" onClick={() => setIsTransferModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="modal-title m-0">O'quvchini Ko'chirish</h3>
                            <button className="icon-btn-small" onClick={() => setIsTransferModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={submitTransfer}>
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-3">
                                    O'quvchi: <strong className="text-gray-800">{selectedStudentForTransfer.name}</strong>
                                </p>
                                <label className="label">Yangi guruhni tanlang</label>
                                <select
                                    className="input-field"
                                    value={targetGroupId}
                                    onChange={e => setTargetGroupId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Guruh tanlang --</option>
                                    {courses.map(c => (
                                        <optgroup key={c.id} label={c.name}>
                                            {c.rawGroups && c.rawGroups.map(g => (
                                                <option key={g.id} value={g.id}>{g.name}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2 justify-end mt-4">
                                <button type="button" className="btn btn-outline" onClick={() => setIsTransferModalOpen(false)}>Bekor qilish</button>
                                <button type="submit" className="btn btn-primary">O'tkazish</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Courses;
