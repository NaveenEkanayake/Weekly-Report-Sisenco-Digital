import { validationResult } from 'express-validator';
import Report from '../models/Report.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Project from '../models/Project.js';

// Helper: compute Monday-Sunday week boundaries
const getWeekRange = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
};

// Helper: generate all weeks from startDate to today
const generateWeekSlots = (startDate, endDate) => {
  const slots = [];
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const current = new Date(start);

  while (current <= end) {
    const { start: mon, end: sun } = getWeekRange(current);
    slots.push({ weekStartDate: mon, weekEndDate: sun });
    current.setDate(current.getDate() + 7);
  }
  return slots;
};

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
      hasBlocker,
      blockerDetails,
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
      blockers: hasBlocker ? blockerDetails : '',
      hasBlocker: hasBlocker || false,
      blockerDetails: hasBlocker ? blockerDetails : '',
      hoursWorked,
      notes,
      status: status || 'Draft',
      submittedAt: status === 'Submitted' ? new Date() : null,
    });

    // Notify managers on submission
    if (status === 'Submitted') {
      const managers = await User.find({ role: 'Manager' });
      if (managers.length > 0) {
        const notifications = managers.map(mgr => ({
          user: mgr._id,
          type: 'report_submitted',
          title: 'New Report Submitted',
          message: `${req.user.name} submitted a weekly report for week starting ${new Date(weekStartDate).toLocaleDateString()}.`,
          relatedReport: report._id
        }));
        await Notification.insertMany(notifications).catch(err => console.error('Notification error:', err));
      }
    }

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

    if (req.user.role === 'Team Member' && report.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this report',
      });
    }

    const updateData = { ...req.body };

    // Handle blocker fields
    if (req.body.hasBlocker === true) {
      updateData.blockers = req.body.blockerDetails || '';
      updateData.blockerDetails = req.body.blockerDetails || '';
    } else if (req.body.hasBlocker === false) {
      updateData.blockers = '';
      updateData.blockerDetails = '';
    }

    const oldStatus = report.status;
    const newStatus = req.body.status;

    if (newStatus === 'Submitted' && oldStatus !== 'Submitted') {
      updateData.submittedAt = new Date();
      // Notify managers
      const managers = await User.find({ role: 'Manager' });
      if (managers.length > 0) {
        const notifications = managers.map(mgr => ({
          user: mgr._id,
          type: 'report_submitted',
          title: 'New Report Submitted',
          message: `${req.user.name} submitted a weekly report for week starting ${new Date(report.weekStartDate).toLocaleDateString()}.`,
          relatedReport: report._id
        }));
        await Notification.insertMany(notifications).catch(err => console.error('Notification error:', err));
      }
    }

    if (newStatus === 'Reviewed' && oldStatus !== 'Reviewed') {
      // Notify team member
      await Notification.create({
        user: report.user,
        type: 'report_reviewed',
        title: 'Report Reviewed',
        message: `Your report for week starting ${new Date(report.weekStartDate).toLocaleDateString()} has been marked as Reviewed by ${req.user.name}.`,
        relatedReport: report._id
      }).catch(err => console.error('Notification error:', err));
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

// @desc    Get analytics/dashboard data (project-timeline based)
// @route   GET /api/reports/analytics/dashboard
// @access  Private/Manager
export const getDashboardAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const now = new Date();

    // Default to current week if no dates provided
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 7));
    const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date();

    // Total active team members
    const totalUsers = await User.countDocuments({ 
      isActive: true, 
      role: 'Team Member' 
    });

    // Total reports in period
    const totalReports = await Report.countDocuments({
      weekStartDate: { $gte: start, $lte: end }
    });

    // Submitted/Reviewed reports
    const submittedCount = await Report.countDocuments({
      weekStartDate: { $gte: start, $lte: end },
      status: { $in: ['Submitted', 'Reviewed'] }
    });

    // Draft reports
    const draftCount = await Report.countDocuments({
      weekStartDate: { $gte: start, $lte: end },
      status: 'Draft'
    });

    // Active blockers (hasBlocker = true + has details)
    const activeBlockers = await Report.countDocuments({
      hasBlocker: true,
      blockerDetails: { $ne: '', $exists: true },
      status: { $in: ['Submitted', 'Reviewed'] },
      weekStartDate: { $gte: start, $lte: end },
    });

    // ── Project-Timeline Compliance Rate ──
    // Get all projects with startDate defined
    const projects = await Project.find({
      startDate: { $exists: true, $ne: null },
      status: 'Active',
    });

    let totalElapsedWeeks = 0;
    let totalSubmittedWeeks = 0;

    for (const project of projects) {
      const weekSlots = generateWeekSlots(project.startDate, project.endDate || now);
      totalElapsedWeeks += weekSlots.length;

      // Count submitted weeks for members assigned to this project
      const memberIds = project.assignedMembers.length > 0 
        ? project.assignedMembers 
        : await User.find({ role: 'Team Member', isActive: true }).distinct('_id');

      for (const memberId of memberIds) {
        for (const slot of weekSlots) {
          if (slot.weekStartDate <= now) {
            const reportExists = await Report.findOne({
              user: memberId,
              project: project._id,
              weekStartDate: slot.weekStartDate,
              status: { $in: ['Submitted', 'Reviewed'] },
            });
            if (reportExists) totalSubmittedWeeks++;
          }
        }
      }
    }

    // Fallback to simple compliance if no projects with dates
    let complianceRate = 0;
    if (totalElapsedWeeks > 0) {
      complianceRate = parseFloat(((totalSubmittedWeeks / totalElapsedWeeks) * 100).toFixed(1));
    } else if (totalUsers > 0) {
      complianceRate = parseFloat(((submittedCount / totalUsers) * 100).toFixed(1));
    }

    // Reports by project
    const reportsByProject = await Report.aggregate([
      {
        $match: {
          weekStartDate: { $gte: start, $lte: end },
          status: { $in: ['Submitted', 'Reviewed'] },
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

    // Weekly trend
    const trendStart = new Date(start.getTime() - 21 * 24 * 60 * 60 * 1000);
    const weeklyTrend = await Report.aggregate([
      {
        $match: {
          status: { $in: ['Submitted', 'Reviewed'] },
          weekStartDate: { $gte: trendStart, $lte: end },
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

    // Submission compliance per team member (with project-timeline awareness)
    const teamMembers = await User.find({ role: 'Team Member', isActive: true }).select('name email department');
    const reportsForWeek = await Report.find({
      weekStartDate: { $gte: start, $lte: end }
    });

    const submissionCompliance = teamMembers.map(member => {
      const memberReport = reportsForWeek.find(r => r.user.toString() === member._id.toString());
      let submissionStatus = 'Pending';
      let reportId = null;

      if (memberReport) {
        reportId = memberReport._id;
        if (memberReport.status === 'Submitted' || memberReport.status === 'Reviewed') {
          submissionStatus = 'Submitted';
        } else if (memberReport.status === 'Late') {
          submissionStatus = 'Late';
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

    // Compute lateCount/pendingCount from submissionCompliance
    const lateCount = submissionCompliance.filter(s => s.status === 'Late').length;
    const pendingCount = submissionCompliance.filter(s => s.status === 'Pending').length;

    res.json({
      success: true,
      data: {
        summary: {
          totalReports,
          submittedCount,
          draftCount,
          lateCount,
          pendingCount,
          totalUsers,
          complianceRate,
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
