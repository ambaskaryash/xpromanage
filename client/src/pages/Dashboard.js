import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI, tasksAPI } from '../services/api';
import { FiFolder, FiCheckSquare, FiClock, FiTrendingUp, FiUsers, FiActivity } from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalProjects: 0,
        activeProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
    });
    const [recentProjects, setRecentProjects] = useState([]);
    const [recentTasks, setRecentTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [projectsRes, tasksRes] = await Promise.all([
                projectsAPI.getAll(),
                tasksAPI.getAll(),
            ]);

            const projects = projectsRes.data.data;
            const tasks = tasksRes.data.data;

            setStats({
                totalProjects: projects.length,
                activeProjects: projects.filter((p) => p.status === 'active').length,
                totalTasks: tasks.length,
                completedTasks: tasks.filter((t) => t.status === 'completed').length,
            });

            setRecentProjects(projects.slice(0, 4));
            setRecentTasks(tasks.slice(0, 5));
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            active: 'badge-success',
            planning: 'badge-info',
            'on-hold': 'badge-warning',
            completed: 'badge-primary',
            cancelled: 'badge-danger',
            todo: 'badge-info',
            'in-progress': 'badge-warning',
            review: 'badge-primary',
            blocked: 'badge-danger',
        };

        return `badge ${statusClasses[status] || 'badge-primary'}`;
    };

    const getPriorityBadge = (priority) => {
        const priorityClasses = {
            low: 'badge-info',
            medium: 'badge-warning',
            high: 'badge-danger',
            critical: 'badge-danger',
        };

        return `badge ${priorityClasses[priority] || 'badge-primary'}`;
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="container">
                <div className="dashboard-header fade-in">
                    <div>
                        <h1 className="dashboard-title">Dashboard</h1>
                        <p className="dashboard-subtitle">Welcome back! Here's your project overview</p>
                    </div>
                    <Link to="/projects" className="btn btn-primary">
                        <FiFolder />
                        <span>New Project</span>
                    </Link>
                </div>

                <div className="stats-grid fade-in">
                    <div className="stat-card">
                        <div className="stat-icon stat-icon-primary">
                            <FiFolder />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">Total Projects</p>
                            <h3 className="stat-value">{stats.totalProjects}</h3>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon stat-icon-success">
                            <FiActivity />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">Active Projects</p>
                            <h3 className="stat-value">{stats.activeProjects}</h3>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon stat-icon-warning">
                            <FiCheckSquare />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">Total Tasks</p>
                            <h3 className="stat-value">{stats.totalTasks}</h3>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon stat-icon-info">
                            <FiTrendingUp />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">Completed Tasks</p>
                            <h3 className="stat-value">{stats.completedTasks}</h3>
                        </div>
                    </div>
                </div>

                <div className="dashboard-content">
                    <div className="dashboard-section fade-in">
                        <div className="section-header">
                            <h2 className="section-title">Recent Projects</h2>
                            <Link to="/projects" className="section-link">
                                View All
                            </Link>
                        </div>

                        <div className="projects-grid">
                            {recentProjects.length > 0 ? (
                                recentProjects.map((project) => (
                                    <Link to={`/projects/${project._id}`} key={project._id} className="project-card">
                                        <div className="project-header">
                                            <h3 className="project-name">{project.name}</h3>
                                            <span className={getStatusBadge(project.status)}>{project.status}</span>
                                        </div>
                                        <p className="project-description">{project.description}</p>
                                        <div className="project-footer">
                                            <div className="project-meta">
                                                <FiUsers />
                                                <span>{project.teamMembers?.length || 0} members</span>
                                            </div>
                                            <div className="project-meta">
                                                <FiClock />
                                                <span>{new Date(project.startDate).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${project.progress}%` }}></div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <p className="empty-state">No projects yet. Create your first project!</p>
                            )}
                        </div>
                    </div>

                    <div className="dashboard-section fade-in">
                        <div className="section-header">
                            <h2 className="section-title">Recent Tasks</h2>
                            <Link to="/tasks" className="section-link">
                                View All
                            </Link>
                        </div>

                        <div className="tasks-list">
                            {recentTasks.length > 0 ? (
                                recentTasks.map((task) => (
                                    <div key={task._id} className="task-item">
                                        <div className="task-content">
                                            <h4 className="task-title">{task.title}</h4>
                                            <p className="task-project">{task.project?.name}</p>
                                        </div>
                                        <div className="task-badges">
                                            <span className={getStatusBadge(task.status)}>{task.status}</span>
                                            <span className={getPriorityBadge(task.priority)}>{task.priority}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-state">No tasks yet. Start creating tasks!</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
