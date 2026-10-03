const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema(
  {
    testCaseIndex: { type: Number },
    input: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    actualOutput: { type: String, default: '' },
    passed: { type: Boolean, required: true },
    executionTimeMs: { type: Number, default: 0 },
    error: { type: String, default: null },
    isHidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
      index: true,
    },
    developerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Code submission cannot be empty'],
    },
    language: {
      type: String,
      required: [true, 'Please specify programming language'],
      enum: ['javascript', 'python', 'java', 'cpp'],
    },
    status: {
      type: String,
      enum: ['submitted', 'running', 'passed', 'failed', 'evaluated'],
      default: 'submitted',
      index: true,
    },
    testResults: [testResultSchema],
    automaticMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalMarks: {
      type: Number,
      default: null,
      min: 0,
    },
    feedback: {
      type: String,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    evaluatedAt: {
      type: Date,
      default: null,
    },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

submissionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema);
