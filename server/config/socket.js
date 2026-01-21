const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

// Initialize Socket.IO
const initializeSocket = (server) => {
    io = socketIO(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    // Connection handler
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.name} (${socket.id})`.cyan);

        // Join user's personal room
        socket.join(`user:${socket.user._id}`);

        // Send welcome message
        socket.emit('connected', {
            message: 'Connected to XProManage',
            user: {
                id: socket.user._id,
                name: socket.user.name,
                email: socket.user.email
            }
        });

        // Join project room
        socket.on('join:project', (projectId) => {
            socket.join(`project:${projectId}`);
            console.log(`User ${socket.user.name} joined project ${projectId}`.green);

            // Notify others in the project
            socket.to(`project:${projectId}`).emit('user:joined', {
                user: {
                    id: socket.user._id,
                    name: socket.user.name
                },
                projectId
            });
        });

        // Leave project room
        socket.on('leave:project', (projectId) => {
            socket.leave(`project:${projectId}`);
            console.log(`User ${socket.user.name} left project ${projectId}`.yellow);

            // Notify others in the project
            socket.to(`project:${projectId}`).emit('user:left', {
                user: {
                    id: socket.user._id,
                    name: socket.user.name
                },
                projectId
            });
        });

        // Task events
        socket.on('task:update', (data) => {
            socket.to(`project:${data.projectId}`).emit('task:updated', data);
        });

        socket.on('task:create', (data) => {
            socket.to(`project:${data.projectId}`).emit('task:created', data);
        });

        socket.on('task:delete', (data) => {
            socket.to(`project:${data.projectId}`).emit('task:deleted', data);
        });

        socket.on('task:move', (data) => {
            socket.to(`project:${data.projectId}`).emit('task:moved', data);
        });

        // Comment events
        socket.on('comment:add', (data) => {
            socket.to(`project:${data.projectId}`).emit('comment:added', data);
        });

        // File upload events
        socket.on('file:upload', (data) => {
            socket.to(`project:${data.projectId}`).emit('file:uploaded', data);
        });

        socket.on('file:delete', (data) => {
            socket.to(`project:${data.projectId}`).emit('file:deleted', data);
        });

        // Typing indicators
        socket.on('typing:start', (data) => {
            socket.to(`project:${data.projectId}`).emit('user:typing', {
                user: {
                    id: socket.user._id,
                    name: socket.user.name
                },
                taskId: data.taskId
            });
        });

        socket.on('typing:stop', (data) => {
            socket.to(`project:${data.projectId}`).emit('user:stopped-typing', {
                user: {
                    id: socket.user._id,
                    name: socket.user.name
                },
                taskId: data.taskId
            });
        });

        // Disconnect handler
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.name} (${socket.id})`.red);
        });

        // Error handler
        socket.on('error', (error) => {
            console.error(`Socket error for user ${socket.user.name}:`, error);
        });
    });

    return io;
};

// Get Socket.IO instance
const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
};

// Emit event to specific room
const emitToRoom = (room, event, data) => {
    if (io) {
        io.to(room).emit(event, data);
    }
};

// Emit event to specific user
const emitToUser = (userId, event, data) => {
    if (io) {
        io.to(`user:${userId}`).emit(event, data);
    }
};

// Emit event to project
const emitToProject = (projectId, event, data) => {
    if (io) {
        io.to(`project:${projectId}`).emit(event, data);
    }
};

module.exports = {
    initializeSocket,
    getIO,
    emitToRoom,
    emitToUser,
    emitToProject
};
