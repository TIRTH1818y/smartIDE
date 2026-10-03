const mongoose = require('mongoose');

/**
 * Validates whether a string is a valid MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validates email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return typeof email === 'string' && emailRegex.test(email.trim());
};

/**
 * Validates password strength (min 6 characters)
 */
const isValidPassword = (password) => {
  return typeof password === 'string' && password.length >= 6;
};

/**
 * Sanitizes input string
 */
const sanitizeString = (str) => {
  return typeof str === 'string' ? str.trim() : '';
};

module.exports = {
  isValidObjectId,
  isValidEmail,
  isValidPassword,
  sanitizeString,
};
