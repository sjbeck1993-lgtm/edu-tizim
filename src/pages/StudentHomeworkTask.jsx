import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosClient from '../api/axiosClient';
import './StudentStats.css';
import './StudentHomeworkTask.css';

const StudentHomeworkTask = () => {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const res = await axiosClient.get(`/homework/${taskId}/take`);
                setTask(res.data);
            } catch (error) {
                setLoadError(error.response?.data?.message || "Vazifani yuklashda xatolik yuz berdi");
            } finally {
                setLoading(false);
            }
        };
        fetchTask();
    }, [taskId]);

    const setAnswer = (questionId, value) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = async () => {
        if (!task) return;
        const unanswered = task.questions.filter(q => !answers[q.id] || String(answers[q.id]).trim() === '');
        if (unanswered.length > 0) {
            toast.error("Iltimos, barcha savollarga javob bering");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                answers: task.questions.map(q => ({ questionId: q.id, answerText: answers[q.id] }))
            };
            const res = await axiosClient.post(`/homework/${taskId}/submit`, payload);
            setResult(res.data);
            toast.success("Javoblaringiz qabul qilindi!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Yuborishda xatolik yuz berdi");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="mobile-app-container"><div className="p-8 text-center text-muted">Yuklanmoqda...</div></div>;
    }

    if (loadError) {
        return (
            <div className="mobile-app-container">
                <div className="p-8 text-center text-muted">
                    {loadError}
                    <div className="mt-4">
                        <button className="btn btn-outline" onClick={() => navigate('/panel/student-app')}><ArrowLeft size={16} /> Ortga</button>
                    </div>
                </div>
            </div>
        );
    }

    if (result) {
        return (
            <div className="mobile-app-container">
                <div className="mobile-content" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <CheckCircle2 size={64} className="text-success" />
                    <h2 className="mt-4">Topshirildi!</h2>
                    <p className="text-muted">
                        {result.autoGraded ? "Javoblaringiz tekshirildi, natijangizni \"Vazifalarim\" bo'limida ko'rishingiz mumkin." : "Javoblaringiz qabul qilindi, ustoz/AI tez orada tekshiradi."}
                    </p>
                    <button className="btn btn-primary mt-4" onClick={() => navigate('/panel/student-app')}>Vazifalarimga qaytish</button>
                </div>
            </div>
        );
    }

    return (
        <div className="mobile-app-container">
            <div className="mobile-header" style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
                <button className="hw-back-btn" onClick={() => navigate('/panel/student-app')}><ArrowLeft size={18} /></button>
                <h2 style={{ marginTop: '0.75rem' }}>{task.title}</h2>
                <p>Muhlat: {new Date(task.deadline).toLocaleDateString()}</p>
            </div>

            <div className="mobile-content">
                {task.questions.map((q, idx) => (
                    <div key={q.id} className="hw-question-card">
                        <p className="hw-question-text"><b>{idx + 1}.</b> {q.text}</p>

                        {q.type === 'MULTIPLE_CHOICE' && (
                            <div className="hw-options">
                                {q.options.map((opt, oi) => (
                                    <label key={oi} className={`hw-option ${answers[q.id] === opt ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name={`q-${q.id}`}
                                            checked={answers[q.id] === opt}
                                            onChange={() => setAnswer(q.id, opt)}
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        )}

                        {q.type === 'NUMERIC' && (
                            <input
                                type="number"
                                className="input-field"
                                placeholder="Javobingiz"
                                value={answers[q.id] || ''}
                                onChange={(e) => setAnswer(q.id, e.target.value)}
                            />
                        )}

                        {q.type === 'TEXT' && (
                            <textarea
                                className="input-field"
                                rows={3}
                                placeholder="Javobingizni shu yerga yozing"
                                value={answers[q.id] || ''}
                                onChange={(e) => setAnswer(q.id, e.target.value)}
                            />
                        )}
                    </div>
                ))}

                <button className="btn btn-primary w-full mt-4" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Yuborilmoqda...' : 'Javoblarni Topshirish'}
                </button>
            </div>
        </div>
    );
};

export default StudentHomeworkTask;
