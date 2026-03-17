import React, { useState } from 'react';
import { Brain, Star, FileText, Download, Award, Target, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import './AIAnalyst.css';

const AIAnalyst = () => {
    const [generatingCert, setGeneratingCert] = useState(false);

    const handleGenerateCertificate = () => {
        setGeneratingCert(true);
        toast.loading("Sertifikatlar generatsiya qilinmoqda, kutib turing...", { duration: 2500 });
        setTimeout(() => {
            setGeneratingCert(false);
            toast.success("12 ta PDF sertifikat yozib olindi!", { icon: '🎓' });
        }, 2500);
    };

    const handleContactTeacher = () => {
        toast("Mavzu haqida tegishli ustozga bildirishnoma yetkazildi", { icon: '🔔' });
    };

    const handleSendSMS = () => {
        toast.success("O'ylanayotgan 12 ta mijozga 15% chegirma taklifi yuborildi.", { icon: '💬' });
    };

    const handleDownloadPDF = () => {
        toast.success("PDF fayllar arxivlanmoqda va yuklab olinadi...", { icon: '📥' });
    };

    return (
        <div className="ai-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">AI Tahlilchi va Sertifikatlar</h1>
                    <p className="page-subtitle">Sun'iy intellekt tavsiyalari va avtomatlashtirilgan hujjatlar</p>
                </div>
            </div>

            <div className="ai-grid animate-fade-in">
                {/* Left Column: AI Analyst */}
                <div className="ai-insights-column">
                    <h2 className="section-title flex items-center gap-2">
                        <Brain className="text-purple-600" /> AI Tahliliy Xulosalar
                    </h2>

                    <div className="insight-cards">
                        <div className="insight-card critical">
                            <div className="insight-header">
                                <span className="insight-tag danger">Diqqat talab qilinadi</span>
                                <span className="insight-time">Bugun</span>
                            </div>
                            <h3 className="insight-title">Matematika guruhida o'zlashtirish pasaydi</h3>
                            <p className="insight-detail">
                                "Kvadrat tenglamalar" mavzusidan keyin 14 ta o'quvchining baholari o'rtacha 15% ga tushib ketdi. O'qituvchiga ushbu mavzuni qayta o'tish tavsiya qilinadi.
                            </p>
                            <button className="btn btn-sm btn-outline mt-3" onClick={handleContactTeacher}>
                                <MessageSquare size={14} className="mr-1" /> Ustozi bilan bog'lanish
                            </button>
                        </div>

                        <div className="insight-card positive">
                            <div className="insight-header">
                                <span className="insight-tag success">Yaxshi ko'rsatkich</span>
                                <span className="insight-time">Kecha</span>
                            </div>
                            <h3 className="insight-title">Ingliz tili guruhi faollashdi</h3>
                            <p className="insight-detail">
                                Gamifikatsiya (tanga yig'ish) tizimi joriy qilingandan so'ng, o'quvchilarning uy vazifasini vaqtida topshirish ko'rsatkichi 40% ga oshdi.
                            </p>
                        </div>

                        <div className="insight-card suggestion">
                            <div className="insight-header">
                                <span className="insight-tag info">Tavsiya</span>
                                <span className="insight-time">2 kun oldin</span>
                            </div>
                            <h3 className="insight-title">Yangi guruh ochish vaqti keldi</h3>
                            <p className="insight-detail">
                                "Kiberxavfsizlik" yo'nalishi bo'yicha 12 ta "O'ylanayotganlar" ro'yxatida yig'ilib qoldi. Ularga 15% chegirma bilan guruh ochish taklifini yuboring.
                            </p>
                            <button className="btn btn-sm btn-primary mt-3" onClick={handleSendSMS}>SMS yuborish</button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Auto Certificates */}
                <div className="certificates-column">
                    <h2 className="section-title flex items-center gap-2">
                        <Award className="text-yellow-600" /> Avto-Sertifikatlar
                    </h2>

                    <div className="certificate-generator card">
                        <div className="generator-header">
                            <Target size={24} className="text-primary-blue" />
                            <div>
                                <h3>Kursni yakunlaganlar (Bu oy)</h3>
                                <p>Jami: 24 nafar o'quvchi</p>
                            </div>
                        </div>

                        <div className="course-selector mb-4 mt-4">
                            <label className="label">Qaysi kurs uchun generatorni ishga tushiramiz?</label>
                            <select className="input-field" onChange={(e) => toast(`"${e.target.value}" kursi tanlandi`, { icon: '📜' })}>
                                <option>Frontend Dasturlash (12 ta o'quvchi)</option>
                                <option>Mental Arifmetika (8 ta o'quvchi)</option>
                                <option>Ingliz tili - IELTS (4 ta o'quvchi)</option>
                            </select>
                        </div>

                        <div className="cert-preview">
                            <div className="cert-design">
                                <div className="cert-border">
                                    <h1 className="cert-title">CERTIFICATE</h1>
                                    <h3 className="cert-subtitle">OF COMPLETION</h3>
                                    <p className="cert-text">This is proudly presented to</p>
                                    <h2 className="cert-name">[O'QUVCHI ISMI FI]</h2>
                                    <p className="cert-text mt-2">for successfully completing the course</p>
                                    <h3 className="cert-course">[KURS NOMI]</h3>

                                    <div className="cert-signatures">
                                        <div className="sig-line">Instructor</div>
                                        <div className="sig-line">Director</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            className={`btn btn-primary w-full mt-4 flex justify-center gap-2 items-center ${generatingCert ? 'opacity-70' : ''}`}
                            onClick={handleGenerateCertificate}
                            disabled={generatingCert}
                        >
                            {generatingCert ? (
                                <><span className="spinner-small"></span> Generatsiya qilinmoqda...</>
                            ) : (
                                <><FileText size={18} /> 12 ta Sertifikatni Generatsiya Qilish</>
                            )}
                        </button>

                        {!generatingCert && (
                            <button className="btn btn-outline w-full mt-2 flex justify-center gap-2 items-center" onClick={handleDownloadPDF}>
                                <Download size={18} /> PDF formatida yuklab olish
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIAnalyst;
