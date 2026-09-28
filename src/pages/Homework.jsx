import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Search, BookOpen, Play, X, Plus, Trash2, Sparkles } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import './Homework.css';

const emptyQuestion = (type) => ({
    type,
    text: '',
    options: type === 'MULTIPLE_CHOICE' ? ['', ''] : [],
    correctAnswer: ''
});

const Homework = () => {
    const [tasks, setTasks] = useState([]);
    const [checking, setChecking] = useState(false);
    const [submissions, setSubmissions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loadingTasks, setLoadingTasks] = useState(true);

    // Form data
    const [courses, setCourses] = useState([]);
    const [formData, setFormData] = useState({ title: '', groupId: '', deadline: '', questions: [emptyQuestion('MULTIPLE_CHOICE')] });
    const [activeTask, setActiveTask] = useState(null); // Which task's submissions we are viewing
    const [taskSearchQuery, setTaskSearchQuery] = useState('');

    const filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
        task.group.toLowerCase().includes(taskSearchQuery.toLowerCase())
    );

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

    const checkWithAI = async () => {
        if (!activeTask) return;
        setChecking(true);
        try {
            const res = await axiosClient.post(`/homework/${activeTask.id}/grade`);
            toast.success(res.data.message, { icon: '✨' });
            handleViewSubmissions(activeTask); // refresh submissions list
            fetchTasks(); // refresh task status
        } catch (error) {
            toast.error(error.response?.data?.message || "Baholashda xatolik!");
        } finally {
            setChecking(false);
        }
    };

    // --- Question builder helpers ---
    const addQuestion = (type) => {
        setFormData(prev => ({ ...prev, questions: [...prev.questions, emptyQuestion(type)] }));
    };

    const removeQuestion = (index) => {
        setFormData(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }));
    };

    const updateQuestion = (index, patch) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) => i === index ? { ...q, ...patch } : q)
        }));
    };

    const updateQuestionType = (index, type) => {
        updateQuestion(index, emptyQuestion(type));
    };

    const updateOption = (qIndex, optIndex, value) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) => {
                if (i !== qIndex) return q;
                const newOptions = q.options.map((o, oi) => oi === optIndex ? value : o);
                // agar to'g'ri javob shu variant bo'lgan bo'lsa, uni ham yangilaymiz
                const correctAnswer = q.correctAnswer === q.options[optIndex] ? value : q.correctAnswer;
                return { ...q, options: newOptions, correctAnswer };
            })
        }));
    };

    const addOption = (qIndex) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) => i === qIndex ? { ...q, options: [...q.options, ''] } : q)
        }));
    };

    const removeOption = (qIndex, optIndex) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) => {
                if (i !== qIndex) return q;
                const removed = q.options[optIndex];
                return {
                    ...q,
                    options: q.options.filter((_, oi) => oi !== optIndex),
                    correctAnswer: q.correctAnswer === removed ? '' : q.correctAnswer
                };
            })
        }));
    };

    const resetForm = () => {
        setFormData({
            title: '',
            groupId: courses[0]?.groups[0]?.id?.toString() || '',
            deadline: '',
            questions: [emptyQuestion('MULTIPLE_CHOICE')]
        });
    };

    const saveTask = async (e) => {
        e.preventDefault();

        for (const q of formData.questions) {
            if (!q.text.trim()) {
                toast.error("Barcha savol matnlari to'ldirilishi kerak");
                return;
            }
            if (q.type === 'MULTIPLE_CHOICE') {
                if (q.options.some(o => !o.trim())) {
                    toast.error("Barcha variantlar to'ldirilishi kerak");
                    return;
                }
                if (!q.correctAnswer) {
                    toast.error("Har bir variantli savol uchun to'g'ri javobni belgilang");
                    return;
                }
            }
            if (q.type === 'NUMERIC' && q.correctAnswer.trim() === '') {
                toast.error("Raqamli savol uchun to'g'ri javobni kiriting");
                return;
            }
        }

        try {
            await axiosClient.post('/homework', formData);
            toast.success("Vazifa o'quvchilarga yetkazildi!", { icon: '✅' });
            setIsModalOpen(false);
            resetForm();
            fetchTasks();
        } catch (error) {
            toast.error(error.response?.data?.message || "Vazifa yaratishda xato!");
        }
    };

    const statusLabel = (status) => {
        if (status === 'pending') return { text: 'Kutilmoqda', cls: 'pending' };
        if (status === 'submitted') return { text: 'AI tekshiruvi kutilmoqda', cls: 'pending' };
        return null; // checked -> score ko'rsatiladi
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
                        <Plus size={18} /> Yangi Vazifa / Test
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
                            <input
                                type="text"
                                placeholder="Qidirish..."
                                value={taskSearchQuery}
                                onChange={(e) => setTaskSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="tasks-list">
                        {loadingTasks ? (
                            <div className="p-4 text-center text-muted">Yuklanmoqda...</div>
                        ) : tasks.length === 0 ? (
                            <div className="p-4 text-center text-muted">Hozircha vazifalar yo'q.</div>
                        ) : filteredTasks.length === 0 ? (
                            <div className="p-4 text-center text-muted">Hech narsa topilmadi.</div>
                        ) : filteredTasks.map(task => (
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
                                    {activeTask.hasTextQuestions && (
                                        <button
                                            className={`btn btn-primary auto-check-btn ${checking ? 'checking' : ''}`}
                                            onClick={checkWithAI}
                                            disabled={checking || !submissions.some(s => s.status === 'submitted')}
                                            title="Erkin matn javoblarini AI orqali baholaydi"
                                        >
                                            {checking ? (
                                                <><span className="spinner"></span> AI Tekshirmoqda...</>
                                            ) : (
                                                <><Play size={16} fill="currentColor" /> AI bilan tekshirish</>
                                            )}
                                        </button>
                                    )}
                                </div>

                                <div className="submissions-list">
                                    {submissions.map(sub => {
                                        const pendingLabel = statusLabel(sub.status);
                                        return (
                                            <div key={sub.id} className="submission-item">
                                                <div className="sub-info">
                                                    <div className="sub-avatar">{sub.name.charAt(0)}</div>
                                                    <div>
                                                        <h4 className="sub-name">{sub.name}</h4>
                                                        <span className="sub-time">{sub.time}</span>
                                                    </div>
                                                </div>
                                                <div className="sub-result">
                                                    {pendingLabel ? (
                                                        <span className={`score-badge ${pendingLabel.cls}`}>{pendingLabel.text}</span>
                                                    ) : (
                                                        <span className={`score-badge ${sub.score >= 80 ? 'excellent' : sub.score >= 60 ? 'good' : 'poor'}`}>
                                                            {sub.score} ball
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
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
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
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

                            <div className="mb-2 flex justify-between items-center">
                                <label className="label m-0">Savollar</label>
                            </div>

                            {formData.questions.map((q, qIndex) => (
                                <div key={qIndex} className="mb-3" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                                    <div className="flex gap-2 mb-2">
                                        <select
                                            className="input-field"
                                            style={{ maxWidth: '180px' }}
                                            value={q.type}
                                            onChange={(e) => updateQuestionType(qIndex, e.target.value)}
                                        >
                                            <option value="MULTIPLE_CHOICE">Variantli (A/B/C)</option>
                                            <option value="NUMERIC">Raqamli javob</option>
                                            <option value="TEXT">Erkin matn (AI baholaydi)</option>
                                        </select>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Savol matni"
                                            value={q.text}
                                            onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                                        />
                                        {formData.questions.length > 1 && (
                                            <button type="button" className="icon-btn-small text-danger" onClick={() => removeQuestion(qIndex)}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {q.type === 'MULTIPLE_CHOICE' && (
                                        <div className="flex flex-col gap-2">
                                            {q.options.map((opt, optIndex) => (
                                                <div key={optIndex} className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name={`correct-${qIndex}`}
                                                        checked={q.correctAnswer === opt && opt !== ''}
                                                        onChange={() => updateQuestion(qIndex, { correctAnswer: opt })}
                                                        title="To'g'ri javob"
                                                    />
                                                    <input
                                                        type="text"
                                                        className="input-field"
                                                        placeholder={`Variant ${optIndex + 1}`}
                                                        value={opt}
                                                        onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                                                    />
                                                    {q.options.length > 2 && (
                                                        <button type="button" className="icon-btn-small text-danger" onClick={() => removeOption(qIndex, optIndex)}>
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button type="button" className="btn btn-sm btn-outline" style={{ alignSelf: 'flex-start' }} onClick={() => addOption(qIndex)}>
                                                <Plus size={14} /> Variant qo'shish
                                            </button>
                                        </div>
                                    )}

                                    {q.type === 'NUMERIC' && (
                                        <input
                                            type="number"
                                            className="input-field"
                                            placeholder="To'g'ri javob (masalan: 42)"
                                            value={q.correctAnswer}
                                            onChange={(e) => updateQuestion(qIndex, { correctAnswer: e.target.value })}
                                        />
                                    )}

                                    {q.type === 'TEXT' && (
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Namunaviy javob (ixtiyoriy, AI shunga qarab baholaydi)"
                                            value={q.correctAnswer}
                                            onChange={(e) => updateQuestion(qIndex, { correctAnswer: e.target.value })}
                                        />
                                    )}
                                </div>
                            ))}

                            <div className="flex gap-2 mb-4">
                                <button type="button" className="btn btn-sm btn-outline" onClick={() => addQuestion('MULTIPLE_CHOICE')}>
                                    <Plus size={14} /> Variantli savol
                                </button>
                                <button type="button" className="btn btn-sm btn-outline" onClick={() => addQuestion('NUMERIC')}>
                                    <Plus size={14} /> Raqamli savol
                                </button>
                                <button type="button" className="btn btn-sm btn-outline" onClick={() => addQuestion('TEXT')}>
                                    <Sparkles size={14} /> Erkin matn (AI)
                                </button>
                            </div>

                            <div className="flex gap-2 justify-end mt-4">
                                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}><X size={16} /> Bekor qilish</button>
                                <button type="submit" className="btn btn-primary"><Plus size={16} /> Yaratish</button>
                            </div>
                        </form>
                    </div>
                </div >
            )}
        </div >
    );
};

export default Homework;
