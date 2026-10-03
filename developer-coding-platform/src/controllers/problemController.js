const Problem = require('../models/Problem');
const { successResponse, errorResponse } = require('../utils/response');
const { sanitizeProblemForDeveloper } = require('../services/challengeService');

/**
 * @desc    Create a new problem
 * @route   POST /api/problems
 * @access  Private (Host only)
 */
const createProblem = async (req, res, next) => {
  try {
    const {
      title,
      description,
      difficulty,
      allowedLanguages,
      inputFormat,
      outputFormat,
      constraints,
      examples,
      testCases,
      maxMarks,
      timeLimit,
    } = req.body;

    // Verify test cases presence
    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      return errorResponse(res, 400, 'Problem must have at least one test case');
    }

    // Host ID MUST strictly come from req.user.userId
    const problem = await Problem.create({
      title: title.trim(),
      description,
      difficulty,
      allowedLanguages: allowedLanguages || ['javascript', 'python'],
      inputFormat: inputFormat || '',
      outputFormat: outputFormat || '',
      constraints: constraints || '',
      examples: examples || [],
      testCases,
      maxMarks: maxMarks !== undefined ? maxMarks : 100,
      timeLimit: timeLimit !== undefined ? timeLimit : 2,
      createdBy: req.user.userId,
    });

    return successResponse(res, 201, 'Problem created successfully', { problem });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all problems (filtered for host ownership or public active problems)
 * @route   GET /api/problems
 * @access  Private
 */
const getProblems = async (req, res, next) => {
  try {
    let query = { isActive: true };

    // If host, default to retrieving host's own problems or all host problems
    if (req.user.role === 'host') {
      const { all } = req.query;
      if (all !== 'true') {
        query.createdBy = req.user.userId;
      }
    }

    const problems = await Problem.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // If user is developer, sanitize test cases from problem list
    const sanitizedProblems = problems.map((problem) => {
      if (req.user.role === 'developer') {
        return sanitizeProblemForDeveloper(problem);
      }
      return problem;
    });

    return successResponse(res, 200, 'Problems retrieved successfully', {
      count: problems.length,
      problems: sanitizedProblems,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single problem by ID
 * @route   GET /api/problems/:id
 * @access  Private
 */
const getProblemById = async (req, res, next) => {
  try {
    const problem = await Problem.findById(req.params.id).populate('createdBy', 'name email');

    if (!problem) {
      return errorResponse(res, 404, 'Problem not found');
    }

    // Role ownership & sanitization rules
    if (req.user.role === 'developer') {
      const sanitized = sanitizeProblemForDeveloper(problem);
      return successResponse(res, 200, 'Problem details retrieved', { problem: sanitized });
    }

    // Host sees complete problem details including test cases
    return successResponse(res, 200, 'Problem details retrieved', { problem });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update problem by ID
 * @route   PUT /api/problems/:id
 * @access  Private (Host owner only)
 */
const updateProblem = async (req, res, next) => {
  try {
    let problem = await Problem.findById(req.params.id);

    if (!problem) {
      return errorResponse(res, 404, 'Problem not found');
    }

    // Strict ownership check: Only the host who created the problem can modify it
    if (problem.createdBy.toString() !== req.user.userId) {
      return errorResponse(res, 403, 'Forbidden: You can only modify problems you created');
    }

    // Ignore createdBy from body if present
    delete req.body.createdBy;

    problem = await Problem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    return successResponse(res, 200, 'Problem updated successfully', { problem });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete problem by ID
 * @route   DELETE /api/problems/:id
 * @access  Private (Host owner only)
 */
const deleteProblem = async (req, res, next) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return errorResponse(res, 404, 'Problem not found');
    }

    // Strict ownership check: Only the host who created the problem can delete it
    if (problem.createdBy.toString() !== req.user.userId) {
      return errorResponse(res, 403, 'Forbidden: You can only delete problems you created');
    }

    await Problem.findByIdAndDelete(req.params.id);

    return successResponse(res, 200, 'Problem deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProblem,
  getProblems,
  getProblemById,
  updateProblem,
  deleteProblem,
};
