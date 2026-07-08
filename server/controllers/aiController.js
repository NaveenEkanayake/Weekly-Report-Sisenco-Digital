import Report from '../models/Report.js';
import User from '../models/User.js';
import Project from '../models/Project.js';

// Helper to format reports for the AI context
const formatReportsForAI = (reports) => {
  if (reports.length === 0) return "No reports have been submitted yet.";
  
  return reports.map((r, i) => {
    return `${i + 1}. Team Member: ${r.user?.name || 'Unknown'} (Department: ${r.user?.department || 'N/A'})
   - Week: ${new Date(r.weekStartDate).toLocaleDateString()} to ${new Date(r.weekEndDate).toLocaleDateString()}
   - Project: ${r.project?.name || 'N/A'}
   - Tasks Completed: ${r.tasksCompleted}
   - Tasks Planned: ${r.tasksPlanned}
   - Blockers: ${r.blockers || 'None'}
   - Hours Worked: ${r.hoursWorked || 'Not specified'}
   - Status: ${r.status}
   - Notes: ${r.notes || 'None'}`;
  }).join('\n\n');
};

// Local Rule-Based Report Analyzer (Fallback Mode)
const localAnalyzeReports = (reports, message) => {
  const query = message.toLowerCase().trim();

  const totalReports = reports.length;
  const submittedReports = reports.filter(r => r.status === 'Submitted' || r.status === 'Reviewed');
  const draftReports    = reports.filter(r => r.status === 'Draft');
  const lateReports     = reports.filter(r => r.status === 'Late');
  const activeBlockers  = reports.filter(r => r.blockers && r.blockers.trim() !== '');

  // Group by project
  const byProject = {};
  reports.forEach(r => {
    const name = r.project?.name || 'Unassigned';
    if (!byProject[name]) byProject[name] = { reports: [], hours: 0 };
    byProject[name].reports.push(r);
    byProject[name].hours += r.hoursWorked || 0;
  });

  // Group by user
  const byUser = {};
  reports.forEach(r => {
    const name = r.user?.name || 'Unknown';
    if (!byUser[name]) byUser[name] = { reports: [], submitted: 0, blockers: 0 };
    byUser[name].reports.push(r);
    if (r.status === 'Submitted' || r.status === 'Reviewed') byUser[name].submitted++;
    if (r.blockers && r.blockers.trim()) byUser[name].blockers++;
  });

  // Total hours
  const totalHours = reports.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);
  const avgHours = totalReports > 0 ? (totalHours / totalReports).toFixed(1) : 0;

  // ── Summary / Overview ──────────────────────────────────────────────
  if (query.includes('summary') || query.includes('summarize') || query.includes('overview') || query.includes('what happened') || query.includes('team activity') || query.includes('status')) {
    let out = `## 📋 Team Activity Summary\n\n`;
    out += `**${totalReports} total reports** in the system:\n`;
    out += `- ✅ **${submittedReports.length}** Submitted/Reviewed\n`;
    out += `- 📝 **${draftReports.length}** Drafts\n`;
    out += `- ⚠️ **${activeBlockers.length}** with active blockers\n`;
    out += `- ⏱️ **${totalHours}h** total hours logged\n\n`;

    if (Object.keys(byProject).length > 0) {
      out += `### 🛠️ Work by Project\n`;
      Object.entries(byProject).forEach(([proj, data]) => {
        out += `- **${proj}**: ${data.reports.length} report(s), ${data.hours}h logged\n`;
      });
    }

    if (activeBlockers.length > 0) {
      out += `\n### ⚠️ Active Blockers\n`;
      activeBlockers.slice(0, 5).forEach(r => {
        out += `- **${r.user?.name || 'Unknown'}**: "${r.blockers.substring(0, 80)}..."\n`;
      });
    }
    return out;
  }

  // ── Blockers ─────────────────────────────────────────────────────────
  if (query.includes('block') || query.includes('challenge') || query.includes('issue') || query.includes('problem') || query.includes('impediment') || query.includes('stuck')) {
    if (activeBlockers.length === 0) {
      return `## ✅ No Active Blockers\n\nGreat news! No team members are currently reporting any blockers. All projects appear to be running smoothly.`;
    }
    let out = `## ⚠️ Active Blockers Report\n\n**${activeBlockers.length} blocker(s)** currently reported:\n\n`;
    activeBlockers.forEach((r, i) => {
      out += `### ${i + 1}. ${r.user?.name || 'Unknown'}\n`;
      out += `- **Project**: ${r.project?.name || 'N/A'}\n`;
      out += `- **Blocker**: ${r.blockers}\n`;
      out += `- **Week**: ${new Date(r.weekStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}\n\n`;
    });
    return out;
  }

  // ── Hours / Workload ──────────────────────────────────────────────────
  if (query.includes('hour') || query.includes('workload') || query.includes('time') || query.includes('effort')) {
    let out = `## ⏱️ Hours & Workload Distribution\n\n`;
    out += `- **Total hours logged**: ${totalHours}h\n`;
    out += `- **Average per report**: ${avgHours}h\n\n`;
    out += `### By Project\n`;
    Object.entries(byProject).sort((a, b) => b[1].hours - a[1].hours).forEach(([proj, data]) => {
      const bar = '█'.repeat(Math.max(1, Math.round(data.hours / Math.max(totalHours, 1) * 20)));
      out += `- **${proj}**: ${data.hours}h \`${bar}\`\n`;
    });
    out += `\n### By Team Member\n`;
    Object.entries(byUser).sort((a, b) => {
      const aH = a[1].reports.reduce((s, r) => s + (r.hoursWorked || 0), 0);
      const bH = b[1].reports.reduce((s, r) => s + (r.hoursWorked || 0), 0);
      return bH - aH;
    }).slice(0, 8).forEach(([name, data]) => {
      const h = data.reports.reduce((s, r) => s + (r.hoursWorked || 0), 0);
      out += `- **${name}**: ${h}h across ${data.reports.length} report(s)\n`;
    });
    return out;
  }

  // ── Projects ──────────────────────────────────────────────────────────
  if (query.includes('project') || query.includes('category') || query.includes('client')) {
    if (Object.keys(byProject).length === 0) {
      return `## 📂 Projects\n\nNo project data available in the current reports.`;
    }
    let out = `## 📂 Work by Project\n\n`;
    Object.entries(byProject).sort((a, b) => b[1].reports.length - a[1].reports.length).forEach(([proj, data]) => {
      out += `### ${proj}\n`;
      out += `- **Reports**: ${data.reports.length}\n`;
      out += `- **Hours logged**: ${data.hours}h\n`;
      const contributors = [...new Set(data.reports.map(r => r.user?.name).filter(Boolean))];
      if (contributors.length) out += `- **Contributors**: ${contributors.join(', ')}\n`;
      const recent = data.reports.sort((a, b) => new Date(b.weekStartDate) - new Date(a.weekStartDate))[0];
      if (recent) out += `- **Latest update**: ${recent.tasksCompleted?.substring(0, 100)}...\n`;
      out += '\n';
    });
    return out;
  }

  // ── Team Members ──────────────────────────────────────────────────────
  if (query.includes('member') || query.includes('team') || query.includes('who') || query.includes('person') || query.includes('people') || query.includes('staff')) {
    if (Object.keys(byUser).length === 0) {
      return `## 👥 Team Members\n\nNo member data found in current reports.`;
    }
    let out = `## 👥 Team Member Activity\n\n`;
    Object.entries(byUser).forEach(([name, data]) => {
      const rate = ((data.submitted / Math.max(data.reports.length, 1)) * 100).toFixed(0);
      out += `### ${name}\n`;
      out += `- **Reports**: ${data.reports.length} (${rate}% submitted)\n`;
      if (data.blockers > 0) out += `- ⚠️ **Active blockers**: ${data.blockers}\n`;
      out += '\n';
    });
    return out;
  }

  // ── Late / Compliance ─────────────────────────────────────────────────
  if (query.includes('late') || query.includes('missing') || query.includes('compliance') || query.includes('submitted') || query.includes('pending')) {
    const compRate = totalReports > 0 ? ((submittedReports.length / totalReports) * 100).toFixed(1) : 0;
    let out = `## 📊 Submission Compliance\n\n`;
    out += `- **Compliance rate**: ${compRate}%\n`;
    out += `- ✅ Submitted/Reviewed: ${submittedReports.length}\n`;
    out += `- 📝 Drafts: ${draftReports.length}\n`;
    out += `- ⏰ Late: ${lateReports.length}\n\n`;
    if (lateReports.length > 0) {
      out += `### Late Submissions\n`;
      lateReports.forEach(r => {
        out += `- **${r.user?.name || 'Unknown'}** — Week of ${new Date(r.weekStartDate).toLocaleDateString()}\n`;
      });
    }
    return out;
  }

  // ── Tasks / What was worked on ────────────────────────────────────────
  if (query.includes('task') || query.includes('work') || query.includes('accomplish') || query.includes('complet') || query.includes('done') || query.includes('last week') || query.includes('this week')) {
    const recent = [...reports].sort((a, b) => new Date(b.weekStartDate) - new Date(a.weekStartDate)).slice(0, 10);
    if (recent.length === 0) return `## 📝 Tasks\n\nNo task data available yet.`;
    let out = `## 📝 Recent Tasks Completed\n\n`;
    recent.forEach(r => {
      out += `### ${r.user?.name || 'Unknown'} — ${new Date(r.weekStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}\n`;
      out += `**Project**: ${r.project?.name || 'N/A'}\n\n`;
      out += `${r.tasksCompleted?.substring(0, 200) || 'No details provided'}\n\n`;
    });
    return out;
  }

  // ── Recommendations ───────────────────────────────────────────────────
  if (query.includes('recommend') || query.includes('suggest') || query.includes('improve') || query.includes('advice') || query.includes('help')) {
    let out = `## 💡 AI Recommendations\n\n`;
    if (activeBlockers.length > 0) out += `- 🔴 **Address ${activeBlockers.length} blocker(s)** — schedule unblocking sessions with affected members.\n`;
    if (draftReports.length > 0) out += `- 📝 **Follow up on ${draftReports.length} draft report(s)** — remind members to submit before the deadline.\n`;
    if (lateReports.length > 0) out += `- ⏰ **${lateReports.length} late submission(s)** — consider setting earlier soft deadlines.\n`;
    const compRate = totalReports > 0 ? (submittedReports.length / totalReports) * 100 : 0;
    if (compRate < 80) out += `- 📊 **Compliance at ${compRate.toFixed(0)}%** — below 80%. Consider automated reminders.\n`;
    if (compRate >= 80) out += `- ✅ **Compliance at ${compRate.toFixed(0)}%** — team is performing well. Keep it up!\n`;
    if (out.trim().split('\n').length <= 2) out += `- ✨ Everything looks good! The team is on track.\n`;
    return out;
  }

  // ── Generic / Fallback ────────────────────────────────────────────────
  return `## 🤖 AI Assistant (Local Mode)\n\nI found **${totalReports} reports** in the database. Here's what I can help you with:\n\n` +
    `| Query | Example |\n|---|---|\n` +
    `| Summary | "Summarize team activity" |\n` +
    `| Blockers | "Show active blockers" |\n` +
    `| Projects | "Show project workloads" |\n` +
    `| Hours | "How many hours did the team log?" |\n` +
    `| Team | "Who submitted this week?" |\n` +
    `| Compliance | "What's the compliance rate?" |\n` +
    `| Tasks | "What did the team work on?" |\n` +
    `| Tips | "Give me recommendations" |\n\n` +
    `*For full conversational AI, add a \`GEMINI_API_KEY\` to the backend \`.env\` file.*`;
};

// @desc    Chat with AI Assistant about reports
// @route   POST /api/ai/chat
// @access  Private/Manager
export const chatWithAssistant = async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a message',
      });
    }

    // Fetch reports based on role (Managers see all, Team Members see their own)
    const queryFilter = {};
    if (req.user.role === 'Team Member') {
      queryFilter.user = req.user._id;
    }

    const reports = await Report.find(queryFilter)
      .populate('user', 'name email department')
      .populate('project', 'name category')
      .sort({ weekStartDate: -1 });

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fall back to rule-based analyzer
      const responseText = localAnalyzeReports(reports, message);
      return res.json({
        success: true,
        data: responseText,
        mode: 'local'
      });
    }

    // Gemini API Setup
    const formattedReports = formatReportsForAI(reports);
    const systemPrompt = `You are a helpful AI assistant for a Weekly Report Manager system. You analyze team reports containing completed tasks, planned tasks, hours worked, and blockers.
Your job is to answer the manager's question clearly, professionally, and concisely using the reports data.
If the query asks to summarize, highlight blockers, analyze workload, or list accomplishments, format your answer with markdown bullet points and headings.

---
TEAM REPORTS DATABASE:
${formattedReports}
---

Manager's Query: "${message}"

Answer:`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const apiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: systemPrompt
              }
            ]
          }
        ]
      })
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error('Gemini API Error:', errorData);
      // Fallback to local analyzer if API request fails
      const fallbackText = localAnalyzeReports(reports, message);
      return res.json({
        success: true,
        data: fallbackText,
        mode: 'local-fallback'
      });
    }

    const result = await apiResponse.json();
    const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

    res.json({
      success: true,
      data: aiText,
      mode: 'gemini'
    });

  } catch (error) {
    console.error('AI Assistant Error:', error);
    res.status(500).json({
      success: false,
      message: 'AI Assistant Error',
      error: error.message,
    });
  }
};
