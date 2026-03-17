import { Bell, Search, User, Menu, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './Header.css';

const Header = () => {
    const navigate = useNavigate();

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : { name: 'Mehmon', role: 'Noma\'lum' };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <header className="header">
            <div className="header-left">
                <button className="mobile-menu-btn">
                    <Menu size={24} />
                </button>
                {(user.role === 'ADMIN' || user.role === 'TEACHER') && (
                    <div className="search-bar">
                        <Search size={18} className="search-icon" />
                        <input type="text" placeholder="O'quvchi, guruh yoki filial izlash..." />
                    </div>
                )}
            </div>

            <div className="header-right">
                <button className="icon-btn notification-btn" onClick={() => toast('Hozircha yangi xabarlaringiz yo\'q', { icon: '🔔' })}>
                    <Bell size={20} />
                    <span className="notification-badge">0</span>
                </button>

                <div
                    className="user-profile"
                    onClick={() => navigate('/settings')}
                    style={{ cursor: 'pointer' }}
                    title="Sozlamalarga o'tish"
                >
                    <div className="user-info">
                        <span className="user-name">{user.name}</span>
                        <span className="user-role">{user.role}</span>
                    </div>
                    <div className="user-avatar">
                        <User size={20} />
                    </div>
                </div>

                <div className="logout-divider"></div>

                <button className="icon-btn text-danger ml-2" onClick={handleLogout} title="Tizimdan chiqish">
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
};

export default Header;
