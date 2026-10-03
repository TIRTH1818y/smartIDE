const express = require('express');
const router = express.Router();
const {
  submitCode,
  getMySubmissions,
  getSubmissionById,
  getAssignmentSubmissions,
  evaluateSubmission,
} = require('../controllers/submissionController');
const protect = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const {
  validateSubmission,
  validateEvaluation,
} = require('../middleware/validationMiddleware');

router
  .route('/')
  .post(protect, requireRole('developer'), validateSubmission, submitCode);

router
  .route('/my')
  .get(protect, requireRole('developer'), getMySubmissions);

router
  .route('/:id')
  .get(protect, getSubmissionById);

router
  .route('/:id/evaluate')
  .post(protect, requireRole('host'), validateEvaluation, evaluateSubmission);

module.exports = {
  submissionRouter: router,
  getAssignmentSubmissions,
};
