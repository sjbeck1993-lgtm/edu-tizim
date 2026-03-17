import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, XCircle, Search, Save, Clock, ChevronDown } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import './Attendance.css';

const Attendance = () => {
    const [students, setStudents] = useState([]);
    const [groupName, setGroupName] = useState('Yuklanmoqda...');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Group selection states
    const [courses, setCourses] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState(null);

    useEffect(() => {
        fetchCoursesData();
    }, []);

    useEffect(() => {
        if (selectedGroupId) {
            setLoading(true);
            fetchAttendance(selectedGroupId);
        }
    }, [selectedGroupId]);

    const fetchCoursesData = async () => {
        try {
            const res = await axiosClient.get('/courses');
            setCourses(res.data);

            // Auto select the first group from the first course
            let firstGroup = null;
            for (const course of res.data) {
                if (course.groups && course.groups.length > 0) {
                    firstGroup = course.groups[0].id;
                    break;
                }
            }
            if (firstGroup) {
                setSelectedGroupId(firstGroup);
            } else {
                setLoading(false);
                setGroupName("Guruhlar mavjud emas");
            }
        } catch (error) {
            console.error(error);
            toast.error("Guruhlarni yuklashda xato!");
            setLoading(false);
        }
    };

    const fetchAttendance = async (groupId) => {
        try {
            const res = await axiosClient.get(`/attendance/${groupId}`);
            setGroupName(res.data.groupName);
            setStudents(res.data.students);
        } catch (error) {
            console.error(error);
            toast.error("Guruh va o'quvchilarni topib bo'lmadi! Bunday guruh yo'qmi?");
        } finally {
            setLoading(false);
        }
    };

    const toggleAttendance = (id) => {
        setStudents(students.map(student =>
            student.id === id ? { ...student, present: !student.present } : student
        ));
    };

    const markAll = (status) => {
        setStudents(students.map(student => ({ ...student, present: status })));
        toast.success(status ? 'Barcha o\'quvchilar "kelgan" deb belgilandi!' : 'Barchasi "kelmagan"');
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const records = students.map(s => ({ studentId: s.id, present: s.present }));
            await axiosClient.post('/attendance', { groupId: selectedGroupId, records });
            toast.success("Davomat muvaffaqiyatli saqlandi!", { icon: '💾' });
        } catch (error) {
            toast.error("Davomatni saqlashda xatolik yuz berdi");
        } finally {
            setSaving(false);
        }
    };

    const handleFaceId = () => {
        toast.loading("Kamera va sun'iy intellekt ishga tushirildi...", { duration: 2000 });
        setTimeout(() => {
            // Simulate 2 random absent students
            setStudents(students.map((s, i) => i === 3 || i === 6 ? { ...s, present: false } : { ...s, present: true }));
            toast.success("Yuzlar muvaffaqiyatli tahlil qilindi! 2 ta o'quvchi kelmadi.", {
                icon: '📷',
                duration: 4000
            });
        }, 2000);
    };

    const presentCount = students.filter(s => s.present).length;
    const absentCount = students.length - presentCount;

    return (
        <div className="attendance-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Davomat Jurnali</h1>
                    <p className="page-subtitle">O'qituvchilar uchun tezkor davomat tizimi</p>
                </div>
                <div className="header-actions">
                    <div className="group-selector">
                        <select
                            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', cursor: 'pointer', appearance: 'none', paddingRight: '20px', fontWeight: 'bold' }}
                            value={selectedGroupId || ''}
                            onChange={(e) => setSelectedGroupId(parseInt(e.target.value))}
                        >
                            {!selectedGroupId && <option style={{ color: 'black' }} value="">Tanlang</option>}
                            {courses.map(course => (
                                <optgroup style={{ color: 'black' }} key={course.id} label={course.name}>
                                    {course.groups.map(g => {
                                        const isToday = g.classDays && g.classDays.includes(new Date().getDay());
                                        return (
                                            <option style={{ color: 'black' }} key={g.id} value={g.id}>
                                                {g.name} {isToday ? '(Bugun)' : ''}
                                            </option>
                                        );
                                    })}
                                </optgroup>
                            ))}
                        </select>
                        <ChevronDown size={16} style={{ position: 'absolute', right: '10px' }} />
                    </div>
                    <div className="date-display">
                        <Calendar size={18} /> Bugun: {new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })}
                    </div>
                </div>
            </div>

            <div className="attendance-stats">
                <div className="att-stat-box total">
                    <span className="att-label">Jami o'quvchilar</span>
                    <span className="att-value">{students.length}</span>
                </div>
                <div className="att-stat-box present">
                    <span className="att-label">Kelganlar</span>
                    <span className="att-value">{presentCount}</span>
                </div>
                <div className="att-stat-box absent">
                    <span className="att-label">Kelmaganlar</span>
                    <span className="att-value">{absentCount}</span>
                </div>

                <div className="att-actions">
                    <button className="btn btn-outline" onClick={() => markAll(true)}>
                        <CheckCircle2 size={16} className="text-success" /> Barchasi keldi
                    </button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
                        {saving ? <span className="spinner-small"></span> : <><Save size={16} /> Saqlash</>}
                    </button>
                </div>
            </div>

            <div className="smart-attendance-banner">
                <div className="banner-icon">
                    <Clock size={24} />
                </div>
                <div className="banner-content">
                    <h4>Vaqtni tejash rejimi</h4>
                    <p>Faqat <b>kelmagan</b> o'quvchilarni belgilang. Qolganlar avtomatik "kelgan" deb olinadi. Yoki Face ID kamerani yoqing.</p>
                </div>
                <button className="btn btn-sm btn-outline face-id-btn" onClick={handleFaceId}>
                    Face ID Yoqish
                </button>
            </div>

            <div className="students-grid animate-fade-in">
                {loading ? (
                    <div className="col-span-full text-center p-8 text-muted">Yuklanmoqda...</div>
                ) : students.length === 0 ? (
                    <div className="col-span-full text-center p-8 text-muted">Bu guruhda hali o'quvchilar yo'q.</div>
                ) : (
                    students.map(student => (
                        <div
                            key={student.id}
                            className={`student-card ${student.present ? 'present' : 'absent'}`}
                            onClick={() => toggleAttendance(student.id)}
                        >
                            <div className={`status-icon ${student.present ? 'success-icon' : 'danger-icon'}`}>
                                {student.present ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                            </div>
                            <div className="student-name">{student.name}</div>
                            <div className="click-hint">
                                {student.present ? "Kelmagan qilish" : "Kelgan qilish"}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Attendance;
