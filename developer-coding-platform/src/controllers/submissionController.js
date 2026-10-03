const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Problem = require('../models/Problem');
const codeExecutionService = require('../services/codeExecutionService');
const { calculateAutomaticMarks } = require('../services/scoringService');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * @desc    Submit code solution for an assignment
 * @route   POST /api/submissions
 * @access  Private (Developer only)
 */
const submitCode = async (req, res, next) => {
  try {
    const { assignmentId, code, language } = req.body;
    const developerId = req.user.userId; // MUST strictly come from authenticated session

    // 1. Validate Assignment existence
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return errorResponse(res, 404, 'Assignment not found');
    }

    // 2. Validate Ownership: Developer can only submit to their assigned challenge
    if (assignment.developerId.toString() !== developerId) {
      return errorResponse(
        res,
        403,
        'Forbidden: You do not have permission to submit code for this assignment'
      );
    }

    // 3. Validate Expiration
    if (new Date() > new Date(assignment.expiresAt)) {
      assignment.status = 'expired';
      await assignment.save();
      return errorResponse(res, 400, 'This challenge has expired. Submissions are no longer accepted.');
    }

    // 4. Validate Problem existence
    const problem = await Problem.findById(assignment.problemId);
    if (!problem || !problem.isActive) {
      return errorResponse(res, 404, 'Associated problem is inactive or not found');
    }

    // 5. Validate Language permission
    if (!problem.allowedLanguages.includes(language)) {
      return errorResponse(
        res,
        400,
        `Language '${language}' is not allowed for this problem. Allowed: ${problem.allowedLanguages.join(', ')}`
      );
    }

    // 6. Execute Code through isolated service
    const executionResult = await codeExecutionService.executeCode({
      language,
      code,
      testCases: problem.testCases,
      timeLimit: problem.timeLimit,
    });

    // 7. Calculate Automatic Marks
    const automaticMarks = calculateAutomaticMarks(
      executionResult.passedTests,
      executionResult.totalTests,
      problem.maxMarks
    );

    const submissionStatus = executionResult.passed ? 'passed' : 'failed';

    // 8. Store Submission
    const submission = await Submission.create({
      assignmentId: assignment._id,
      problemId: problem._id,
      developerId,
      code,
      language,
      status: submissionStatus,
      testResults: executionResult.results,
      automaticMarks,
      submittedAt: new Date(),
    });

    // 9. Update Assignment state
    assignment.status = 'submitted';
    assignment.submittedAt = new Date();
    await assignment.save();

    return successResponse(res, 201, 'Code submitted successfully', {
      submission: {
        _id: submission._id,
        assignmentId: submission.assignmentId,
        problemId: submission.problemId,
        developerId: submission.developerId,
        language: submission.language,
        status: submission.status,
        automaticMarks: submission.automaticMarks,
        testResultsCount: submission.testResults.length,
        submittedAt: submission.submittedAt,
        // Host can view full test results, public ones return execution status
        summary: {
          totalTests: executionResult.totalTests,
          passedTests: executionResult.passedTests,
          failedTests: executionResult.failedTests,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged-in developer's submissions
 * @route   GET /api/submissions/my
 * @access  Private (Developer only)
 */
const getMySubmissions = async (req, res, next) => {
  try {
    const submissions = await Submission.find({ developerId: req.user.userId })
      .populate('problemId', 'title difficulty maxMarks')
      .populate('assignmentId', 'status expiresAt')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Submissions retrieved successfully', {
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single submission by ID
 * @route   GET /api/submissions/:id
 * @access  Private
 */
const getSubmissionById = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('problemId', 'title maxMarks difficulty')
      .populate('developerId', 'name email')
      .populate('evaluatedBy', 'name email')
      .populate({
        path: 'assignmentId',
        select: 'hostId developerId status uniqueToken',
      });

    if (!submission) {
      return errorResponse(res, 404, 'Submission not found');
    }

    const assignment = submission.assignmentId;
    const isDevOwner = submission.developerId._id.toString() === req.user.userId;
    const isHostOwner = assignment && assignment.hostId.toString() === req.user.userId;

    if (!isDevOwner && !isHostOwner) {
      return errorResponse(res, 403, 'Forbidden: You do not have permission to view this submission');
    }

    return successResponse(res, 200, 'Submission retrieved successfully', { submission });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all submissions for a specific assignment
 * @route   GET /api/assignments/:id/submissions
 * @access  Private
 */
const getAssignmentSubmissions = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return errorResponse(res, 404, 'Assignment not found');
    }

    const isHostOwner = assignment.hostId.toString() === req.user.userId;
    const isAssignedDev = assignment.developerId.toString() === req.user.userId;

    if (!isHostOwner && !isAssignedDev) {
      return errorResponse(res, 403, 'Forbidden: You do not have permission to view these submissions');
    }

    const submissions = await Submission.find({ assignmentId: assignment._id })
      .populate('developerId', 'name email')
      .populate('evaluatedBy', 'name email')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Assignment submission history retrieved', {
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Evaluate submission (Host manual marks & feedback)
 * @route   POST /api/submissions/:id/evaluate
 * @access  Private (Host only)
 */
const evaluateSubmission = async (req, res, next) => {
  try {
    const { finalMarks, feedback } = req.body;

    const submission = await Submission.findById(req.params.id).populate('assignmentId');

    if (!submission) {
      return errorResponse(res, 404, 'Submission not found');
    }

    const assignment = await Assignment.findById(submission.assignmentId);
    if (!assignment) {
      return errorResponse(res, 404, 'Associated assignment not found');
    }

    // Verify host ownership of the assignment
    if (assignment.hostId.toString() !== req.user.userId) {
      return errorResponse(
        res,
        403,
        'Forbidden: You can only evaluate submissions belonging to assignments you created'
      );
    }

    // Retrieve problem to validate maxMarks bound
    const problem = await Problem.findById(submission.problemId);
    const maxMarks = problem ? problem.maxMarks : 100;

    if (finalMarks > maxMarks) {
      return errorResponse(
        res,
        400,
        `finalMarks (${finalMarks}) cannot exceed maximum problem marks (${maxMarks})`
      );
    }

    // Save evaluation
    submission.finalMarks = finalMarks;
    submission.feedback = feedback || '';
    submission.evaluatedBy = req.user.userId;
    submission.evaluatedAt = new Date();
    submission.status = 'evaluated';
    await submission.save();

    // Update assignment status to evaluated
    assignment.status = 'evaluated';
    await assignment.save();

    return successResponse(res, 200, 'Submission evaluated successfully', { submission });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitCode,
  getMySubmissions,
  getSubmissionById,
  getAssignmentSubmissions,
  evaluateSubmission,
};
