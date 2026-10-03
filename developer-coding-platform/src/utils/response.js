/**
 * Standardized success response helper
 */
const successResponse = (res, statusCode = 200, message = 'Operation successful', data = null) => {
  const responseBody = {
    success: true,
    message,
  };
  if (data !== null && data !== undefined) {
    responseBody.data = data;
  }
  return res.status(statusCode).json(responseBody);
};

/**
 * Standardized error response helper
 */
const errorResponse = (res, statusCode = 500, message = 'Something went wrong', error = null) => {
  const responseBody = {
    success: false,
    message,
    error: error !== null ? error : null,
  };
  return res.status(statusCode).json(responseBody);
};

module.exports = {
  successResponse,
  errorResponse,
};
