import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './MainLayout.css';

const MainLayout = () => {
    return (
        <div className="layout-container">
            <Sidebar />
            <div className="main-content">
                <Header />
                <main className="page-content animate-fade-in">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
