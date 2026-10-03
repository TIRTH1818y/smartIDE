const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getAssignments,
  getAssignmentById,
  openAssignment,
  getChallengeByToken,
} = require('../controllers/assignmentController');
const protect = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { validateAssignment } = require('../middleware/validationMiddleware');

router
  .route('/')
  .post(protect, requireRole('host'), validateAssignment, createAssignment)
  .get(protect, getAssignments);

router.route('/:id').get(protect, getAssignmentById);

router
  .route('/:id/open')
  .post(protect, requireRole('developer'), openAssignment);

// Note: GET /api/challenges/:token is also mounted in app.js using getChallengeByToken

module.exports = {
  assignmentRouter: router,
  getChallengeByToken,
};
