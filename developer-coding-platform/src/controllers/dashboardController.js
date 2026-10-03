const Problem = require('../models/Problem');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { successResponse } = require('../utils/response');

/**
 * @desc    Get Host Dashboard Statistics
 * @route   GET /api/dashboard/host
 * @access  Private (Host only)
 */
const getHostDashboard = async (req, res, next) => {
  try {
    const hostId = req.user.userId;
    const User = require('../models/User');

    // 1. Total Problems created by host
    const totalProblems = await Problem.countDocuments({ createdBy: hostId });
    const recentProblems = await Problem.find({ createdBy: hostId })
      .sort({ createdAt: -1 })
      .limit(5);

    // 2. All assignments created by host
    const hostAssignments = await Assignment.find({ hostId })
      .populate('developerId', 'name email')
      .populate('problemId', 'title difficulty maxMarks')
      .sort({ createdAt: -1 });

    const totalAssignments = hostAssignments.length;
    const assignmentIds = hostAssignments.map((a) => a._id);

    // 3. Unique developers assigned
    const uniqueDeveloperIds = [...new Set(hostAssignments.map((a) => a.developerId ? a.developerId._id.toString() : null).filter(Boolean))];
    const totalDevelopersAssigned = uniqueDeveloperIds.length;

    // Fetch recent developer details
    const recentDevelopersRaw = await User.find({ _id: { $in: uniqueDeveloperIds.slice(0, 5) } }).select('name email createdAt');
    const recentDevelopers = recentDevelopersRaw.map((d) => {
      const devAssigns = hostAssignments.filter((a) => a.developerId && a.developerId._id.toString() === d._id.toString());
      return {
        _id: d._id,
        name: d.name,
        email: d.email,
        assignmentsCount: devAssigns.length,
        status: 'Active',
        createdAt: d.createdAt
      };
    });

    // 4. Assignments breakdown by status
    const assignedCount = hostAssignments.filter((a) => a.status === 'assigned').length;
    const openedCount = hostAssignments.filter((a) => a.status === 'opened').length;
    const submittedAssignments = hostAssignments.filter((a) => ['submitted', 'evaluated'].includes(a.status)).length;
    const evaluatedAssignments = hostAssignments.filter((a) => a.status === 'evaluated').length;
    const pendingEvaluations = hostAssignments.filter((a) => a.status === 'submitted').length;
    
    const now = new Date();
    const expiredCount = hostAssignments.filter((a) => a.status === 'expired' || (a.expiresAt && new Date(a.expiresAt) < now && a.status !== 'evaluated')).length;

    const challengeStatusBreakdown = {
      assigned: assignedCount,
      opened: openedCount,
      submitted: pendingEvaluations,
      evaluated: evaluatedAssignments,
      expired: expiredCount
    };

    // 5. Recent Submissions for host's assignments
    const recentSubmissions = await Submission.find({ assignmentId: { $in: assignmentIds } })
      .populate('developerId', 'name email')
      .populate('problemId', 'title maxMarks difficulty')
      .sort({ createdAt: -1 })
      .limit(10);

    // 6. Calculate Average Score across evaluated submissions
    const allSubmissions = await Submission.find({ assignmentId: { $in: assignmentIds } });
    let totalScoreSum = 0;
    let scoredSubmissionsCount = 0;

    allSubmissions.forEach((sub) => {
      const score = sub.finalMarks !== null && sub.finalMarks !== undefined ? sub.finalMarks : sub.automaticMarks;
      if (score !== null && score !== undefined) {
        totalScoreSum += score;
        scoredSubmissionsCount++;
      }
    });

    const avgScore = scoredSubmissionsCount > 0 ? Math.round((totalScoreSum / scoredSubmissionsCount)) : 0;

    // 7. Recent Activity Stream (combined events)
    const recentActivity = [];

    // Add recent submissions
    recentSubmissions.forEach((sub) => {
      const devName = sub.developerId ? sub.developerId.name : 'Candidate';
      const probTitle = sub.problemId ? sub.problemId.title : 'Problem';
      const isEval = sub.finalMarks !== null && sub.finalMarks !== undefined;
      
      recentActivity.push({
        type: isEval ? 'evaluation' : 'submission',
        title: isEval ? `Evaluation completed for ${devName}` : `${devName} submitted ${probTitle}`,
        detail: isEval ? `Final Score: ${sub.finalMarks} marks` : `Auto Score: ${sub.automaticMarks} marks`,
        timestamp: sub.createdAt || sub.updatedAt
      });
    });

    // Add recent assignments
    hostAssignments.slice(0, 5).forEach((asgn) => {
      const devName = asgn.developerId ? asgn.developerId.name : 'Candidate';
      const probTitle = asgn.problemId ? asgn.problemId.title : 'Problem';
      recentActivity.push({
        type: 'assignment',
        title: `Challenge assigned to ${devName}`,
        detail: `Problem: ${probTitle}`,
        timestamp: asgn.createdAt
      });
    });

    // Sort combined activity descending
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const formattedActivity = recentActivity.slice(0, 7);

    return successResponse(res, 200, 'Host dashboard statistics retrieved', {
      totalProblems,
      totalDevelopersAssigned,
      totalAssignments,
      submittedAssignments,
      evaluatedAssignments,
      pendingEvaluations,
      avgScore,
      challengeStatusBreakdown,
      recentSubmissions,
      recentProblems,
      recentDevelopers,
      recentActivity: formattedActivity,
      totalSubmissionsCount: allSubmissions.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Developer Dashboard Statistics
 * @route   GET /api/dashboard/developer
 * @access  Private (Developer only)
 */
const getDeveloperDashboard = async (req, res, next) => {
  try {
    const developerId = req.user.userId;

    // 1. All assignments assigned to developer
    const assignments = await Assignment.find({ developerId })
      .populate('problemId', 'title difficulty maxMarks')
      .sort({ createdAt: -1 });

    const totalAssignments = assignments.length;
    const pendingAssignments = assignments.filter((a) =>
      ['assigned', 'opened'].includes(a.status)
    ).length;
    const submittedAssignments = assignments.filter((a) =>
      ['submitted', 'evaluated'].includes(a.status)
    ).length;
    const evaluatedAssignments = assignments.filter((a) => a.status === 'evaluated').length;

    // 2. Calculated total & average marks for evaluated submissions
    const submissions = await Submission.find({ developerId });
    const evaluatedSubmissions = submissions.filter((s) => s.status === 'evaluated');

    let totalMarks = 0;
    evaluatedSubmissions.forEach((sub) => {
      totalMarks += sub.finalMarks !== null ? sub.finalMarks : sub.automaticMarks;
    });

    const averageMarks =
      evaluatedAssignments > 0
        ? Math.round((totalMarks / evaluatedAssignments) * 100) / 100
        : 0;

    // 3. Recent 5 assignments
    const recentAssignments = assignments.slice(0, 5);

    return successResponse(res, 200, 'Developer dashboard statistics retrieved', {
      totalAssignments,
      pendingAssignments,
      submittedAssignments,
      evaluatedAssignments,
      totalMarks,
      averageMarks,
      recentAssignments,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHostDashboard,
  getDeveloperDashboard,
};
