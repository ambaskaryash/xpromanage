import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiAlertCircle, FiBriefcase, FiUsers } from 'react-icons/fi';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        department: '',
        position: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const { confirmPassword, ...registerData } = formData;
            await register(registerData);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-background">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
                <div className="gradient-orb orb-3"></div>
            </div>

            <div className="auth-card auth-card-large fade-in">
                <div className="auth-header">
                    <div className="auth-logo">
                        <span className="logo-icon">✦</span>
                        <span className="logo-text">XProManage</span>
                    </div>
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Join us to start managing projects</p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <FiAlertCircle />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-row">
                        <div className="input-group">
                            <label htmlFor="name" className="input-label">
                                <FiUser /> Full Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                className="input"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="email" className="input-label">
                                <FiMail /> Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="input"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label htmlFor="password" className="input-label">
                                <FiLock /> Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                className="input"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength="6"
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="confirmPassword" className="input-label">
                                <FiLock /> Confirm Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                className="input"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label htmlFor="department" className="input-label">
                                <FiUsers /> Department
                            </label>
                            <input
                                type="text"
                                id="department"
                                name="department"
                                className="input"
                                placeholder="Engineering"
                                value={formData.department}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="position" className="input-label">
                                <FiBriefcase /> Position
                            </label>
                            <input
                                type="text"
                                id="position"
                                name="position"
                                className="input"
                                placeholder="Software Developer"
                                value={formData.position}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? (
                            <>
                                <div className="spinner-small"></div>
                                <span>Creating account...</span>
                            </>
                        ) : (
                            <span>Create Account</span>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to="/login" className="auth-link">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
