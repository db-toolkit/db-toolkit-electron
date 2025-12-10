/**
 * IPC handlers for issue reporting.
 */

const { ipcMain } = require('electron');
const { Resend } = require('resend');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const issuesDb = [];

function registerIssuesHandlers() {
  ipcMain.handle('issues:create', async (event, issue) => {
    try {
      const newIssue = {
        id: `issue_${Date.now()}`,
        title: issue.title,
        description: issue.description,
        issue_type: issue.issue_type,
        environment: issue.environment,
        status: 'open',
        created_at: new Date().toISOString()
      };
      
      issuesDb.push(newIssue);
      console.log(`Issue created: ${newIssue.id} - ${issue.title}`);
      
      await sendIssueEmail(newIssue);
      
      return { success: true, issue: newIssue };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('issues:list', async () => {
    try {
      return { success: true, issues: issuesDb };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('issues:get', async (event, issueId) => {
    try {
      const issue = issuesDb.find(i => i.id === issueId);
      if (!issue) {
        return { success: false, error: 'Issue not found' };
      }
      return { success: true, issue };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

async function sendIssueEmail(issue) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const issueEmail = process.env.ISSUE_EMAIL || 'your-email@example.com';
  
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not set, skipping email');
    return;
  }
  
  try {
    const resend = new Resend(resendApiKey);
    
    const badgeColors = {
      bug: '#ef4444',
      feature: '#f59e0b',
      question: '#3b82f6',
      documentation: '#10b981'
    };
    
    const env = issue.environment || {};
    const createdAt = new Date(issue.created_at).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZone: 'UTC'
    });
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; color: white; font-size: 12px; font-weight: bold; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .section { margin: 20px 0; }
    .label { font-weight: bold; color: #6b7280; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Issue Report</h2>
      <span class="badge" style="background: ${badgeColors[issue.issue_type] || '#6b7280'}">${issue.issue_type.toUpperCase()}</span>
    </div>
    <div class="content">
      <div class="section">
        <div class="label">Title</div>
        <div>${issue.title}</div>
      </div>
      <div class="section">
        <div class="label">Description</div>
        <div>${issue.description}</div>
      </div>
      <div class="section">
        <div class="label">Environment</div>
        <div>OS: ${env.os || 'Unknown'}</div>
        <div>Version: ${env.version || 'Unknown'}</div>
      </div>
      <div class="footer">
        <div>Issue ID: ${issue.id}</div>
        <div>Created: ${createdAt} UTC</div>
      </div>
    </div>
  </div>
</body>
</html>
    `;
    
    await resend.emails.send({
      from: `DB Toolkit <${fromEmail}>`,
      to: [issueEmail],
      subject: `[${issue.issue_type.toUpperCase()}] ${issue.title}`,
      html
    });
    
    console.log(`Issue email sent for ${issue.id}`);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
}

module.exports = { registerIssuesHandlers };
