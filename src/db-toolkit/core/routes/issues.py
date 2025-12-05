"""Issue management routes."""

import uuid
import os
from datetime import datetime
from typing import List
from pathlib import Path
from fastapi import APIRouter, HTTPException
import httpx

from core.schemas.issue import IssueCreate, IssueResponse
from utils.logger import logger

router = APIRouter()

# In-memory storage (replace with database in production)
issues_db = []


@router.post("/issues", response_model=IssueResponse)
async def create_issue(issue: IssueCreate):
    """Create a new issue."""
    try:
        new_issue = {
            "id": str(uuid.uuid4()),
            "title": issue.title,
            "description": issue.description,
            "issue_type": issue.issue_type,
            "environment": issue.environment,
            "status": "open",
            "created_at": datetime.utcnow()
        }
        
        issues_db.append(new_issue)
        logger.info(f"Issue created: {new_issue['id']} - {issue.title}")
        
        # Send email via Resend
        await send_issue_email(new_issue)
        
        return new_issue
    except Exception as e:
        logger.error(f"Failed to create issue: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create issue")


async def send_issue_email(issue: dict):
    """Send issue notification email via Resend."""
    resend_api_key = os.getenv('RESEND_API_KEY')
    if not resend_api_key:
        logger.warning("RESEND_API_KEY not set, skipping email")
        return
    
    try:
        # Load email template
        template_path = Path(__file__).parent.parent.parent / 'templates' / 'email' / 'issue_report.html'
        with open(template_path, 'r') as f:
            template = f.read()
        
        # Badge colors for issue types
        badge_colors = {
            'bug': '#ef4444',
            'feature': '#f59e0b',
            'question': '#3b82f6',
            'documentation': '#10b981'
        }
        
        env_info = issue.get('environment', {})
        
        # Replace template variables
        email_body = template.replace('{{ issue_type }}', issue['issue_type'].upper())
        email_body = email_body.replace('{{ badge_color }}', badge_colors.get(issue['issue_type'], '#6b7280'))
        email_body = email_body.replace('{{ title }}', issue['title'])
        email_body = email_body.replace('{{ description }}', issue['description'])
        email_body = email_body.replace('{{ os }}', env_info.get('os', 'Unknown'))
        email_body = email_body.replace('{{ version }}', env_info.get('version', 'Unknown'))
        email_body = email_body.replace('{{ issue_id }}', issue['id'])
        email_body = email_body.replace('{{ created_at }}', issue['created_at'].strftime('%B %d, %Y at %I:%M %p UTC'))
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://api.resend.com/emails',
                headers={
                    'Authorization': f'Bearer {resend_api_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'from': os.getenv('EMAIL_FROM', 'DB Toolkit <issues@yourdomain.com>'),
                    'to': [os.getenv('ISSUE_EMAIL', 'your-email@example.com')],
                    'subject': f'[{issue["issue_type"].upper()}] {issue["title"]}',
                    'html': email_body
                }
            )
            
            if response.status_code == 200:
                logger.info(f"Issue email sent for {issue['id']}")
            else:
                logger.error(f"Failed to send email: {response.text}")
    except Exception as e:
        logger.error(f"Email sending failed: {str(e)}")


@router.get("/issues", response_model=List[IssueResponse])
async def get_issues():
    """Get all issues."""
    return issues_db


@router.get("/issues/{issue_id}", response_model=IssueResponse)
async def get_issue(issue_id: str):
    """Get issue by ID."""
    issue = next((i for i in issues_db if i["id"] == issue_id), None)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue


@router.patch("/issues/{issue_id}/status")
async def update_issue_status(issue_id: str, status: str):
    """Update issue status."""
    issue = next((i for i in issues_db if i["id"] == issue_id), None)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    issue["status"] = status
    return issue


@router.delete("/issues/{issue_id}")
async def delete_issue(issue_id: str):
    """Delete an issue."""
    global issues_db
    issues_db = [i for i in issues_db if i["id"] != issue_id]
    return {"success": True}
