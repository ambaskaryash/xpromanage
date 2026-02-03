const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const colors = require('colors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const http = require('http');
const https = require('https');
const fs = require('fs');
const { initializeSocket } = require('./config/socket');

// Initialize express app
const app = express();

// Create server (HTTPS in production if certificates are available, HTTP otherwise)
let server;
if (process.env.NODE_ENV === 'production' && process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH) {
    // Production: Use HTTPS if SSL certificates are configured
    const httpsOptions = {
        key: fs.readFileSync(process.env.SSL_KEY_PATH),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH)
    };
    server = https.createServer(httpsOptions, app);
    console.log('Server configured with HTTPS'.green.bold);
} else {
    // Development: Use HTTP (acceptable for local development)
    server = http.createServer(app);
    if (process.env.NODE_ENV === 'production') {
        console.warn('WARNING: Running in production mode without HTTPS. Set SSL_KEY_PATH and SSL_CERT_PATH environment variables.'.yellow.bold);
    }
}

// Initialize Socket.IO
const io = initializeSocket(server);

// Middleware
app.use(helmet()); // Security headers

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
console.log(`CORS Origin configured as: ${corsOrigin}`.cyan.bold);

app.use(cors({
    origin: corsOrigin,
    credentials: true
}));
app.use(express.json()); // Body parser
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Make io accessible in request
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/users', require('./routes/users'));
app.use('/api/activities', require('./routes/activities'));

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'XProManage API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            projects: '/api/projects',
            tasks: '/api/tasks',
            users: '/api/users'
        }
    });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
    );
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`.red);
    server.close(() => process.exit(1));
});

module.exports = { app, server };
