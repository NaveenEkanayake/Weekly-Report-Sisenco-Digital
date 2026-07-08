import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    weekStartDate: {
      type: Date,
      required: [true, 'Please provide week start date'],
      index: true,
    },
    weekEndDate: {
      type: Date,
      required: [true, 'Please provide week end date'],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Please select a project'],
    },
    tasksCompleted: {
      type: String,
      required: [true, 'Please provide tasks completed'],
      trim: true,
    },
    tasksPlanned: {
      type: String,
      required: [true, 'Please provide tasks planned for next week'],
      trim: true,
    },
    blockers: {
      type: String,
      trim: true,
      default: '',
    },
    hasBlocker: {
      type: Boolean,
      default: false,
    },
    blockerDetails: {
      type: String,
      trim: true,
      default: '',
    },
    hoursWorked: {
      type: Number,
      min: 0,
      max: 168,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Reviewed', 'Late'],
      default: 'Draft',
    },
    submittedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one report per user per week
reportSchema.index({ user: 1, weekStartDate: 1 }, { unique: true });

const Report = mongoose.model('Report', reportSchema);

export default Report;
