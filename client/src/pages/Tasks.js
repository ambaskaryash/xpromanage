import React, { useState, useEffect } from 'react';
import { tasksAPI } from '../services/api';
import { FiPlus, FiCheckSquare } from 'react-icons/fi';
import './Dashboard.css';

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await tasksAPI.getAll();
            setTasks(response.data.data);
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            todo: 'badge-info',
            'in-progress': 'badge-warning',
            review: 'badge-primary',
            completed: 'badge-success',
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
                        <h1 className="dashboard-title">Tasks</h1>
                        <p className="dashboard-subtitle">Manage all your tasks efficiently</p>
                    </div>
                    <button className="btn btn-primary">
                        <FiPlus />
                        <span>Create Task</span>
                    </button>
                </div>

                <div className="dashboard-section fade-in">
                    <div className="tasks-list">
                        {tasks.length > 0 ? (
                            tasks.map((task) => (
                                <div key={task._id} className="task-item">
                                    <div className="task-content">
                                        <h4 className="task-title">{task.title}</h4>
                                        <p className="task-project">
                                            {task.project?.name} • {task.description}
                                        </p>
                                    </div>
                                    <div className="task-badges">
                                        <span className={getStatusBadge(task.status)}>{task.status}</span>
                                        <span className={getPriorityBadge(task.priority)}>{task.priority}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <FiCheckSquare size={48} />
                                <p>No tasks yet. Create your first task!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tasks;
