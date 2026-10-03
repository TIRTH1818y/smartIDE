const Assignment = require('../models/Assignment');
const Problem = require('../models/Problem');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');
const {
  generateChallengeToken,
  buildChallengeUrl,
  sanitizeProblemForDeveloper,
} = require('../services/challengeService');

/**
 * @desc    Assign a problem to a developer and generate a challenge link
 * @route   POST /api/assignments
 * @access  Private (Host only)
 */
const createAssignment = async (req, res, next) => {
  try {
    const { problemId, developerId, expiresAt } = req.body;

    // 1. Verify problem exists and belongs to the authenticated host
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return errorResponse(res, 404, 'Problem not found');
    }

    if (problem.createdBy.toString() !== req.user.userId) {
      return errorResponse(res, 403, 'Forbidden: You can only assign problems that you created');
    }

    // 2. Verify target developer exists and has 'developer' role
    const developer = await User.findById(developerId);
    if (!developer) {
      return errorResponse(res, 404, 'Developer user not found');
    }

    if (developer.role !== 'developer') {
      return errorResponse(res, 400, 'Assigned user must have the role of developer');
    }

    // 3. Prevent duplicate active assignment if identical active problem assignment exists
    const existingAssignment = await Assignment.findOne({
      problemId,
      developerId,
      hostId: req.user.userId,
      status: { $in: ['assigned', 'opened'] },
    });

    if (existingAssignment && new Date(existingAssignment.expiresAt) > new Date()) {
      return errorResponse(
        res,
        409,
        'An active assignment for this problem already exists for this developer',
        { assignmentId: existingAssignment._id }
      );
    }

    // 4. Generate unique cryptographically secure random token
    const uniqueToken = generateChallengeToken();

    // 5. Create assignment record
    const assignment = await Assignment.create({
      problemId,
      hostId: req.user.userId,
      developerId,
      uniqueToken,
      expiresAt: new Date(expiresAt),
      status: 'assigned',
      assignedAt: new Date(),
    });

    const challengeUrl = buildChallengeUrl(uniqueToken);

    return successResponse(res, 201, 'Problem assigned successfully', {
      assignment,
      challengeUrl,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get assignments list based on role (Host: created by host; Developer: assigned to developer)
 * @route   GET /api/assignments
 * @access  Private
 */
const getAssignments = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'host') {
      query.hostId = req.user.userId;
    } else if (req.user.role === 'developer') {
      query.developerId = req.user.userId;
    }

    const assignments = await Assignment.find(query)
      .populate('problemId', 'title difficulty maxMarks allowedLanguages')
      .populate('developerId', 'name email')
      .populate('hostId', 'name email')
      .sort({ createdAt: -1 });

    // Auto-update expired status on fetch
    const now = new Date();
    const updatedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        if (
          ['assigned', 'opened'].includes(assignment.status) &&
          now > new Date(assignment.expiresAt)
        ) {
          assignment.status = 'expired';
          await assignment.save();
        }
        return assignment;
      })
    );

    return successResponse(res, 200, 'Assignments retrieved successfully', {
      count: updatedAssignments.length,
      assignments: updatedAssignments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single assignment details by ID
 * @route   GET /api/assignments/:id
 * @access  Private
 */
const getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('problemId')
      .populate('developerId', 'name email')
      .populate('hostId', 'name email');

    if (!assignment) {
      return errorResponse(res, 404, 'Assignment not found');
    }

    // Access permissions
    const isHostOwner = assignment.hostId._id.toString() === req.user.userId;
    const isAssignedDev = assignment.developerId._id.toString() === req.user.userId;

    if (!isHostOwner && !isAssignedDev) {
      return errorResponse(res, 403, 'Forbidden: You do not have permission to view this assignment');
    }

    // Check expiration
    if (
      ['assigned', 'opened'].includes(assignment.status) &&
      new Date() > new Date(assignment.expiresAt)
    ) {
      assignment.status = 'expired';
      await assignment.save();
    }

    const assignmentObj = assignment.toObject();

    // Sanitize test cases if developer
    if (isAssignedDev && assignmentObj.problemId) {
      assignmentObj.problemId = sanitizeProblemForDeveloper(assignmentObj.problemId);
    }

    return successResponse(res, 200, 'Assignment details retrieved', {
      assignment: assignmentObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark assignment status as opened by developer
 * @route   POST /api/assignments/:id/open
 * @access  Private (Assigned Developer only)
 */
const openAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return errorResponse(res, 404, 'Assignment not found');
    }

    // Check if user is assigned developer
    if (assignment.developerId.toString() !== req.user.userId) {
      return errorResponse(res, 403, 'Forbidden: You are not the assigned developer for this challenge');
    }

    // Check expiration
    if (new Date() > new Date(assignment.expiresAt)) {
      assignment.status = 'expired';
      await assignment.save();
      return errorResponse(res, 400, 'This challenge has expired');
    }

    if (assignment.status === 'assigned') {
      assignment.status = 'opened';
      assignment.openedAt = new Date();
      await assignment.save();
    }

    return successResponse(res, 200, 'Assignment opened successfully', { assignment });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get challenge details by secure unique token
 * @route   GET /api/challenges/:token
 * @access  Private (Assigned Developer only)
 */
const getChallengeByToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const assignment = await Assignment.findOne({ uniqueToken: token })
      .populate('problemId')
      .populate('hostId', 'name email');

    if (!assignment) {
      return errorResponse(res, 404, 'Invalid or non-existent challenge link');
    }

    // Check if logged-in user is the assigned developer
    if (assignment.developerId.toString() !== req.user.userId) {
      return errorResponse(
        res,
        403,
        'Forbidden: This challenge link is assigned to a different developer account'
      );
    }

    // Check expiration
    if (new Date() > new Date(assignment.expiresAt)) {
      if (['assigned', 'opened'].includes(assignment.status)) {
        assignment.status = 'expired';
        await assignment.save();
      }
      return errorResponse(res, 400, 'This challenge has expired');
    }

    // Mark as opened if first access
    if (assignment.status === 'assigned') {
      assignment.status = 'opened';
      assignment.openedAt = new Date();
      await assignment.save();
    }

    // Exclude hidden test cases from response to developers
    const sanitizedProblem = sanitizeProblemForDeveloper(assignment.problemId);

    return successResponse(res, 200, 'Challenge details retrieved successfully', {
      assignment: {
        id: assignment._id,
        status: assignment.status,
        expiresAt: assignment.expiresAt,
        openedAt: assignment.openedAt,
        submittedAt: assignment.submittedAt,
        assignedAt: assignment.assignedAt,
        host: assignment.hostId,
      },
      problem: sanitizedProblem,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentById,
  openAssignment,
  getChallengeByToken,
};
