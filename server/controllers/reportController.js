import { validationResult } from 'express-validator';
import Report from '../models/Report.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Project from '../models/Project.js';
import { sendLateThresholdAlert } from '../utils/email.js';

// Default late submission threshold (configurable via env)
const LATE_THRESHOLD = parseInt(process.env.LATE_SUBMISSION_THRESHOLD || '3');

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

    // Determine if the report is late by comparing with project end date
    let finalStatus = status || 'Draft';
    if (finalStatus === 'Submitted') {
      const projectDoc = await Project.findById(project).select('endDate');
      if (projectDoc && projectDoc.endDate) {
        const projectEndDate = new Date(projectDoc.endDate);
        projectEndDate.setHours(23, 59, 59, 999);
        const reportWeekEnd = new Date(weekEndDate);
        if (reportWeekEnd > projectEndDate) {
          finalStatus = 'Late';
        }
      }
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
      status: finalStatus,
      submittedAt: finalStatus === 'Submitted' || finalStatus === 'Late' ? new Date() : null,
    });

    // Notify managers on submission
    if (status === 'Submitted') {
      const managers = await User.find({ role: 'Manager' });
      if (managers.length > 0) {
        const isLate = finalStatus === 'Late';
        const notifications = managers.map(mgr => ({
          user: mgr._id,
          type: isLate ? 'report_late' : 'report_submitted',
          title: isLate ? '⚠️ Late Report Submitted' : 'New Report Submitted',
          message: isLate
            ? `${req.user.name} submitted a weekly report for week starting ${new Date(weekStartDate).toLocaleDateString()} AFTER the project deadline.`
            : `${req.user.name} submitted a weekly report for week starting ${new Date(weekStartDate).toLocaleDateString()}.`,
          relatedReport: report._id
        }));
        await Notification.insertMany(notifications).catch(err => console.error('Notification error:', err));
      }
    }

    const populatedReport = await Report.findById(report._id)
      .populate('user', 'name email')
      .populate('project', 'name category');

    // Check late submission threshold and alert managers if exceeded
    if (finalStatus === 'Late') {
      try {
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const lateCount = await Report.countDocuments({
          status: 'Late',
          submittedAt: { $gte: thirtyDaysAgo, $lte: now },
        });

        if (lateCount >= LATE_THRESHOLD) {
          const managers = await User.find({ role: 'Manager' }).select('name email');
          const totalMembers = await User.countDocuments({ role: 'Team Member', isActive: true });
          sendLateThresholdAlert(managers, lateCount, LATE_THRESHOLD, totalMembers).catch(err =>
            console.error('Threshold alert error:', err)
          );
        }
      } catch (err) {
        console.error('Threshold check error:', err);
      }
    }

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
    let newStatus = req.body.status;

    // If transitioning to Submitted, check project deadline for late detection
    if (newStatus === 'Submitted' && oldStatus !== 'Submitted') {
      const projectDoc = await Project.findById(report.project).select('endDate');
      if (projectDoc && projectDoc.endDate) {
        const projectEndDate = new Date(projectDoc.endDate);
        projectEndDate.setHours(23, 59, 59, 999);
        const reportWeekEnd = new Date(report.weekEndDate);
        if (reportWeekEnd > projectEndDate) {
          newStatus = 'Late';
          updateData.status = newStatus;
        }
      }
    }

    // Set submittedAt for both Submitted and Late transitions (audit trail)
    if ((newStatus === 'Submitted' || newStatus === 'Late') && oldStatus !== 'Submitted' && oldStatus !== 'Late') {
      updateData.submittedAt = new Date();
      if (newStatus === 'Late') {
        updateData.status = newStatus;
      }
      // Notify managers
      const managers = await User.find({ role: 'Manager' });
      if (managers.length > 0) {
        const isLate = newStatus === 'Late';
        const notifications = managers.map(mgr => ({
          user: mgr._id,
          type: isLate ? 'report_late' : 'report_submitted',
          title: isLate ? '⚠️ Late Report Submitted' : 'New Report Submitted',
          message: isLate
            ? `${req.user.name} submitted a weekly report for week starting ${new Date(report.weekStartDate).toLocaleDateString()} AFTER the project deadline.`
            : `${req.user.name} submitted a weekly report for week starting ${new Date(report.weekStartDate).toLocaleDateString()}.`,
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

// @desc    Get unified metrics + charts data (specific format for admin dashboard)
// @route   GET /api/admin/metrics-charts
// @query   ?member=userId&project=projectId&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private/Manager
export const getMetricsCharts = async (req, res) => {
  try {
    const { member, project, startDate, endDate } = req.query;
    const now = new Date();

    // ── Date range ──
    const start = startDate 
      ? new Date(startDate) 
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() - 7);
          d.setHours(0, 0, 0, 0);
          return d;
        })();
    const end = endDate 
      ? new Date(endDate + 'T23:59:59.999Z') 
      : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // ── 1. Fetch all active projects with assignments and deadlines ──
    const activeProjects = await Project.find({
      status: 'Active',
    }).select('name assignedMembers startDate endDate');

    // Build a Set of member IDs who are assigned to at least one active project
    const assignedMemberIds = new Set();
    const projectDeadlines = []; // { memberId, deadlineEndOfDay }
    for (const proj of activeProjects) {
      if (proj.assignedMembers.length === 0) {
        // No specific members assigned → all active team members are expected
        const allMembers = await User.find({ role: 'Team Member', isActive: true }).distinct('_id');
        for (const mid of allMembers) {
          assignedMemberIds.add(mid.toString());
          if (proj.endDate) {
            projectDeadlines.push({ memberId: mid.toString(), deadline: new Date(proj.endDate) });
          }
        }
      } else {
        for (const mid of proj.assignedMembers) {
          const midStr = mid.toString();
          assignedMemberIds.add(midStr);
          if (proj.endDate) {
            projectDeadlines.push({ memberId: midStr, deadline: new Date(proj.endDate) });
          }
        }
      }
    }

    // totalExpected = only members assigned to active projects
    const totalExpected = assignedMemberIds.size;

    // ── 2. Reports in period (with optional member/project filters) ──
    const reportFilter = {
      weekStartDate: { $gte: start, $lte: end }
    };
    if (member) reportFilter.user = member;
    if (project) reportFilter.project = project;

    const reports = await Report.find(reportFilter)
      .populate('project', 'name endDate')
      .populate('user', 'name');

    // ── 3. Compute per-member status ──
    let onTimeCount = 0;
    let lateCount = 0;
    let openBlockers = 0;

    // Track which assigned members have been accounted for (have ANY report)
    const accountedMembers = new Set();

    for (const report of reports) {
      if (report.hasBlocker) openBlockers++;

      const memberId = report.user?._id?.toString();
      if (memberId) accountedMembers.add(memberId);

      let isLate = false;
      const submitTime = report.submittedAt || report.createdAt;

      if (report.status === 'Late') {
        isLate = true;
      } else if (report.status === 'Submitted' || report.status === 'Reviewed') {
        const projectDeadline = report.project?.endDate ? new Date(report.project.endDate) : null;
        if (projectDeadline) {
          // Manager's project deadline is the authoritative deadline
          if (submitTime && submitTime > projectDeadline) {
            isLate = true;
          }
        } else if (submitTime && report.weekEndDate && submitTime > report.weekEndDate) {
          // No project deadline — fall back to week end date
          isLate = true;
        }
      }

      if (isLate) {
        lateCount++;
      } else if (report.status === 'Submitted' || report.status === 'Reviewed') {
        onTimeCount++;
      }
    }

    // For assigned members with NO report: check if ANY of their project deadlines have passed
    for (const memberId of assignedMemberIds) {
      if (accountedMembers.has(memberId)) continue;

      // Get latest project deadline for this member
      const memberDeadlines = projectDeadlines.filter(pd => pd.memberId === memberId);
      const latestDeadline = memberDeadlines.reduce((latest, pd) =>
        !latest || pd.deadline > latest ? pd.deadline : latest, null
      );
      if (latestDeadline && latestDeadline < now) {
        lateCount++;
      }
    }

    // pendingCount = assigned members who have neither on-time nor late status
    const pendingCount = Math.max(0, totalExpected - (onTimeCount + lateCount));

    // Compliance rate: (On-Time / Total Expected) × 100
    let complianceRate;
    if (totalExpected > 0) {
      complianceRate = parseFloat(((onTimeCount / totalExpected) * 100).toFixed(1));
    } else if ((onTimeCount + lateCount) > 0) {
      complianceRate = parseFloat(((onTimeCount / (onTimeCount + lateCount)) * 100).toFixed(1));
    } else {
      complianceRate = 0;
    }

    // ── 4. Chart: submissionStatus ──
    const submissionStatus = [
      { status: 'Submitted On-Time', value: onTimeCount, color: '#10B981' },
      { status: 'Late', value: lateCount, color: '#F59E0B' },
      { status: 'Pending/Draft', value: pendingCount, color: '#EF4444' },
    ].filter(d => d.value > 0);

    // ── 5. Chart: workloadDistribution ──
    const workloadByProject = {};
    for (const report of reports) {
      const pid = report.project?._id?.toString() || 'unknown';
      if (!workloadByProject[pid]) {
        workloadByProject[pid] = {
          projectName: report.project?.name || 'Unknown Project',
          hours: 0,
          taskCount: 0,
        };
      }
      workloadByProject[pid].hours += (report.hoursWorked || 0);
      // Count task items (newline-separated lines in tasksCompleted)
      const tasks = (report.tasksCompleted || '').split('\n').filter(t => t.trim());
      workloadByProject[pid].taskCount += tasks.length;
    }
    const workloadDistribution = Object.values(workloadByProject);

    // ── 6. Chart: tasksCompletedTrend ──
    const weekGroups = {};
    for (const report of reports) {
      if (!report.weekStartDate) continue;
      const d = new Date(report.weekStartDate);
      const weekLabel = `Week ${Math.ceil((d - new Date(d.getFullYear(), 0, 1)) / 604800000)}`;
      if (!weekGroups[weekLabel]) weekGroups[weekLabel] = 0;
      const tasks = (report.tasksCompleted || '').split('\n').filter(t => t.trim());
      weekGroups[weekLabel] += tasks.length;
    }
    const tasksCompletedTrend = Object.entries(weekGroups)
      .map(([week, completedCount]) => ({ week, completedCount }))
      .sort((a, b) => {
        const numA = parseInt(a.week.replace('Week ', ''));
        const numB = parseInt(b.week.replace('Week ', ''));
        return numA - numB;
      });

    // ── Response ──
    res.json({
      success: true,
      data: {
        summary: {
          totalSubmitted: onTimeCount,
          lateSubmissions: lateCount,
          pendingReports: pendingCount,
          complianceRate,
          openBlockersCount: openBlockers,
        },
        charts: {
          submissionStatus,
          workloadDistribution,
          tasksCompletedTrend,
        },
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

// @desc    Get late submissions audit log
// @route   GET /api/admin/late-submissions
// @access  Private/Manager
export const getLateSubmissions = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const now = new Date();

    // Default: last 30 days if no dates provided
    const start = startDate
      ? new Date(startDate)
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() - 30);
          d.setHours(0, 0, 0, 0);
          return d;
        })();
    const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date();

    // Find all reports with status 'Late' in the date range
    const lateReports = await Report.find({
      status: 'Late',
      submittedAt: { $gte: start, $lte: end },
    })
      .populate('user', 'name email department')
      .populate('project', 'name endDate')
      .sort({ submittedAt: -1 });

    // Also find reports that were submitted on time but after project deadline
    // (status is 'Submitted' or 'Reviewed' but submittedAt > project.endDate)
    const allSubmittedReports = await Report.find({
      status: { $in: ['Submitted', 'Reviewed'] },
      submittedAt: { $gte: start, $lte: end },
    })
      .populate('user', 'name email department')
      .populate('project', 'name endDate');

    const additionalLate = [];
    for (const report of allSubmittedReports) {
      if (report.project?.endDate && report.submittedAt) {
        const projectEndDate = new Date(report.project.endDate);
        projectEndDate.setHours(23, 59, 59, 999);
        if (report.submittedAt > projectEndDate) {
          // Check if not already in lateReports
          const isDuplicate = lateReports.some(lr => lr._id.toString() === report._id.toString());
          if (!isDuplicate) {
            additionalLate.push({
              ...report.toObject(),
              wasAutoDetected: false,
              submittedAfterDeadline: true,
            });
          }
        }
      }
    }

    // Combine and sort by submittedAt
    const allLate = [
      ...lateReports.map(r => ({
        ...r.toObject(),
        wasAutoDetected: true,
        submittedAfterDeadline: true,
      })),
      ...additionalLate,
    ].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    // Compute summary stats
    const totalLate = allLate.length;
    const uniqueMembers = new Set(allLate.map(r => r.user?._id?.toString())).size;
    const lateByProject = {};
    for (const report of allLate) {
      const projectName = report.project?.name || 'Unknown';
      lateByProject[projectName] = (lateByProject[projectName] || 0) + 1;
    }

    res.json({
      success: true,
      data: {
        lateSubmissions: allLate,
        summary: {
          totalLate,
          uniqueMembers,
          lateByProject: Object.entries(lateByProject).map(([name, count]) => ({ name, count })),
        },
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

// @desc    Get analytics/dashboard data (project-timeline based)
// @route   GET /api/reports/analytics/dashboard
// @access  Private/Manager
export const getDashboardAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const now = new Date();

    // Default to 7 days ago (start of day) if no dates provided
    const start = startDate 
      ? new Date(startDate) 
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() - 7);
          d.setHours(0, 0, 0, 0);
          return d;
        })();
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

    // Submitted reports (only 'Submitted' status)
    const submittedCount = await Report.countDocuments({
      weekStartDate: { $gte: start, $lte: end },
      status: 'Submitted'
    });

    // Reviewed reports (only 'Reviewed' status)
    const reviewedCount = await Report.countDocuments({
      weekStartDate: { $gte: start, $lte: end },
      status: 'Reviewed'
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

    // ── Project-Timeline Compliance Rate (optimized with batch queries) ──
    const activeProjects = await Project.find({
      startDate: { $exists: true, $ne: null },
      status: 'Active',
    });

    let totalExpectedSubmissions = 0;
    let totalOnTimeSubmissions = 0;

    for (const project of activeProjects) {
      const weekSlots = generateWeekSlots(project.startDate, project.endDate || now);

      const memberIds = project.assignedMembers.length > 0 
        ? project.assignedMembers 
        : await User.find({ role: 'Team Member', isActive: true }).distinct('_id');

      if (weekSlots.length === 0 || memberIds.length === 0) continue;

      // Batch fetch all submitted/reviewed reports for this project + members
      const projectReports = await Report.find({
        project: project._id,
        user: { $in: memberIds },
        weekStartDate: { 
          $gte: weekSlots[0].weekStartDate, 
          $lte: weekSlots[weekSlots.length - 1].weekStartDate 
        },
        status: { $in: ['Submitted', 'Reviewed'] }
      });

      // Build lookup map: key = `${userId}_${weekStartDate.getTime()}`
      const reportMap = {};
      for (const report of projectReports) {
        const key = `${report.user}_${report.weekStartDate.getTime()}`;
        reportMap[key] = report;
      }

      for (const memberId of memberIds) {
        for (const slot of weekSlots) {
          // Only count weeks that have started (past or current)
          if (slot.weekStartDate > now) continue;

          totalExpectedSubmissions++;
          const key = `${memberId}_${slot.weekStartDate.getTime()}`;
          const report = reportMap[key];

          if (report && report.submittedAt) {
            // On time: submitted on or before the week's end (Sunday)
            if (report.submittedAt <= slot.weekEndDate) {
              totalOnTimeSubmissions++;
            }
            // Submitted after week end = late (counted as expected but NOT on-time)
          }
          // No report at all = not on time
        }
      }
    }

    // Compute compliance rate from project-timeline data
    let complianceRate = 0;
    if (totalExpectedSubmissions > 0) {
      complianceRate = parseFloat(((totalOnTimeSubmissions / totalExpectedSubmissions) * 100).toFixed(1));
    } else if (totalUsers > 0) {
      // Fallback: simple ratio of submitted users
      complianceRate = parseFloat((((submittedCount + reviewedCount) / totalUsers) * 100).toFixed(1));
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

    // Submission compliance per team member — late = submittedAt > weekEndDate
    const teamMembers = await User.find({ role: 'Team Member', isActive: true }).select('name email department');
    const reportsInPeriod = await Report.find({
      weekStartDate: { $gte: start, $lte: end }
    });

    // Get all active projects once to avoid per-member queries
    const activeProjectsForCompliance = await Project.find({
      status: 'Active',
      $and: [{
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: start } }
        ]
      }]
    }).select('assignedMembers');

    // Group reports by user for fast lookup
    const reportsByUser = {};
    for (const report of reportsInPeriod) {
      const uid = report.user.toString();
      if (!reportsByUser[uid]) reportsByUser[uid] = [];
      reportsByUser[uid].push(report);
    }

    const submissionCompliance = [];
    for (const member of teamMembers) {
      const uid = member._id.toString();
      const memberReports = reportsByUser[uid] || [];
      let submissionStatus = 'Pending';
      let reportId = null;
      let lastSubmittedAt = null;

      // Check if member is expected (assigned to any active project)
      const isExpected = activeProjectsForCompliance.some(p =>
        p.assignedMembers.length === 0 ||
        p.assignedMembers.some(m => m.toString() === uid)
      );

      if (!isExpected) {
        submissionStatus = 'N/A';
      } else if (memberReports.length > 0) {
        // Use the latest report in the period
        const latest = memberReports.sort((a, b) => b.weekStartDate - a.weekStartDate)[0];
        reportId = latest._id;
        lastSubmittedAt = latest.submittedAt;

        if (latest.status === 'Submitted' || latest.status === 'Reviewed') {
          // Check if it was submitted on time
          if (latest.submittedAt && latest.weekEndDate && latest.submittedAt > latest.weekEndDate) {
            submissionStatus = 'Late';
          } else {
            submissionStatus = 'Submitted';
          }
        } else if (latest.status === 'Late') {
          submissionStatus = 'Late';
        } else {
          // Draft — check if the week's deadline has passed
          submissionStatus = (latest.weekEndDate && latest.weekEndDate < now) ? 'Late' : 'Pending';
        }
      } else {
        // No report at all — late if the query period's end has passed
        submissionStatus = (end < now) ? 'Late' : 'Pending';
      }

      submissionCompliance.push({
        user: {
          _id: member._id,
          name: member.name,
          email: member.email,
          department: member.department,
          lastSubmittedAt
        },
        status: submissionStatus,
        reportId
      });
    }

    // Compute lateCount/pendingCount from submissionCompliance
    const lateCount = submissionCompliance.filter(s => s.status === 'Late').length;
    const pendingCount = submissionCompliance.filter(s => s.status === 'Pending').length;

    res.json({
      success: true,
      data: {
        summary: {
          totalReports,
          submittedCount,
          reviewedCount,
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
