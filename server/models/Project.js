import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a project name'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Client Work', 'Internal Tooling', 'R&D', 'Marketing', 'Operations', 'Other'],
      default: 'Other',
    },
    status: {
      type: String,
      enum: ['Active', 'On Hold', 'Completed', 'Archived'],
      default: 'Active',
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    assignedMembers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model('Project', projectSchema);

export default Project;
