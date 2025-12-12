export const workspacesData = {
  title: "Workspaces",
  sections: [
    {
      heading: "Overview",
      content: `Workspaces allow you to work with multiple database connections simultaneously in isolated tabs. Each workspace maintains its own state including connection, queries, and active page.`
    },
    {
      heading: "Creating Workspaces",
      content: `**Create New Workspace:**
- Click the **"+"** button in the titlebar
- Or press **Cmd/Ctrl + T**
- A default workspace is created automatically on first launch

**Workspace Limit:**
- Default: 10 workspaces
- Configurable: 1-20 in Settings
- Warning shown when >10 (RAM impact)`
    },
    {
      heading: "Switching Workspaces",
      content: `**Switch Between Workspaces:**
- Click workspace tab in titlebar
- Use **Cmd/Ctrl + 1-9** to switch to workspace 1-9
- Each workspace remembers its active page

**Visual Indicators:**
- Active workspace highlighted in green
- Unsaved changes shown with orange dot
- Custom colors for easy identification`
    },
    {
      heading: "Workspace Management",
      content: `**Right-Click Context Menu:**
- **Rename** - Give workspace a custom name
- **Change Color** - Choose from 17 colors
- **Close** - Close current workspace
- **Close Others** - Close all except current
- **Close All** - Close all workspaces

**Close Workspace:**
- Click **X** button on tab
- Or press **Cmd/Ctrl + W**
- Warning if unsaved changes exist`
    },
    {
      heading: "Workspace State",
      content: `**Each Workspace Maintains:**
- Database connection
- Active page (Query Editor, Analytics, etc.)
- Query tabs and content
- Schema cache
- Unsaved changes status

**Persistence:**
- Workspaces saved automatically
- State persists across app restarts
- Stored in \`~/.db-toolkit/workspaces/\``
    },
    {
      heading: "Keyboard Shortcuts",
      content: `**Workspace Shortcuts:**
- **Cmd/Ctrl + T** - Create new workspace
- **Cmd/Ctrl + W** - Close current workspace
- **Cmd/Ctrl + 1-9** - Switch to workspace 1-9

**Quick Navigation:**
- Use number shortcuts for fast switching
- Combine with other shortcuts for efficiency`
    },
    {
      heading: "Workspace Settings",
      content: `**Configure Workspaces:**
1. Open **Settings** (Cmd/Ctrl + ,)
2. Navigate to **Workspace** tab
3. Configure options:
   - **Enable Workspaces** - Toggle feature on/off
   - **Max Workspaces** - Set limit (1-20)

**Max Workspaces Slider:**
- Green (1-10) - Recommended range
- Yellow (11-15) - Moderate RAM usage
- Red (16-20) - High RAM usage
- Warning shown when >10`
    },
    {
      heading: "Unsaved Changes",
      content: `**Tracking Unsaved Changes:**
- Orange dot appears on workspace tab
- Tracks unsaved queries per workspace
- Warning before closing with unsaved changes

**Saving Changes:**
- Execute query to mark as saved
- Or manually save with Cmd/Ctrl + S
- Indicator clears when all queries saved`
    },
    {
      heading: "Custom Colors",
      content: `**17 Available Colors:**
- Red, Orange, Amber, Yellow, Lime
- Green, Emerald, Teal, Cyan, Sky
- Blue, Indigo, Violet, Purple, Fuchsia
- Pink, Rose

**Color Usage:**
- Right-click workspace tab
- Select "Change Color"
- Choose from color palette
- Use colors to organize workspaces by:
  - Environment (dev/staging/prod)
  - Database type
  - Project
  - Priority`
    },
    {
      heading: "Tips & Best Practices",
      content: `**Workspace Organization:**
- Use different workspaces for different databases
- Color-code by environment (green=dev, yellow=staging, red=prod)
- Keep related work in same workspace
- Close unused workspaces to free RAM
- Rename workspaces for easy identification

**Performance:**
- Limit to 10 workspaces for optimal performance
- Close workspaces when not in use
- Each workspace uses memory for state
- Monitor RAM usage with many workspaces

**Workflow Tips:**
- Create workspace per project
- Use keyboard shortcuts for quick switching
- Keep production in separate workspace
- Save queries before switching workspaces`
    },
    {
      heading: "When Workspaces Disabled",
      content: `**Disabling Workspaces:**
- Navigate to Settings → Workspace
- Toggle "Enable Workspaces" off
- Requires app restart to apply

**Single Connection Mode:**
- Titlebar shows "DB Toolkit" instead of tabs
- No workspace isolation
- Single connection at a time
- Simpler interface for basic usage`
    }
  ]
};
