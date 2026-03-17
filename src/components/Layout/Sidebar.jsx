import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, UserCheck, DollarSign, Settings, GraduationCap } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
    // Get logged-in user details safely
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : { role: 'STUDENT' };

    const adminLinks = [
        { path: '/', name: 'Bosh Panel', icon: <LayoutDashboard size={20} /> },
        // { path: '/leads', name: 'Lidlar va Sotuv', icon: <Users size={20} /> },
        { path: '/students', name: 'O\'quvchilar Bazasi', icon: <GraduationCap size={20} /> },
        { path: '/finance', name: 'Moliya va To\'lovlar', icon: <DollarSign size={20} /> },
        { path: '/hr', name: 'HR va KPI', icon: <UserCheck size={20} /> },
    ];

    const academicLinks = [
        { path: '/courses', name: 'Kurslar va Guruhlar', icon: <BookOpen size={20} /> },
        { path: '/attendance', name: 'Davomat', icon: <UserCheck size={20} /> },
        { path: '/homework', name: 'Uy vazifasi va Testlar', icon: <BookOpen size={20} /> },
        { path: '/ai-analyst', name: 'AI Tahlilchi', icon: <GraduationCap size={20} /> },
    ];

    const studentLinks = [
        { path: '/student-app', name: 'Ota-ona (Mobil Ilova)', icon: <Users size={20} /> }
    ];

    const renderLinks = (links) => {
        return links.map((link) => (
            <li key={link.path}>
                <NavLink
                    to={link.path}
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                    {link.icon}
                    <span>{link.name}</span>
                </NavLink>
            </li>
        ));
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo-icon">SC</div>
                <div className="logo-text">
                    <span className="logo-title">SmartCenter</span>
                    <span className="logo-subtitle">CRM & LMS</span>
                </div>
            </div>

            <div className="sidebar-content">
                {/* Admin ko'ra oladigan qism */}
                {user.role === 'ADMIN' && (
                    <div className="nav-section">
                        <div className="nav-section-title">MA'MURIYAT</div>
                        <ul className="nav-list">
                            {renderLinks(adminLinks)}
                        </ul>
                    </div>
                )}

                {/* Ustozlar va Admin ko'ra oladigan qism */}
                {(user.role === 'ADMIN' || user.role === 'TEACHER') && (
                    <div className="nav-section">
                        <div className="nav-section-title">AKADEMIK MODUL</div>
                        <ul className="nav-list">
                            {renderLinks(academicLinks)}
                        </ul>
                    </div>
                )}

                {/* Hamma (yoki aniq Student/Parent) ko'ra oladigan qism */}
                <div className="nav-section">
                    <div className="nav-section-title">O'QUVCHILAR UCHUN</div>
                    <ul className="nav-list">
                        {renderLinks(studentLinks)}
                    </ul>
                </div>
            </div>

            <div className="sidebar-footer">
                <NavLink to="/settings" className="sidebar-link">
                    <Settings size={20} />
                    <span>Sozlamalar</span>
                </NavLink>
            </div>
        </aside>
    );
};

export default Sidebar;
