import React, { useEffect, useState } from 'react';
import { activitiesAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import { FaPlus, FaEdit, FaTrash, FaComment, FaFile, FaCheck, FaArrowRight } from 'react-icons/fa';

const ActivityFeed = ({ projectId, userId, limit = 10 }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();

    const fetchActivities = async () => {
        try {
            setLoading(true);
            let response;
            const params = { limit };

            if (projectId) {
                response = await activitiesAPI.getProjectActivities(projectId, params);
            } else if (userId) {
                response = await activitiesAPI.getUserActivities(userId, params);
            } else {
                response = await activitiesAPI.getAll(params);
            }

            setActivities(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching activities:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
        // eslint-disable-next-line
    }, [projectId, userId, limit]);

    useEffect(() => {
        if (!socket) return;

        // Listen for new activities via socket
        // Note: The backend doesn't explicitly emit 'activity:new' yet, 
        // but it emits task/file/comment events which we can listen to
        // OR we can update the backend to emit a generic activity event. 
        // For now, let's refresh on relevant events if we are in a project scope.

        const handleRefresh = (data) => {
            if (projectId && data.project === projectId) {
                fetchActivities();
            } else if (!projectId) {
                // If global feed, maybe refresh? Might be too frequent.
                // Let's stick to project scope refresh for now.
            }
        };

        socket.on('task:created', handleRefresh);
        socket.on('task:updated', handleRefresh);
        socket.on('task:deleted', handleRefresh);
        socket.on('task:moved', handleRefresh);
        socket.on('comment:added', handleRefresh);
        socket.on('file:uploaded', handleRefresh);
        socket.on('file:deleted', handleRefresh);

        return () => {
            socket.off('task:created', handleRefresh);
            socket.off('task:updated', handleRefresh);
            socket.off('task:deleted', handleRefresh);
            socket.off('task:moved', handleRefresh);
            socket.off('comment:added', handleRefresh);
            socket.off('file:uploaded', handleRefresh);
            socket.off('file:deleted', handleRefresh);
        };
        // eslint-disable-next-line
    }, [socket, projectId]);

    const getActivityIcon = (action) => {
        switch (action) {
            case 'created': return <FaPlus className="text-green-500" />;
            case 'updated': return <FaEdit className="text-blue-500" />;
            case 'deleted': return <FaTrash className="text-red-500" />;
            case 'commented': return <FaComment className="text-gray-500" />;
            case 'uploaded': return <FaFile className="text-purple-500" />;
            case 'completed': return <FaCheck className="text-green-600" />;
            case 'moved': return <FaArrowRight className="text-orange-500" />;
            default: return <FaEdit className="text-gray-400" />;
        }
    };

    const renderActivityMessage = (activity) => {
        const { user, action, entity, entityName, changes } = activity;
        const userName = user ? user.name : 'Unknown User';

        let actionText = '';
        switch (action) {
            case 'created': actionText = `created ${entity}`; break;
            case 'updated': actionText = `updated ${entity}`; break;
            case 'deleted': actionText = `deleted ${entity}`; break;
            case 'commented': actionText = `commented on ${entity}`; break;
            case 'uploaded': actionText = `uploaded file to ${entity}`; break;
            case 'completed': actionText = `marked ${entity} as completed`; break;
            case 'moved': actionText = `moved ${entity}`; break;
            case 'assigned': actionText = `assigned ${entity}`; break;
            default: actionText = `${action} ${entity}`;
        }

        return (
            <span>
                <span className="font-semibold">{userName}</span> {actionText} <span className="font-medium text-gray-800">{entityName}</span>
                {changes && changes.text && <p className="text-sm text-gray-500 mt-1 italic">"{changes.text}"</p>}
                {changes && changes.fromColumn && changes.toColumn && (
                    <span className="text-sm text-gray-500"> from {changes.fromColumn} to {changes.toColumn}</span>
                )}
            </span>
        );
    };

    if (loading && activities.length === 0) {
        return <div className="p-4 text-center text-gray-500">Loading activity...</div>;
    }

    if (activities.length === 0) {
        return <div className="p-4 text-center text-gray-400">No recent activity</div>;
    }

    return (
        <div className="activity-feed space-y-4">
            {activities.map((activity) => (
                <div key={activity._id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="mt-1 flex-shrink-0">
                        {getActivityIcon(activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                            {renderActivityMessage(activity)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ActivityFeed;
