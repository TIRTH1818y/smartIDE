const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const problemRoutes = require('./routes/problemRoutes');
const { assignmentRouter, getChallengeByToken } = require('./routes/assignmentRoutes');
const { submissionRouter, getAssignmentSubmissions } = require('./routes/submissionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Middleware
const protect = require('./middleware/authMiddleware');
const requireRole = require('./middleware/roleMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Body Parser & Security Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend UI assets
app.use(express.static(path.join(__dirname, '../public')));

// API Health Check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  return res.status(200).json({
    success: true,
    message: 'API is healthy',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/assignments', assignmentRouter);
app.get('/api/challenges/:token', protect, requireRole('developer'), getChallengeByToken);
app.get('/api/assignments/:id/submissions', protect, getAssignmentSubmissions);
app.use('/api/submissions', submissionRouter);
app.use('/api/dashboard', dashboardRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
