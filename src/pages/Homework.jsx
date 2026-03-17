import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, Search, BookOpen, AlertCircle, Play, X } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import './Homework.css';



const Homework = () => {
    const [tasks, setTasks] = useState([]);
    const [checking, setChecking] = useState(false);
    const [submissions, setSubmissions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loadingTasks, setLoadingTasks] = useState(true);

    // Form data
    const [courses, setCourses] = useState([]);
    const [formData, setFormData] = useState({ title: '', groupId: '', deadline: '' });
    const [activeTask, setActiveTask] = useState(null); // Which task's submissions we are viewing

    useEffect(() => {
        fetchTasks();
        fetchCoursesData();
    }, []);

    const fetchCoursesData = async () => {
        try {
            const res = await axiosClient.get('/courses');
            setCourses(res.data);

            // Set default value if groups exist
            let firstGroup = '';
            for (const course of res.data) {
                if (course.groups && course.groups.length > 0) {
                    firstGroup = course.groups[0].id.toString();
                    break;
                }
            }
            if (firstGroup) {
                setFormData(prev => ({ ...prev, groupId: firstGroup }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchTasks = async () => {
        try {
            const res = await axiosClient.get('/homework');
            setTasks(res.data);
            if (res.data.length > 0 && !activeTask) {
                // Automatically select the first task to view submissions
                handleViewSubmissions(res.data[0]);
            }
        } catch (error) {
            console.error(error);
            toast.error("Vazifalarni yuklashda xatolik yuz berdi");
        } finally {
            setLoadingTasks(false);
        }
    };

    const handleViewSubmissions = async (task) => {
        setActiveTask(task);
        try {
            const res = await axiosClient.get(`/homework/${task.id}/submissions`);
            setSubmissions(res.data);
        } catch (error) {
            toast.error("Tekshiruv ma'lumotlarini yuklashda xato!");
        }
    };

    const autoCheck = async () => {
        if (!activeTask) return;
        setChecking(true);
        toast.loading("AI testlarni tekshirib, xatolarni tahlil qilmoqda...", { duration: 2000 });
        try {
            await axiosClient.post(`/homework/${activeTask.id}/grade`);
            setTimeout(() => {
                toast.success("Barcha javoblar avtomatik baholandi!", { icon: '✨' });
                handleViewSubmissions(activeTask); // refresh submissions list
                fetchTasks(); // refresh task status
                setChecking(false);
            }, 2000);
        } catch (error) {
            toast.error("Baholashda xatolik!");
            setChecking(false);
        }
    };

    const saveTask = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post('/homework', formData);
            toast.success("Vazifa o'quvchilarga yetkazildi!", { icon: '✅' });
            setIsModalOpen(false);
            setFormData({ title: '', groupId: courses[0]?.groups[0]?.id?.toString() || '', deadline: '' });
            fetchTasks();
        } catch (error) {
            toast.error("Vazifa yaratishda xato!");
        }
    };

    const notifyAIInsight = () => {
        toast.success("Asilbekning ota-onasiga xabarnoma yuborildi.", { icon: '📱' });
    };

    return (
        <div className="homework-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Uy vazifalari va Testlar</h1>
                    <p className="page-subtitle">Vazifalarni berish va AI orqali avtomatik tekshirish</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        + Yangi Vazifa / Test
                    </button>
                </div>
            </div>

            <div className="homework-grid animate-fade-in">
                {/* Left Column: Task List */}
                <div className="tasks-column">
                    <div className="card-header-flex">
                        <h3 className="section-title">Faol vazifalar</h3>
                        <div className="search-box small">
                            <Search size={14} />
                            <input type="text" placeholder="Qidirish..." />
                        </div>
                    </div>

                    <div className="tasks-list">
                        {loadingTasks ? (
                            <div className="p-4 text-center text-muted">Yuklanmoqda...</div>
                        ) : tasks.length === 0 ? (
                            <div className="p-4 text-center text-muted">Hozircha vazifalar yo'q.</div>
                        ) : tasks.map(task => (
                            <div
                                key={task.id}
                                className={`task-card ${task.status} ${activeTask?.id === task.id ? 'active-border' : ''}`}
                                onClick={() => handleViewSubmissions(task)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="task-header">
                                    <h4 className="task-title">{task.title}</h4>
                                    {task.status === 'urgent' && <span className="urgent-badge">Shoshilinch</span>}
                                    {task.status === 'completed' && <CheckCircle size={16} className="text-success" />}
                                </div>
                                <div className="task-meta">
                                    <span className="task-group"><BookOpen size={14} /> {task.group}</span>
                                    <span className={`task-deadline ${task.status === 'urgent' ? 'text-danger' : ''}`}>
                                        <Clock size={14} /> {new Date(task.deadline).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="task-progress">
                                    <div className="progress-info">
                                        <span className="progress-text">Topshirdi: {task.submittedCount} / {task.totalCount}</span>
                                        <span className="progress-percent">{task.totalCount > 0 ? Math.round((task.submittedCount / task.totalCount) * 100) : 0}%</span>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div
                                            className={`progress-bar-fill ${task.status === 'completed' ? 'success' : ''}`}
                                            style={{ width: `${task.totalCount > 0 ? (task.submittedCount / task.totalCount) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Checking Panel */}
                <div className="checking-column">
                    <div className="checking-panel card">
                        {activeTask ? (
                            <>
                                <div className="panel-header">
                                    <div>
                                        <h3 className="panel-title">Tekshiruv Paneli</h3>
                                        <p className="panel-subtitle">{activeTask.title} ({submissions.length} ta javob)</p>
                                    </div>
                                    <button
                                        className={`btn btn-primary auto-check-btn ${checking ? 'checking' : ''}`}
                                        onClick={autoCheck}
                                        disabled={checking || !submissions.some(s => s.status === 'pending')}
                                    >
                                        {checking ? (
                                            <><span className="spinner"></span> AI Tekshirmoqda...</>
                                        ) : (
                                            <><Play size={16} fill="currentColor" /> Avtomatik tekshirish</>
                                        )}
                                    </button>
                                </div>

                                <div className="submissions-list">
                                    {submissions.map(sub => (
                                        <div key={sub.id} className="submission-item">
                                            <div className="sub-info">
                                                <div className="sub-avatar">{sub.name.charAt(0)}</div>
                                                <div>
                                                    <h4 className="sub-name">{sub.name}</h4>
                                                    <span className="sub-time">{sub.time}</span>
                                                </div>
                                            </div>
                                            <div className="sub-result">
                                                {sub.status === 'pending' ? (
                                                    <span className="score-badge pending">Kutilmoqda</span>
                                                ) : (
                                                    <span className={`score-badge ${sub.score >= 80 ? 'excellent' : sub.score >= 60 ? 'good' : 'poor'}`}>
                                                        {sub.score} ball
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {submissions.length === 0 && (
                                        <div className="text-center text-muted p-4">Hali hech kim javob yo'llamagan.</div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="p-8 text-center text-muted">
                                Chap tomondan vazifani tanlang
                            </div>
                        )}

                        <div className="ai-insight-box">
                            <div className="insight-icon">
                                <AlertCircle size={20} />
                            </div>
                            <div className="insight-content">
                                <h5 className="insight-title">AI Tahlilchining xulosasi</h5>
                                <p className="insight-text">
                                    Guruhning 35% qismi <b>manfiy sonlarni qo'shish</b> mavzusida xatoga yo'l qo'ymoqda. Ular asosan 4- va 5-savollarda qoqilishgan. Keyingi darsda shu mavzuni takrorlash tavsiya etiladi.
                                </p>
                                <div className="mt-2 text-right">
                                    <button className="btn btn-sm" onClick={notifyAIInsight} style={{ background: 'white', color: '#6d28d9', borderColor: '#d8b4fe' }}>Ota-onalarga SMS xabar berish</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="modal-title m-0">Yangi Vazifa / Test</h3>
                            <button className="icon-btn-small" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={saveTask}>
                            <div className="mb-2">
                                <label className="label">Mavzu nomi</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Masalan: Logarifmik tenglamalar"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required />
                            </div>
                            <div className="mb-2">
                                <label className="label">Qaysi guruhga</label>
                                <select
                                    className="input-field"
                                    value={formData.groupId}
                                    onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                                >
                                    {courses.map(course => (
                                        <optgroup key={course.id} label={course.name}>
                                            {course.groups.map(g => (
                                                <option key={g.id} value={g.id}>{g.name}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="label">Tugatish muhlati</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    required />
                            </div>
                            <div className="flex gap-2 justify-end mt-4">
                                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Bekor qilish</button>
                                <button type="submit" className="btn btn-primary">Yaratish</button>
                            </div>
                        </form>
                    </div>
                </div >
            )}
        </div >
    );
};

export default Homework;
