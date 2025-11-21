"""Migrator API routes."""
from fastapi import APIRouter
from pydantic import BaseModel
from operations.migrator_executor import MigratorExecutor

router = APIRouter()


class MigratorCommand(BaseModel):
    command: str


@router.post("/execute")
async def execute_migrator_command(cmd: MigratorCommand):
    """Execute migrator CLI command."""
    return await MigratorExecutor.execute_command(cmd.command)


@router.get("/version")
async def get_migrator_version():
    """Get migrator CLI version."""
    return await MigratorExecutor.get_version()
