"""Issue schemas."""

from datetime import datetime
from typing import Optional, Dict
from pydantic import BaseModel


class IssueCreate(BaseModel):
    """Schema for creating an issue."""
    title: str
    description: str
    issue_type: str
    environment: Optional[Dict] = None


class IssueResponse(BaseModel):
    """Schema for issue response."""
    id: str
    title: str
    description: str
    issue_type: str
    environment: Optional[Dict]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True
