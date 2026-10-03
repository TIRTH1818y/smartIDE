const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
      index: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    developerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    uniqueToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['assigned', 'opened', 'submitted', 'evaluated', 'expired'],
      default: 'assigned',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Please provide an expiration date for the assignment'],
    },
    openedAt: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Method to check if assignment is expired
assignmentSchema.methods.isExpired = function () {
  if (this.status === 'expired') return true;
  if (new Date() > new Date(this.expiresAt)) {
    return true;
  }
  return false;
};

module.exports = mongoose.model('Assignment', assignmentSchema);
