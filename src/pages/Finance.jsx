import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Download, Search, Filter, CreditCard, AlertCircle, MessageSquare, Plus, Trash2, X, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import './Finance.css';



const Finance = () => {
    const [payments, setPayments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('Barchasi');
    const [loading, setLoading] = useState(true);

    // Form and Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [studentsList, setStudentsList] = useState([]);
    const [formData, setFormData] = useState({ studentId: '', amount: '300000', month: new Date().toISOString().split('T')[0], method: 'Naqd', status: 'paid' });

    useEffect(() => {
        fetchPayments();
        fetchStudentsList();
    }, []);

    const fetchStudentsList = async () => {
        try {
            const res = await axiosClient.get('/payments/students');
            setStudentsList(res.data);
            if (res.data.length > 0) {
                setFormData(prev => ({ ...prev, studentId: res.data[0].id }));
            }
        } catch (error) {
            console.error("Studentlarni yuklashda xato:", error);
        }
    };

    const fetchPayments = async () => {
        try {
            const res = await axiosClient.get('/payments');
            const data = res.data.map(p => ({
                id: p.id,
                student: p.student?.name || 'Noma\'lum',
                group: p.student?.studentProfile?.group?.name || 'Umumiy',
                method: p.method || '-',
                rawAmount: p.amount,
                amount: new Intl.NumberFormat('uz-UZ').format(p.amount) + ' UZS',
                month: p.month,
                status: p.status,
                receiptUrl: p.receiptUrl,
                date: new Date(p.paymentDate).toLocaleDateString()
            }));
            setPayments(data);
        } catch (error) {
            console.error(error);
            toast.error("To'lovlarni yuklashda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    const filterPayments = () => {
        return payments.filter(p => {
            const matchesSearch = p.student.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesMonth = selectedMonth === 'Barchasi' || p.month === selectedMonth;
            return matchesSearch && matchesMonth;
        });
    };

    const handleExcelExport = () => {
        toast.success("Excel hisobot yuklanmoqda...", { icon: '📊' });
    };

    const handleBulkSMS = async (smsType) => {
        try {
            const res = await axiosClient.post('/payments/sms', {
                type: smsType, // 'bulk' veya 'bulk-private'
                month: selectedMonth
            });
            toast.success(res.data.message, { icon: '🤖' });
            setIsSmsModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "SMS yuborishda xatolik!");
            setIsSmsModalOpen(false);
        }
    };

    const handleSingleSMS = async (payment) => {
        try {
            const res = await axiosClient.post('/payments/sms', {
                type: 'single',
                studentName: payment.student,
                month: payment.month,
                amount: new Intl.NumberFormat('uz-UZ').format(payment.rawAmount)
            });
            toast.success(res.data.message, { icon: '✉️' });
        } catch (error) {
            toast.error("SMS yuborishda xato!");
        }
    };

    const handleViewReceipt = (payment) => {
        setSelectedReceipt(payment);
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post('/payments', formData);
            if (formData.status === 'debt') {
                toast.success("Qarzdorlik yozildi!");
            } else {
                toast.success("To'lov muvaffaqiyatli qabul qilindi!");
            }
            setIsModalOpen(false);
            setFormData({ studentId: studentsList.length > 0 ? studentsList[0].id : '', amount: '300000', month: new Date().toISOString().split('T')[0], method: 'Naqd', status: 'paid' });
            fetchPayments();
        } catch (error) {
            toast.error("Xatolik yuz berdi");
        }
    };

    const handleAutoDebt = async () => {
        if (!window.confirm(`${selectedMonth} oyi uchun barcha to'lamaganlarga avtomatik qarz yozamizmi?`)) return;
        try {
            const res = await axiosClient.post('/payments/auto-debt', { month: selectedMonth });
            toast.success(res.data.message);
            fetchPayments();
        } catch (error) {
            toast.error(error.response?.data?.message || "Avtomatik qarz hisoblashda xatolik yuz berdi!");
        }
    };

    const handleDeletePayment = async (id) => {
        if (!window.confirm("Rostdan ham ushbu to'lovni o'chirmoqchimisiz?")) return;
        try {
            await axiosClient.delete(`/payments/${id}`);
            toast.success("To'lov o'chirildi!");
            fetchPayments();
        } catch (error) {
            toast.error("Xatolik yuz berdi!");
        }
    };

    const handleApprovePayment = async (id) => {
        if (!window.confirm("Ushbu to'lovni tasdiqlaysizmi?")) return;
        try {
            await axiosClient.put(`/payments/approve/${id}`);
            toast.success("To'lov tasdiqlandi!");
            fetchPayments();
        } catch (error) {
            toast.error("Tasdiqlashda xatolik yuz berdi!");
        }
    };

    // Calculate dynamic stats based on current filter or universally
    const currentMonthRevenue = payments
        .filter(p => p.status === 'paid' && (selectedMonth === 'Barchasi' || p.month === selectedMonth))
        .reduce((sum, current) => sum + current.rawAmount, 0);

    const indebtedStudents = payments.filter(p => p.status === 'debt' && (selectedMonth === 'Barchasi' || p.month === selectedMonth));
    const totalDebtAmount = indebtedStudents.reduce((sum, current) => sum + current.rawAmount, 0);

    return (
        <div className="finance-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Moliya va To'lovlar</h1>
                    <p className="page-subtitle">O'quvchilar to'lovlari, qarzdorliklar va hisobotlar</p>
                </div>
                <div className="header-actions">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="O'quvchi izlash..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="btn btn-outline"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        style={{ appearance: 'auto', paddingRight: '25px' }}
                    >
                        <option value="Barchasi">Barchasi</option>
                        <option value="Yanvar">Yanvar</option>
                        <option value="Fevral">Fevral</option>
                        <option value="Mart">Mart</option>
                        <option value="Aprel">Aprel</option>
                        <option value="May">May</option>
                    </select>
                    <button className="btn btn-outline" onClick={handleAutoDebt} title="To'lamaganlarga avtomatik qarz yozish">
                        <AlertCircle size={18} /> Avtomatik Qarz
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} /> Yangi To'lov / Qarz
                    </button>
                    <button className="btn btn-outline" onClick={handleExcelExport}>
                        <Download size={18} /> Excel
                    </button>
                </div>
            </div>

            <div className="finance-stats">
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                        <CreditCard size={24} />
                    </div>
                    <div className="stat-info">
                        <h3 className="stat-value">{(currentMonthRevenue / 1000000).toFixed(1)} mln</h3>
                        <p className="stat-label">{selectedMonth === 'Barchasi' ? 'Jami tushum' : `${selectedMonth} tushumi`}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                        <AlertCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <h3 className="stat-value">{(totalDebtAmount / 1000000).toFixed(1)} mln</h3>
                        <p className="stat-label">Jami qarzdorlik (<span className="text-danger">{indebtedStudents.length} kishi</span>)</p>
                    </div>
                    <button className="btn btn-danger-outline sms-btn" onClick={() => setIsSmsModalOpen(true)}>
                        <MessageSquare size={14} /> Barchasiga SMS
                    </button>
                </div>

                <div className="payment-systems">
                    <p className="systems-title">To'lov turlari holati:</p>
                    <div className="systems-list">
                        <span className="system-badge success" onClick={() => toast('Karta orqali to\'lov ishonchli ishlamoqda', { icon: '✅' })} style={{ cursor: 'pointer' }}>Karta orqali (Faol)</span>
                        <span className="system-badge success" onClick={() => toast('Naqd pul qabuli faol', { icon: '✅' })} style={{ cursor: 'pointer' }}>Naqd (Faol)</span>
                        <span className="system-badge success" onClick={() => toast('Bank o\'tkazmalari qabuli faol', { icon: '✅' })} style={{ cursor: 'pointer' }}>Bank o'tkazma (Faol)</span>
                    </div>
                </div>
            </div>

            <div className="card payments-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>O'quvchi</th>
                            <th>Guruh</th>
                            <th>Davr (Sana)</th>
                            <th>Summa</th>
                            <th>To'lov Turi</th>
                            <th>Sana</th>
                            <th>Holat</th>
                            <th>Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filterPayments().map(payment => (
                            <tr key={payment.id}>
                                <td className="font-semibold">{payment.student}</td>
                                <td>{payment.group}</td>
                                <td>{payment.month}</td>
                                <td className="font-semibold">{payment.amount}</td>
                                <td>
                                    {payment.method !== '-' && (
                                        <span className={`method-badge ${payment.method.toLowerCase().includes('karta') ? 'payme' : payment.method.toLowerCase().includes('bank') ? 'uzum' : 'click'}`}>
                                            {payment.method}
                                        </span>
                                    )}
                                    {payment.method === '-' && '-'}
                                </td>
                                <td className="text-sm text-muted">{payment.date}</td>
                                <td>
                                    <span className={`status-badge ${payment.status === 'paid' ? 'success' : payment.status === 'debt' ? 'danger' : 'warning'}`}>
                                        {payment.status === 'paid' ? 'To\'langan' : payment.status === 'debt' ? 'Qarzdor' : 'Kutilmoqda'}
                                    </span>
                                </td>
                                <td>
                                    <div className="flex gap-2">
                                        {payment.status === 'pending' ? (
                                            <>
                                                {payment.receiptUrl && (
                                                    <button className="btn btn-sm btn-outline" onClick={() => window.open(`https://edu-tizim-production.up.railway.app${payment.receiptUrl}`, '_blank')}>
                                                        Chekni ko'rish
                                                    </button>
                                                )}
                                                <button className="btn btn-sm btn-primary" onClick={() => handleApprovePayment(payment.id)}>
                                                    Tasdiqlash
                                                </button>
                                            </>
                                        ) : payment.status === 'debt' ? (
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleSingleSMS(payment)}>
                                                <MessageSquare size={14} className="mr-1" /> SMS yuborish
                                            </button>
                                        ) : (
                                            <button className="btn btn-sm btn-outline" onClick={() => handleViewReceipt(payment)}>Chekni ko'rish</button>
                                        )}
                                        <button
                                            className="icon-btn-small text-danger"
                                            onClick={() => handleDeletePayment(payment.id)}
                                            title="O'chirish"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filterPayments().length === 0 && (
                            <tr>
                                <td colSpan="8" className="text-center py-4 text-muted">Hech nima topilmadi</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="modal-title m-0">Yangi To'lov Qabul Qilish</h3>
                            <button className="icon-btn-small" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddPayment}>
                            <div className="mb-2">
                                <label className="label">O'quvchi</label>
                                <select
                                    className="input-field"
                                    value={formData.studentId}
                                    onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                                    required
                                >
                                    {studentsList.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                    {studentsList.length === 0 && <option value="">O'quvchilar yo'q</option>}
                                </select>
                            </div>
                            <div className="mb-2">
                                <label className="label">Summa (UZS)</label>
                                <input type="number" className="input-field" placeholder="Masalan: 300000"
                                    value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required />
                            </div>
                            <div className="mb-2">
                                <label className="label">Qachondan e'tiboran (Davr)</label>
                                <input type="date" className="input-field"
                                    value={formData.month} onChange={e => setFormData({ ...formData, month: e.target.value })} required />
                            </div>
                            <div className="mb-4">
                                <label className="label">Bajariladigan Amal</label>
                                <div className="flex gap-4 p-2 bg-gray-50 rounded-lg border">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="paid"
                                            checked={formData.status === 'paid'}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        />
                                        <span className="text-success font-medium">To'lov qabul qilish</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="debt"
                                            checked={formData.status === 'debt'}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        />
                                        <span className="text-danger font-medium">Qarz deb yozish</span>
                                    </label>
                                </div>
                            </div>

                            {formData.status === 'paid' && (
                                <div className="mb-4">
                                    <label className="label">To'lov usuli</label>
                                    <select
                                        className="input-field"
                                        value={formData.method}
                                        onChange={e => setFormData({ ...formData, method: e.target.value })}
                                        required
                                    >
                                        <option value="Naqd">Naqd Pul</option>
                                        <option value="Karta">Karta orqali</option>
                                        <option value="Bank">Bank o'tkazmasi</option>
                                    </select>
                                </div>
                            )}
                            <div className="flex gap-2 justify-end mt-4">
                                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Bekor qilish</button>
                                <button type="submit" className={`btn ${formData.status === 'debt' ? 'btn-danger' : 'btn-primary'}`}>
                                    {formData.status === 'debt' ? 'Qarz qo\'shish' : 'To\'lovni Saqlash'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isSmsModalOpen && (
                <div className="modal-overlay" onClick={() => setIsSmsModalOpen(false)}>
                    <div className="modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="modal-title m-0">SMS Yuborish Usulini Tanlang</h3>
                            <button className="icon-btn-small" onClick={() => setIsSmsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <p className="mb-4 text-sm text-muted">Barcha qarzdorlarga xabarnomani qanday shaklda yuboramiz?</p>
                        <div className="flex flex-col gap-3">
                            <button className="btn btn-outline flex items-center justify-center gap-2" onClick={() => handleBulkSMS('bulk')}>
                                <Users size={18} /> Umumiy Guruhga Yuborish (Ro'yxat bo'lib)
                            </button>
                            <button className="btn btn-primary flex items-center justify-center gap-2" onClick={() => handleBulkSMS('bulk-private')}>
                                <MessageSquare size={18} /> Alohida Kontaktlarga (Lichkalarga) Yuborish
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* RECEIPT MODAL */}
            {selectedReceipt && (
                <div className="modal-overlay" onClick={() => setSelectedReceipt(null)}>
                    <div className="modal-content" style={{ maxWidth: '360px', fontFamily: 'monospace' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="modal-title m-0" style={{ fontSize: '16px' }}>🧾 To'lov Cheki</h3>
                            <button className="icon-btn-small" onClick={() => setSelectedReceipt(null)}><X size={20} /></button>
                        </div>
                        <div style={{ borderTop: '2px dashed #ccc', borderBottom: '2px dashed #ccc', padding: '14px 0', margin: '8px 0' }}>
                            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                                <strong style={{ fontSize: '18px' }}>SmartCenter</strong><br />
                                <small style={{ color: '#888' }}>O'quv markazi to'lov tizimi</small>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <tbody>
                                    <tr><td style={{ padding: '4px 0', color: '#888' }}>O'quvchi:</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{selectedReceipt.student}</td></tr>
                                    <tr><td style={{ padding: '4px 0', color: '#888' }}>Guruh:</td><td style={{ textAlign: 'right' }}>{selectedReceipt.group}</td></tr>
                                    <tr><td style={{ padding: '4px 0', color: '#888' }}>Davr:</td><td style={{ textAlign: 'right' }}>{selectedReceipt.month}</td></tr>
                                    <tr><td style={{ padding: '4px 0', color: '#888' }}>To'lov turi:</td><td style={{ textAlign: 'right' }}>{selectedReceipt.method}</td></tr>
                                    <tr><td style={{ padding: '4px 0', color: '#888' }}>Sana:</td><td style={{ textAlign: 'right' }}>{selectedReceipt.date}</td></tr>
                                    <tr style={{ borderTop: '1px solid #eee' }}><td style={{ padding: '8px 0', fontWeight: 700, fontSize: '15px' }}>JAMI:</td><td style={{ textAlign: 'right', fontWeight: 700, fontSize: '15px', color: 'var(--success)' }}>{selectedReceipt.amount}</td></tr>
                                    <tr><td style={{ padding: '4px 0', color: '#888' }}>Holat:</td><td style={{ textAlign: 'right' }}><span style={{ color: 'var(--success)', fontWeight: 600 }}>✅ To'langan</span></td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '11px', color: '#aaa' }}>
                            Chek ID: #{selectedReceipt.id?.slice(0, 8)?.toUpperCase()}<br />
                            Rahmat! Yana keling. 😊
                        </div>
                        <div className="flex gap-2 justify-center mt-4">
                            <button className="btn btn-outline" onClick={() => window.print()}>🖨️ Chop etish</button>
                            <button className="btn btn-primary" onClick={() => setSelectedReceipt(null)}>Yopish</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Finance;
