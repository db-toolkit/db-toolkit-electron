/**
 * IPC handlers for issue reporting.
 */

const { ipcMain, app } = require('electron');
const { Resend } = require('resend');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { logger } = require('../utils/logger.js');
const dotenv = require('dotenv');

// Load .env file
const envPath = app.isPackaged
  ? path.join(process.resourcesPath, '.env')
  : path.join(__dirname, '../../../../../.env');

try {
  dotenv.config({ path: envPath });
  logger.info(`[Issues] Loaded .env from: ${envPath}`);
} catch (error) {
  logger.warn(`[Issues] Failed to load .env: ${error.message}`);
}

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
      logger.info(`Issue created: ${newIssue.id} - ${issue.title}`);
      
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
    logger.warn('RESEND_API_KEY not set, skipping email');
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
    
    const templatePath = path.join(__dirname, '../templates/email/issue-report.html');
    let html = await fs.readFile(templatePath, 'utf-8');
    
    html = html.replace('{{badge_color}}', badgeColors[issue.issue_type] || '#6b7280');
    html = html.replace('{{issue_type}}', issue.issue_type.toUpperCase());
    html = html.replace('{{title}}', issue.title);
    html = html.replace('{{description}}', issue.description);
    html = html.replace('{{os}}', env.os || 'Unknown');
    html = html.replace('{{version}}', env.version || 'Unknown');
    html = html.replace('{{issue_id}}', issue.id);
    html = html.replace('{{created_at}}', createdAt + ' UTC');
    
    await resend.emails.send({
      from: `DB Toolkit <${fromEmail}>`,
      to: [issueEmail],
      subject: `[${issue.issue_type.toUpperCase()}] ${issue.title}`,
      html
    });
    
    logger.info(`Issue email sent for ${issue.id}`);
  } catch (error) {
    logger.error('Email sending failed:', error);
  }
}

module.exports = { registerIssuesHandlers };
