import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, TrendingUp, Users, ShieldCheck, Phone, Menu, X, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosClient from '../api/axiosClient';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [menuOpen, setMenuOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', course: '' });

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await axiosClient.get('/public/courses');
                setCourses(res.data);
                if (res.data.length > 0) {
                    setFormData(prev => ({ ...prev, course: res.data[0].name }));
                }
            } catch (error) {
                console.error(error);
            }
        };
        fetchCourses();
    }, []);

    const scrollTo = (id) => {
        setMenuOpen(false);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleEnroll = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axiosClient.post('/public/leads', formData);
            toast.success("Arizangiz qabul qilindi! Tez orada bog'lanamiz.", { icon: '🎉' });
            setFormData(prev => ({ ...prev, name: '', phone: '' }));
        } catch (error) {
            toast.error(error.response?.data?.message || "Xatolik yuz berdi, qayta urinib ko'ring.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="home-page">
            <nav className="home-nav">
                <div className="home-nav-inner">
                    <div className="home-logo">
                        <img src="/logo-icon.png" alt="Smart Learning Center" />
                        <span>Smart Learning Center</span>
                    </div>
                    <div className={`home-nav-links ${menuOpen ? 'open' : ''}`}>
                        <button onClick={() => scrollTo('courses')}>Kurslar</button>
                        <button onClick={() => scrollTo('why-us')}>Biz haqimizda</button>
                        <button onClick={() => scrollTo('enroll')}>Bog'lanish</button>
                        <button className="btn btn-outline" onClick={() => navigate('/login')}>Kirish</button>
                        <button className="btn btn-primary" onClick={() => scrollTo('enroll')}>Ro'yxatdan o'tish</button>
                    </div>
                    <button className="home-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                        {menuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            <header className="home-hero">
                <div className="home-hero-content">
                    <h1>Farzandingiz kelajagi uchun <span>eng ishonchli</span> qadam</h1>
                    <p>Smart Learning Center — zamonaviy o'qitish uslubi, tajribali ustozlar va har bir o'quvchi natijasini onlayn kuzatib borish imkoniyati bilan.</p>
                    <div className="home-hero-actions">
                        <button className="btn btn-primary btn-lg" onClick={() => scrollTo('enroll')}>Bepul konsultatsiyaga yoziling</button>
                        <button className="btn btn-outline btn-lg" onClick={() => scrollTo('courses')}>Kurslarni ko'rish</button>
                    </div>
                </div>
                <svg className="home-hero-illustration" viewBox="0 0 440 380" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <circle cx="60" cy="330" r="6" fill="white" opacity="0.15" />
                    <circle cx="400" cy="300" r="5" fill="white" opacity="0.15" />
                    <circle cx="410" cy="60" r="6" fill="white" opacity="0.15" />

                    <rect x="40" y="40" width="360" height="260" rx="24" fill="white" opacity="0.08" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />

                    <circle cx="220" cy="120" r="36" fill="#fbbf24" opacity="0.9" />
                    <rect x="150" y="180" width="140" height="70" rx="12" fill="white" opacity="0.15" />
                    <rect x="170" y="200" width="100" height="10" rx="5" fill="white" opacity="0.5" />
                    <rect x="170" y="220" width="70" height="10" rx="5" fill="white" opacity="0.35" />

                    <path d="M90 260 L150 200 L200 230 L260 150 L340 90" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
                    <circle cx="340" cy="90" r="5" fill="#fbbf24" />
                </svg>
            </header>

            <section id="why-us" className="home-section">
                <h2 className="home-section-title">Nega aynan biz?</h2>
                <div className="home-features">
                    <div className="home-feature-card">
                        <div className="home-feature-icon"><GraduationCap size={28} /></div>
                        <h3>Tajribali ustozlar</h3>
                        <p>Har bir yo'nalish bo'yicha sinovdan o'tgan, natijaga yo'naltirilgan o'qituvchilar.</p>
                    </div>
                    <div className="home-feature-card">
                        <div className="home-feature-icon"><TrendingUp size={28} /></div>
                        <h3>Natijani kuzatish</h3>
                        <p>Har bir dars, har bir baho — ota-onalar uchun shaffof va onlayn ko'rinadi.</p>
                    </div>
                    <div className="home-feature-card">
                        <div className="home-feature-icon"><Users size={28} /></div>
                        <h3>Individual yondashuv</h3>
                        <p>Kichik guruhlar, har bir o'quvchiga alohida e'tibor.</p>
                    </div>
                    <div className="home-feature-card">
                        <div className="home-feature-icon"><ShieldCheck size={28} /></div>
                        <h3>Ishonchli tizim</h3>
                        <p>To'lovlar, davomat va topshiriqlar — zamonaviy raqamli tizim orqali nazorat qilinadi.</p>
                    </div>
                </div>
            </section>

            <section id="courses" className="home-section home-section-alt">
                <h2 className="home-section-title">Kurslarimiz</h2>
                <div className="home-courses">
                    {courses.length === 0 ? (
                        <p className="text-center text-muted">Kurslar hozircha yuklanmoqda...</p>
                    ) : courses.map(course => (
                        <div key={course.id} className="home-course-card">
                            <h3>{course.name}</h3>
                            {course.description && <p className="home-course-desc">{course.description}</p>}
                            <div className="home-course-price">
                                {new Intl.NumberFormat('uz-UZ').format(course.monthlyPrice)} so'm <span>/ oyiga</span>
                            </div>
                            <button className="btn btn-outline w-full" onClick={() => { setFormData(prev => ({ ...prev, course: course.name })); scrollTo('enroll'); }}>
                                Ro'yxatdan o'tish
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            <section id="enroll" className="home-section home-enroll">
                <div className="home-enroll-inner">
                    <div className="home-enroll-text">
                        <h2>Bepul konsultatsiyaga yoziling</h2>
                        <p>Ma'lumotlaringizni qoldiring — mutaxassislarimiz siz bilan tez orada bog'lanadi.</p>
                        <ul className="home-enroll-points">
                            <li><CheckCircle2 size={18} /> Bepul sinov darsi</li>
                            <li><CheckCircle2 size={18} /> Individual dastur tavsiyasi</li>
                            <li><CheckCircle2 size={18} /> Hech qanday majburiyatsiz</li>
                        </ul>
                    </div>
                    <form className="home-enroll-form" onSubmit={handleEnroll}>
                        <div className="mb-3">
                            <label className="label">Ism familiyangiz</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Masalan: Sardor Aliyev"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="label">Telefon raqamingiz</label>
                            <input
                                type="tel"
                                className="input-field"
                                placeholder="+998 90 123 45 67"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                            />
                        </div>
                        {courses.length > 0 && (
                            <div className="mb-4">
                                <label className="label">Qiziqayotgan yo'nalish</label>
                                <select
                                    className="input-field"
                                    value={formData.course}
                                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                                >
                                    {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                        )}
                        <button type="submit" className="btn btn-primary w-full btn-lg" disabled={submitting}>
                            {submitting ? 'Yuborilmoqda...' : 'Ariza yuborish'}
                        </button>
                    </form>
                </div>
            </section>

            <footer className="home-footer">
                <div className="home-footer-inner">
                    <div className="home-logo">
                        <img src="/logo-icon.png" alt="Smart Learning Center" />
                        <span>Smart Learning Center</span>
                    </div>
                    <div className="home-footer-contact">
                        <a href="tel:+998900000000"><Phone size={16} /> +998 90 000 00 00</a>
                    </div>
                    <p className="home-footer-copy">&copy; {new Date().getFullYear()} Smart Learning Center. Barcha huquqlar himoyalangan.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
