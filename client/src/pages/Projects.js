import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import { FiPlus, FiFolder, FiUsers, FiClock } from 'react-icons/fi';
import './Dashboard.css';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await projectsAPI.getAll();
            setProjects(response.data.data);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
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

    return (
        <div className="dashboard">
            <div className="container">
                <div className="dashboard-header fade-in">
                    <div>
                        <h1 className="dashboard-title">Projects</h1>
                        <p className="dashboard-subtitle">Manage all your projects in one place</p>
                    </div>
                    <button className="btn btn-primary">
                        <FiPlus />
                        <span>Create Project</span>
                    </button>
                </div>

                <div className="projects-grid fade-in">
                    {projects.length > 0 ? (
                        projects.map((project) => (
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
                        <div className="empty-state">
                            <FiFolder size={48} />
                            <p>No projects yet. Create your first project!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Projects;
