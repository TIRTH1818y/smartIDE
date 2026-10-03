const generateChallengeToken = require('../utils/generateChallengeToken');

/**
 * Challenge Service helper functions
 */

/**
 * Build full public challenge URL using CLIENT_URL environment variable
 * @param {string} token 
 * @returns {string} Full challenge URL
 */
const buildChallengeUrl = (token) => {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const cleanBase = baseUrl.replace(/\/$/, '');
  return `${cleanBase}/challenge/${token}`;
};

/**
 * Filter problem document to exclude hidden/private test cases before sending to developer
 * @param {Object} problemDoc - Mongoose problem document or plain object
 * @returns {Object} Developer-safe problem payload
 */
const sanitizeProblemForDeveloper = (problemDoc) => {
  const problemObj = problemDoc.toObject ? problemDoc.toObject() : { ...problemDoc };
  
  // Remove full test cases array so hidden test cases are never exposed
  delete problemObj.testCases;
  delete problemObj.__v;

  return problemObj;
};

module.exports = {
  generateChallengeToken,
  buildChallengeUrl,
  sanitizeProblemForDeveloper,
};
