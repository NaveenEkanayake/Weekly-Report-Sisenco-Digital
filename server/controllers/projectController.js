import { validationResult } from 'express-validator';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res) => {
  try {
    const { status } = req.query;
    
    const filter = {};
    if (status) {
      filter.status = status;
    }

    // Team Members: only see projects they are assigned to
    if (req.user.role === 'Team Member') {
      filter.assignedMembers = req.user._id;
    }

    const projects = await Project.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignedMembers', 'name email department')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
export const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedMembers', 'name email department');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private/Manager
export const createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, description, category, status, startDate, endDate, assignedMembers } = req.body;

    // Check if project exists
    const projectExists = await Project.findOne({ name });

    if (projectExists) {
      return res.status(400).json({
        success: false,
        message: 'Project with this name already exists',
      });
    }

    const project = await Project.create({
      name,
      description,
      category,
      status,
      startDate,
      endDate,
      assignedMembers: assignedMembers || [],
      createdBy: req.user._id,
    });

    // Create notifications for assigned members
    if (assignedMembers && assignedMembers.length > 0) {
      const notifications = assignedMembers.map(userId => ({
        user: userId,
        type: 'project_assigned',
        title: 'New Project Assignment',
        message: `You have been assigned to the new project "${name}" by ${req.user.name}.`,
        relatedProject: project._id,
      }));
      await Notification.insertMany(notifications);
    }

    const populatedProject = await Project.findById(project._id)
      .populate('assignedMembers', 'name email department');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: populatedProject,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private/Manager
export const updateProject = async (req, res) => {
  try {
    const { name, description, category, status, startDate, endDate, assignedMembers } = req.body;

    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check if name is being changed to an existing name
    if (name && name !== project.name) {
      const projectExists = await Project.findOne({ name });
      if (projectExists) {
        return res.status(400).json({
          success: false,
          message: 'Project with this name already exists',
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (assignedMembers !== undefined) updateData.assignedMembers = assignedMembers;

    // Detect newly assigned members for notifications
    if (assignedMembers !== undefined) {
      const oldMembers = project.assignedMembers.map(id => id.toString());
      const newMembers = assignedMembers.map(id => id.toString());
      const addedMembers = newMembers.filter(id => !oldMembers.includes(id));

      if (addedMembers.length > 0) {
        const notifications = addedMembers.map(userId => ({
          user: userId,
          type: 'project_assigned',
          title: 'New Project Assignment',
          message: `You have been assigned to the project "${name || project.name}" by ${req.user.name}.`,
          relatedProject: project._id,
        }));
        await Notification.insertMany(notifications);
      }
    }

    project = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedMembers', 'name email department');

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: project,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private/Manager
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    await project.deleteOne();

    res.json({
      success: true,
      message: 'Project deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Assign member to project
// @route   POST /api/projects/:id/assign/:userId
// @access  Private/Manager
export const assignMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const userId = req.params.userId;

    // Check if already assigned
    if (project.assignedMembers.some(id => id.toString() === userId)) {
      return res.status(400).json({
        success: false,
        message: 'Member is already assigned to this project',
      });
    }

    project.assignedMembers.push(userId);
    await project.save();

    // Create notification for the assigned member
    const member = await User.findById(userId);
    if (member) {
      await Notification.create({
        user: userId,
        type: 'project_assigned',
        title: 'New Project Assignment',
        message: `You have been assigned to the project "${project.name}" by ${req.user.name}.`,
        relatedProject: project._id,
      });
    }

    const populatedProject = await Project.findById(project._id)
      .populate('assignedMembers', 'name email department');

    res.json({
      success: true,
      message: 'Member assigned successfully',
      data: populatedProject,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/assign/:userId
// @access  Private/Manager
export const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const userId = req.params.userId;
    project.assignedMembers = project.assignedMembers.filter(
      (id) => id.toString() !== userId
    );
    await project.save();

    // Create notification for the removed member
    const member = await User.findById(userId);
    if (member) {
      await Notification.create({
        user: userId,
        type: 'project_removed',
        title: 'Removed from Project',
        message: `You have been removed from the project "${project.name}" by ${req.user.name}.`,
        relatedProject: project._id,
      });
    }

    const populatedProject = await Project.findById(project._id)
      .populate('assignedMembers', 'name email department');

    res.json({
      success: true,
      message: 'Member removed successfully',
      data: populatedProject,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
