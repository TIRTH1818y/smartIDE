const { errorResponse } = require('../utils/response');
const { isValidEmail, isValidPassword, isValidObjectId } = require('../utils/validation');

/**
 * Validates Registration Request
 */
const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return errorResponse(res, 400, 'Name is required');
  }

  if (!email || !isValidEmail(email)) {
    return errorResponse(res, 400, 'Valid email address is required');
  }

  if (!password || !isValidPassword(password)) {
    return errorResponse(res, 400, 'Password must be at least 6 characters long');
  }

  if (!role || !['host', 'developer'].includes(role)) {
    return errorResponse(res, 400, 'Role must be either host or developer');
  }

  next();
};

/**
 * Validates Login Request
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !isValidEmail(email)) {
    return errorResponse(res, 400, 'Valid email address is required');
  }

  if (!password) {
    return errorResponse(res, 400, 'Password is required');
  }

  next();
};

/**
 * Validates Problem Creation / Update Request
 */
const validateProblem = (req, res, next) => {
  const { title, description, difficulty, allowedLanguages, maxMarks, timeLimit } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return errorResponse(res, 400, 'Problem title is required');
  }

  if (!description || typeof description !== 'string' || description.trim() === '') {
    return errorResponse(res, 400, 'Problem description is required');
  }

  if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
    return errorResponse(res, 400, 'Difficulty must be easy, medium, or hard');
  }

  if (allowedLanguages && !Array.isArray(allowedLanguages)) {
    return errorResponse(res, 400, 'allowedLanguages must be an array');
  }

  if (maxMarks !== undefined && (typeof maxMarks !== 'number' || maxMarks <= 0)) {
    return errorResponse(res, 400, 'maxMarks must be a positive number');
  }

  if (timeLimit !== undefined && (typeof timeLimit !== 'number' || timeLimit <= 0)) {
    return errorResponse(res, 400, 'timeLimit must be a positive number of seconds');
  }

  next();
};

/**
 * Validates Assignment Request
 */
const validateAssignment = (req, res, next) => {
  const { problemId, developerId, expiresAt } = req.body;

  if (!problemId || !isValidObjectId(problemId)) {
    return errorResponse(res, 400, 'Valid problemId is required');
  }

  if (!developerId || !isValidObjectId(developerId)) {
    return errorResponse(res, 400, 'Valid developerId is required');
  }

  if (!expiresAt || isNaN(Date.parse(expiresAt))) {
    return errorResponse(res, 400, 'Valid expiration date (expiresAt) is required');
  }

  if (new Date(expiresAt) <= new Date()) {
    return errorResponse(res, 400, 'Expiration date must be in the future');
  }

  next();
};

/**
 * Validates Submission Request
 */
const validateSubmission = (req, res, next) => {
  const { assignmentId, code, language } = req.body;

  if (!assignmentId || !isValidObjectId(assignmentId)) {
    return errorResponse(res, 400, 'Valid assignmentId is required');
  }

  if (!code || typeof code !== 'string' || code.trim() === '') {
    return errorResponse(res, 400, 'Code submission cannot be empty');
  }

  // Maximum code size check (e.g. 500KB)
  if (code.length > 500000) {
    return errorResponse(res, 400, 'Code payload exceeds maximum allowed size of 500KB');
  }

  if (!language || !['javascript', 'python', 'java', 'cpp'].includes(language)) {
    return errorResponse(res, 400, 'Language must be one of: javascript, python, java, cpp');
  }

  next();
};

/**
 * Validates Evaluation Request
 */
const validateEvaluation = (req, res, next) => {
  const { finalMarks, feedback } = req.body;

  if (finalMarks === undefined || typeof finalMarks !== 'number' || finalMarks < 0) {
    return errorResponse(res, 400, 'finalMarks must be a non-negative number');
  }

  if (feedback !== undefined && typeof feedback !== 'string') {
    return errorResponse(res, 400, 'feedback must be a string');
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateProblem,
  validateAssignment,
  validateSubmission,
  validateEvaluation,
};
