import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiFolder, FiCheckSquare, FiLogOut, FiUser } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="container">
                <div className="navbar-content">
                    <Link to="/dashboard" className="navbar-brand">
                        <span className="brand-icon">✦</span>
                        <span className="brand-text">XProManage</span>
                    </Link>

                    <div className="navbar-links">
                        <Link to="/dashboard" className="nav-link">
                            <FiHome />
                            <span>Dashboard</span>
                        </Link>
                        <Link to="/projects" className="nav-link">
                            <FiFolder />
                            <span>Projects</span>
                        </Link>
                        <Link to="/tasks" className="nav-link">
                            <FiCheckSquare />
                            <span>Tasks</span>
                        </Link>
                    </div>

                    <div className="navbar-user">
                        <div className="user-info">
                            <FiUser className="user-icon" />
                            <div className="user-details">
                                <span className="user-name">{user?.name}</span>
                                <span className="user-role">{user?.role}</span>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="btn-logout">
                            <FiLogOut />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
