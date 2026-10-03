const crypto = require('crypto');

/**
 * Generates a cryptographically secure random token for unique challenge links.
 * @returns {string} Hex string token
 */
const generateChallengeToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = generateChallengeToken;
