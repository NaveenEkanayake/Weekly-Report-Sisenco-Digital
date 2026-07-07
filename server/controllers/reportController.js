import { validationResult } from 'express-validator';
import Report from '../models/Report.js';
import User from '../models/User.js';

// @desc    Get all reports (with filters)
// @route   GET /api/reports
// @access  Private
export const getReports = async (req, res) => {
  try {
    const { user, project, startDate, endDate, status } = req.query;
    
    let filter = {};

    // Team Members can only see their own reports
    if (req.user.role === 'Team Member') {
      filter.user = req.user._id;
    } else if (user) {
      // Managers can filter by user
      filter.user = user;
    }

    if (project) {
      filter.project = project;
    }

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.weekStartDate = {};
      if (startDate) {
        filter.weekStartDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.weekStartDate.$lte = new Date(endDate);
      }
    }

    const reports = await Report.find(filter)
      .populate('user', 'name email department')
      .populate('project', 'name category')
      .sort({ weekStartDate: -1 });

    res.json({
      success: true,
      count: reports.length,
      data: reports,
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

// @desc    Get single report
// @route   GET /api/reports/:id
// @access  Private
export const getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('user', 'name email department')
      .populate('project', 'name category');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Team Members can only view their own reports
    if (req.user.role === 'Team Member' && report.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this report',
      });
    }

    res.json({
      success: true,
      data: report,
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

// @desc    Create new report
// @route   POST /api/reports
// @access  Private
export const createReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      weekStartDate,
      weekEndDate,
      project,
      tasksCompleted,
      tasksPlanned,
      blockers,
      hoursWorked,
      notes,
      status,
    } = req.body;

    // Check if report already exists for this week
    const existingReport = await Report.findOne({
      user: req.user._id,
      weekStartDate: new Date(weekStartDate),
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'Report already exists for this week. Please update the existing report.',
      });
    }

    const report = await Report.create({
      user: req.user._id,
      weekStartDate,
      weekEndDate,
      project,
      tasksCompleted,
      tasksPlanned,
      blockers,
      hoursWorked,
      notes,
      status: status || 'Draft',
      submittedAt: status === 'Submitted' ? new Date() : null,
    });

    const populatedReport = await Report.findById(report._id)
      .populate('user', 'name email')
      .populate('project', 'name category');

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: populatedReport,
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

// @desc    Update report
// @route   PUT /api/reports/:id
// @access  Private
export const updateReport = async (req, res) => {
  try {
    let report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Team Members can only update their own reports
    if (req.user.role === 'Team Member' && report.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this report',
      });
    }

    const updateData = { ...req.body };

    // Update submittedAt if status is being changed to Submitted
    if (req.body.status === 'Submitted' && report.status !== 'Submitted') {
      updateData.submittedAt = new Date();
    }

    report = await Report.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('user', 'name email')
      .populate('project', 'name category');

    res.json({
      success: true,
      message: 'Report updated successfully',
      data: report,
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

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private
export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Team Members can only delete their own reports
    if (req.user.role === 'Team Member' && report.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this report',
      });
    }

    await report.deleteOne();

    res.json({
      success: true,
      message: 'Report deleted successfully',
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

// @desc    Get analytics/dashboard data
// @route   GET /api/reports/analytics/dashboard
// @access  Private/Manager
export const getDashboardAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Default to current week if no dates provided
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 7));
    const end = endDate ? new Date(endDate) : new Date();

    // Total reports (all statuses)
    const totalReports = await Report.countDocuments({
      weekStartDate: { $gte: start, $lte: end }
    });

    // Submitted or Reviewed reports
    const submittedCount = await Report.countDocuments({
      weekStartDate: { $gte: start, $lte: end },
      status: { $in: ['Submitted', 'Reviewed'] }
    });

    // Draft reports
    const draftCount = await Report.countDocuments({
      weekStartDate: { $gte: start, $lte: end },
      status: 'Draft'
    });

    // Total active users
    const totalUsers = await User.countDocuments({ 
      isActive: true, 
      role: 'Team Member' 
    });

    // Compliance rate (based on submitted or reviewed reports)
    const complianceRate = totalUsers > 0 ? ((submittedCount / totalUsers) * 100).toFixed(1) : 0;

    // Active blockers count
    const activeBlockers = await Report.countDocuments({
      blockers: { $ne: '', $exists: true },
      status: { $in: ['Submitted', 'Reviewed'] },
      weekStartDate: { $gte: start, $lte: end },
    });

    // Reports by project
    const reportsByProject = await Report.aggregate([
      {
        $match: {
          weekStartDate: { $gte: start, $lte: end },
          status: 'Submitted',
        },
      },
      {
        $group: {
          _id: '$project',
          count: { $sum: 1 },
          totalHours: { $sum: '$hoursWorked' },
        },
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: '_id',
          as: 'projectInfo',
        },
      },
      {
        $unwind: '$projectInfo',
      },
      {
        $project: {
          projectName: '$projectInfo.name',
          category: '$projectInfo.category',
          count: 1,
          totalHours: 1,
        },
      },
    ]);

    // Weekly trend (last 4 weeks)
    const weeklyTrend = await Report.aggregate([
      {
        $match: {
          status: 'Submitted',
          weekStartDate: { $gte: new Date(new Date().setDate(new Date().getDate() - 28)) },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$weekStartDate' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Calculate submission compliance per team member
    const teamMembers = await User.find({ role: 'Team Member', isActive: true }).select('name email department');
    const reportsForWeek = await Report.find({
      weekStartDate: { $gte: start, $lte: end }
    });

    const now = new Date();
    const submissionCompliance = teamMembers.map(member => {
      const memberReport = reportsForWeek.find(r => r.user.toString() === member._id.toString());
      let submissionStatus = 'Pending';
      let reportId = null;

      if (memberReport) {
        reportId = memberReport._id;
        if (memberReport.status === 'Submitted') {
          submissionStatus = 'Submitted';
        } else {
          submissionStatus = now > end ? 'Late' : 'Pending';
        }
      } else {
        submissionStatus = now > end ? 'Late' : 'Pending';
      }

      return {
        user: {
          _id: member._id,
          name: member.name,
          email: member.email,
          department: member.department,
          lastSubmittedAt: memberReport ? memberReport.submittedAt : null
        },
        status: submissionStatus,
        reportId
      };
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalReports,
          submittedCount,
          draftCount,
          totalUsers,
          complianceRate: parseFloat(complianceRate),
          activeBlockers,
        },
        reportsByProject,
        weeklyTrend,
        submissionCompliance
      },
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
