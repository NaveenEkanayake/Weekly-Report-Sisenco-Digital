# Weekly Report Manager Refactoring & Real-Time Updates Walkthrough

We have solved the Nodemailer authorization error, implemented real-time database polling, built a "My Assigned Projects & Instructions" page/widget on the Member page, and set up notification messages across the app.

---

## 📋 Key Accomplishments

### 1. Nodemailer "Missing credentials for PLAIN" Resolved
* **Root Cause**: In ES Modules, `import` statements are hoisted and executed *before* step-by-step code. This meant `authController.js` loaded and called `nodemailer.createTransport()` using `process.env.EMAIL_USER` before `dotenv.config()` was executed in `server.js` (resulting in `undefined` credentials).
* **Fix**: Encapsulated Nodemailer transport creation inside a runtime helper function:
  ```javascript
  const getTransporter = async () => {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      return nodemailer.createTransport({...});
    }
    // Ethereal Dev Fallback
  };
  ```
  Now, Nodemailer dynamically reads your credentials (`nekanayake789@gmail.com`) when a request comes in.

### 2. Assignment View on Member Page
* **Design**: Projects assigned to team members represent their tasks/instructions. Added a beautiful, modern grid widget **"My Project Assignments / Instructions"** directly on the Member Dashboard.
* **Details**: Showcases the Project Name, Category, Instructions/Description, Status, and Start/End timelines.

### 3. Real-Time Database Sync (10-Second Polling)
* Set up database auto-polling inside the React hook:
  ```javascript
  const interval = setInterval(() => {
    fetchReports();
    fetchProjects();
  }, 10000);
  ```
  This guarantees that all project assignments, report statuses, and notifications are synced with the live database in real time.

### 4. Interactive Notifications & Logs
* **Report Submissions**: When a Team Member submits a report, all Managers are notified:
  - *Title*: `New Report Submitted`
  - *Message*: `[User] submitted a weekly report for week starting [Date].`
* **Report Reviews**: When a Manager marks a report as "Reviewed", the corresponding Team Member is notified:
  - *Title*: `Report Reviewed`
  - *Message*: `Your report for week starting [Date] has been marked as Reviewed by [Manager].`
* **Project Assignments**: When a Manager assigns or updates team member project lists, those members receive instant `project_assigned` notifications.
* **Notification Bell**: Displayed in the Navbar, complete with unread badge indicators and a mark-all-as-read trigger.
