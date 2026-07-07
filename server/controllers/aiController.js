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
  const query = message.toLowerCase();
  
  // Calculate basic statistics
  const totalReports = reports.length;
  const submittedReports = reports.filter(r => r.status === 'Submitted');
  const drafts = reports.filter(r => r.status === 'Draft');
  const activeBlockers = reports.filter(r => r.blockers && r.blockers.trim() !== '');
  
  // Group tasks by project
  const projectTasks = {};
  reports.forEach(r => {
    const projName = r.project?.name || 'Other';
    if (!projectTasks[projName]) projectTasks[projName] = [];
    projectTasks[projName].push(r.tasksCompleted);
  });

  // Handle general summary queries
  if (query.includes('summary') || query.includes('summarize') || query.includes('overview') || query.includes('status')) {
    let summaryText = `### 📋 Team Activity Summary (Local Analyzer Mode)
Here is an analysis of the **${totalReports} total reports** in the system:

* **Submissions**: ${submittedReports.length} Submitted, ${drafts.length} Drafts.
* **Blockers**: There are **${activeBlockers.length} active blockers** reported by the team.

#### 🛠️ Project Updates:\n`;
    
    Object.entries(projectTasks).forEach(([project, tasks]) => {
      summaryText += `* **${project}**: ${tasks.length} active updates.
  - Recent accomplishments: ${tasks.slice(0, 2).map(t => t.substring(0, 80) + '...').join('; ')}\n`;
    });
    
    if (activeBlockers.length > 0) {
      summaryText += `\n#### ⚠️ Active Blockers:\n`;
      activeBlockers.forEach(r => {
        summaryText += `* **${r.user?.name || 'Unknown'}** on project *${r.project?.name || 'N/A'}*: "${r.blockers}"\n`;
      });
    }

    return summaryText + `\n*Note: To enable full conversational AI, configure a \`GEMINI_API_KEY\` in the backend \`.env\` file.*`;
  }

  // Handle blockers query
  if (query.includes('block') || query.includes('challenge') || query.includes('issue') || query.includes('problem')) {
    if (activeBlockers.length === 0) {
      return "✅ **No active blockers** are currently reported by any team members. All projects are running smoothly!";
    }
    
    let blockerText = `### ⚠️ Active Blockers Report (${activeBlockers.length} issues found)\n\n`;
    activeBlockers.forEach((r, i) => {
      blockerText += `${i + 1}. **${r.user?.name || 'Unknown'}** (Project: *${r.project?.name || 'N/A'}*):
   - **Blocker**: "${r.blockers}"
   - **Contact**: ${r.user?.email || 'N/A'}\n\n`;
    });
    return blockerText + `*Note: To unlock conversational summaries, configure \`GEMINI_API_KEY\` in your \`.env\`.*`;
  }

  // Handle projects queries
  if (query.includes('project') || query.includes('workload')) {
    let projectText = `### 📊 Workload Distribution by Project\n\n`;
    Object.entries(projectTasks).forEach(([proj, tasks]) => {
      projectText += `* **${proj}**: ${tasks.length} team member updates.
  - Tasks summary: ${tasks.map(t => `"${t.substring(0, 60)}..."`).join(' | ')}\n\n`;
    });
    return projectText;
  }

  // General Q&A Fallback Response
  return `🤖 **Jobsly AI (Local Analysis Mode)**
I found **${reports.length} report records** in the database. 

Since you asked a custom question: *"${message}"*, you can query standard insights like:
1. **"Summarize team activity"**
2. **"Show all blockers"**
3. **"Show project workloads"**

*Tip: Please set a \`GEMINI_API_KEY\` in the backend \`.env\` file to enable full conversational intelligence.*`;
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
    const systemPrompt = `You are Jobsly AI, an advanced management advisor and team reporter chatbot.
Below is the database of the team's weekly reports containing completed tasks, planned tasks, hours worked, and blockers.
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
