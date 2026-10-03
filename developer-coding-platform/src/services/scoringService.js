/**
 * Scoring Service
 * Handles automatic score calculation based on passed test cases.
 */

/**
 * Calculates automatic marks based on passed test cases ratio.
 * 
 * @param {number} passedTests - Number of passed test cases
 * @param {number} totalTests - Total number of test cases
 * @param {number} maxMarks - Maximum marks allocated for the problem
 * @returns {number} Calculated automatic marks rounded to 2 decimal places
 */
const calculateAutomaticMarks = (passedTests, totalTests, maxMarks = 100) => {
  if (!totalTests || totalTests <= 0) {
    return 0;
  }

  if (passedTests <= 0) {
    return 0;
  }

  const score = (passedTests / totalTests) * maxMarks;
  return Math.round(score * 100) / 100;
};

module.exports = {
  calculateAutomaticMarks,
};
