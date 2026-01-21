import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user, token } = useAuth();

    useEffect(() => {
        if (token && !socket) {
            const socketInstance = io(process.env.REACT_APP_API_URL.replace('/api', ''), {
                auth: { token },
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            socketInstance.on('connect', () => {
                console.log('Socket connected:', socketInstance.id);
                setIsConnected(true);
            });

            socketInstance.on('disconnect', () => {
                console.log('Socket disconnected');
                setIsConnected(false);
            });

            socketInstance.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
            });

            setSocket(socketInstance);

            return () => {
                socketInstance.disconnect();
            };
        } else if (!token && socket) {
            socket.disconnect();
            setSocket(null);
            setIsConnected(false);
        }
    }, [token, socket]);

    // Helper functions for common socket events
    const joinProject = (projectId) => {
        if (socket && isConnected) {
            socket.emit('join:project', projectId);
        }
    };

    const leaveProject = (projectId) => {
        if (socket && isConnected) {
            socket.emit('leave:project', projectId);
        }
    };

    return (
        <SocketContext.Provider value={{ socket, isConnected, joinProject, leaveProject }}>
            {children}
        </SocketContext.Provider>
    );
};
