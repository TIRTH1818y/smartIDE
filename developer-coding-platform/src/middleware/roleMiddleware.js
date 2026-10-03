const { errorResponse } = require('../utils/response');

/**
 * Role Authorization Middleware
 * Restricts access to specified user roles.
 * 
 * @param {...string} roles - Allowed roles (e.g., 'host', 'developer')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Authentication required before checking role');
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        403,
        `Access denied. Role '${req.user.role}' is not authorized to access this resource`
      );
    }

    next();
  };
};

module.exports = requireRole;
