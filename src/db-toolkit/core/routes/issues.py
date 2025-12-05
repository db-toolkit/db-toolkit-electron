"""Issue management routes."""

import uuid
import os
from datetime import datetime
from typing import List
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
        env_info = issue.get('environment', {})
        email_body = f"""
        <h2>New Issue Reported: {issue['title']}</h2>
        <p><strong>Type:</strong> {issue['issue_type']}</p>
        <p><strong>Description:</strong></p>
        <p>{issue['description']}</p>
        <hr>
        <p><strong>Environment:</strong></p>
        <ul>
            <li>OS: {env_info.get('os', 'Unknown')}</li>
            <li>Version: {env_info.get('version', 'Unknown')}</li>
            <li>User Agent: {env_info.get('user_agent', 'Unknown')}</li>
        </ul>
        <p><strong>Issue ID:</strong> {issue['id']}</p>
        <p><strong>Created:</strong> {issue['created_at']}</p>
        """
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://api.resend.com/emails',
                headers={
                    'Authorization': f'Bearer {resend_api_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'from': 'DB Toolkit <issues@yourdomain.com>',
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
