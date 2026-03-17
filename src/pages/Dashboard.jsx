import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import {
    Users,
    TrendingUp,
    DollarSign,
    BookOpen,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        students: 0, revenue: 0, groups: 0, newLeads: 0,
        revenueData: [], attendanceData: [], recentActivities: []
    });
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // 'YYYY-MM' format
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const res = await axiosClient.get(`/dashboard/stats?month=${selectedMonth}`);
                setStats(res.data);
            } catch (error) {
                console.error("Dashboard xatosi:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [selectedMonth]);

    const handleDateChange = (e) => {
        setSelectedMonth(e.target.value);
        toast.success("Tanlangan oy bo'yicha hisobot yuklandi", { icon: '📅' });
    };

    const handleViewAll = (section) => {
        if (section === "To'lovlar" || section === "Moliya dinamikasi") {
            navigate('/finance');
        } else if (section === "Haftalik Davomat") {
            navigate('/attendance');
        } else if (section === "O'quvchilar") {
            navigate('/students');
        } else if (section === "Guruhlar") {
            navigate('/courses');
        } else if (section === "Lidlar") {
            navigate('/leads');
        } else {
            toast(`Bunday bo'lim topilmadi`, { icon: '⚠️' });
        }
    };

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Umumiy Ko'rsatkichlar</h1>
                    <p className="page-subtitle">O'quv markazining so'nggi ma'lumotlari</p>
                </div>
                <div className="header-actions">
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Calendar size={18} style={{ position: 'absolute', left: '12px', color: '#6b7280', zIndex: 1, pointerEvents: 'none' }} />
                        <input
                            type="month"
                            className="date-picker-btn"
                            value={selectedMonth}
                            onChange={handleDateChange}
                            style={{ paddingLeft: '38px' }}
                        />
                    </div>
                </div>
            </div>

            <div className="stats-grid animate-fade-in">
                <div className="stat-card" onClick={() => handleViewAll("O'quvchilar")} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon-wrapper blue">
                        <Users size={24} className="stat-icon" />
                    </div>
                    <div className="stat-details">
                        <p className="stat-label">Jami O'quvchilar</p>
                        <h3 className="stat-value">{loading ? '...' : stats.students}</h3>
                    </div>
                    <div className="stat-trend positive">
                        <ArrowUpRight size={16} />
                        <span>O'quvchilar ro'yxati</span>
                    </div>
                </div>

                <div className="stat-card" onClick={() => handleViewAll("Moliya dinamikasi")} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon-wrapper green">
                        <DollarSign size={24} className="stat-icon" />
                    </div>
                    <div className="stat-details">
                        <p className="stat-label">Oylik Tushum</p>
                        <h3 className="stat-value">{loading ? '...' : `${(stats.revenue / 1000000).toFixed(1)} mln`}</h3>
                    </div>
                    <div className="stat-trend positive">
                        <ArrowUpRight size={16} />
                        <span>Moliya bo'limi</span>
                    </div>
                </div>

                <div className="stat-card" onClick={() => handleViewAll("Guruhlar")} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon-wrapper purple">
                        <BookOpen size={24} className="stat-icon" />
                    </div>
                    <div className="stat-details">
                        <p className="stat-label">Faol Guruhlar</p>
                        <h3 className="stat-value">{loading ? '...' : stats.groups}</h3>
                    </div>
                    <div className="stat-trend neutral">
                        <span>Guruhlarni ko'rish</span>
                    </div>
                </div>

                {/*
                <div className="stat-card" onClick={() => handleViewAll("Lidlar")} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon-wrapper orange">
                        <TrendingUp size={24} className="stat-icon" />
                    </div>
                    <div className="stat-details">
                        <p className="stat-label">Yangi Lidlar (So'rovlar)</p>
                        <h3 className="stat-value">{loading ? '...' : stats.newLeads}</h3>
                    </div>
                    <div className="stat-trend negative">
                        <ArrowUpRight size={16} />
                        <span>Voronkani ochish</span>
                    </div>
                </div>
                */}
            </div>

            <div className="charts-grid animate-fade-in">
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Moliya dinamikasi (Mln UZS)</h3>
                        <button className="icon-btn" onClick={() => handleViewAll('Moliya dinamikasi')}>Barchasi</button>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary-blue)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--primary-blue)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="var(--primary-blue)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Haftalik Davomat</h3>
                        <button className="icon-btn" onClick={() => handleViewAll('Haftalik Davomat')}>Barchasi</button>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                                />
                                <Bar dataKey="kelgan" stackId="a" fill="var(--success)" radius={[0, 0, 4, 4]} />
                                <Bar dataKey="kelmagan" stackId="a" fill="var(--danger)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="dashboard-bottom-grid mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="recent-activity animate-fade-in" style={{ marginTop: 0 }}>
                    <div className="view-all-header">
                        <h3 className="section-title">So'nggi O'quvchilar To'lovlari</h3>
                        <button className="btn btn-sm btn-outline" onClick={() => handleViewAll("To'lovlar")}>Barchasini ko'rish</button>
                    </div>
                    <div className="activity-list">
                        {stats.recentActivities && stats.recentActivities.length > 0 ? (
                            stats.recentActivities.map((activity, idx) => (
                                <div key={activity.id || idx} className="activity-item">
                                    <div className="activity-avatar">
                                        {activity.studentName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="activity-info">
                                        <p className="activity-name">{activity.studentName}</p>
                                        <p className="activity-course">{activity.course}</p>
                                    </div>
                                    <div className="activity-amount text-success font-semibold">
                                        {new Intl.NumberFormat('uz-UZ').format(activity.amount)} UZS
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-muted text-center py-4">Hozircha to'lovlar yo'q</p>
                        )}
                    </div>
                </div>

                <div className="todays-classes animate-fade-in bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="view-all-header flex justify-between items-center mb-4">
                        <h3 className="section-title font-semibold text-gray-800 m-0">Bugungi Darslar</h3>
                        <div className="text-sm px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium border border-blue-100 flex items-center gap-1">
                            <Clock size={14} /> {stats.todaysClasses?.length || 0} ta guruh
                        </div>
                    </div>

                    <div className="activity-list space-y-3">
                        {stats.todaysClasses && stats.todaysClasses.length > 0 ? (
                            stats.todaysClasses.map((cls, idx) => (
                                <div key={cls.id || idx} className="activity-item flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                            {cls.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="activity-info">
                                            <p className="activity-name font-semibold text-gray-800 m-0">{cls.name}</p>
                                            <p className="activity-course text-xs text-gray-500 m-0">{cls.course} • O'qituvchi: {cls.teacher}</p>
                                        </div>
                                    </div>
                                    <div className="font-semibold text-gray-700 flex items-center gap-1">
                                        <Clock size={14} className="text-gray-400" /> {cls.time}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-muted text-center py-6 text-gray-500">Bugun rejalashtirilgan darslar mavjud emas</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
