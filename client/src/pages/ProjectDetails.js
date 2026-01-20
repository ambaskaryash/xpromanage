import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { projectsAPI, tasksAPI } from '../services/api';
import { FiUsers, FiCalendar, FiDollarSign, FiCheckSquare } from 'react-icons/fi';
import './Dashboard.css';

const ProjectDetails = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjectDetails();
    }, [id]);

    const fetchProjectDetails = async () => {
        try {
            const [projectRes, tasksRes] = await Promise.all([
                projectsAPI.getOne(id),
                tasksAPI.getAll(id),
            ]);
            setProject(projectRes.data.data);
            setTasks(tasksRes.data.data);
        } catch (error) {
            console.error('Failed to fetch project details:', error);
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

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!project) {
        return <div className="container">Project not found</div>;
    }

    return (
        <div className="dashboard">
            <div className="container">
                <div className="dashboard-header fade-in">
                    <div>
                        <h1 className="dashboard-title">{project.name}</h1>
                        <p className="dashboard-subtitle">{project.description}</p>
                    </div>
                    <span className={getStatusBadge(project.status)}>{project.status}</span>
                </div>

                <div className="stats-grid fade-in">
                    <div className="stat-card">
                        <div className="stat-icon stat-icon-primary">
                            <FiUsers />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">Team Members</p>
                            <h3 className="stat-value">{project.teamMembers?.length || 0}</h3>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon stat-icon-success">
                            <FiCheckSquare />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">Tasks</p>
                            <h3 className="stat-value">{tasks.length}</h3>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon stat-icon-warning">
                            <FiCalendar />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">Start Date</p>
                            <h3 className="stat-value" style={{ fontSize: '1.25rem' }}>
                                {new Date(project.startDate).toLocaleDateString()}
                            </h3>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon stat-icon-info">
                            <FiDollarSign />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">Budget</p>
                            <h3 className="stat-value">${project.budget?.toLocaleString() || 0}</h3>
                        </div>
                    </div>
                </div>

                <div className="dashboard-section fade-in">
                    <div className="section-header">
                        <h2 className="section-title">Tasks</h2>
                        <button className="btn btn-primary btn-sm">Add Task</button>
                    </div>

                    <div className="tasks-list">
                        {tasks.length > 0 ? (
                            tasks.map((task) => (
                                <div key={task._id} className="task-item">
                                    <div className="task-content">
                                        <h4 className="task-title">{task.title}</h4>
                                        <p className="task-project">{task.description}</p>
                                    </div>
                                    <div className="task-badges">
                                        <span className={getStatusBadge(task.status)}>{task.status}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="empty-state">No tasks yet. Create your first task!</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;
