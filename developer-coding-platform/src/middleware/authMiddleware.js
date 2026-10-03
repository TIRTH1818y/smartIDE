const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/response');

/**
 * Authentication Middleware
 * Validates JWT token from Authorization header and attaches user to req.user
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return errorResponse(res, 401, 'Not authorized, no token provided');
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

      // Get user from token payload
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return errorResponse(res, 401, 'Not authorized, user no longer exists');
      }

      // Attach user to req.user with convenient fields
      req.user = {
        userId: user._id.toString(),
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      };

      return next();
    } catch (error) {
      console.error('Authentication Error:', error.message);
      return errorResponse(res, 401, 'Not authorized, token failed or expired');
    }
  }

  if (!token) {
    return errorResponse(res, 401, 'Not authorized, no token provided');
  }
};

module.exports = protect;
