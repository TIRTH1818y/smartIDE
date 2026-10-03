const express = require('express');
const router = express.Router();
const {
  createProblem,
  getProblems,
  getProblemById,
  updateProblem,
  deleteProblem,
} = require('../controllers/problemController');
const protect = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { validateProblem } = require('../middleware/validationMiddleware');

router
  .route('/')
  .post(protect, requireRole('host'), validateProblem, createProblem)
  .get(protect, getProblems);

router
  .route('/:id')
  .get(protect, getProblemById)
  .put(protect, requireRole('host'), validateProblem, updateProblem)
  .delete(protect, requireRole('host'), deleteProblem);

module.exports = router;
