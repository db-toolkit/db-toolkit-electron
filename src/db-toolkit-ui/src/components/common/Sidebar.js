import React from 'react';
import { Link } from 'react-router-dom';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>DB Toolkit</h1>
      </div>
      <nav className="sidebar-nav">
        <Link to="/" className="nav-item">
          Connections
        </Link>
      </nav>
    </aside>
  );
}

export default Sidebar;
