/**
 * Status bar showing system metrics and app info.
 */
import { useState, useEffect } from 'react';


import { useConnections } from '../../hooks';

function StatusBar() {
  const { connections, connectedIds } = useConnections();
  const [hoveredMetric, setHoveredMetric] = useState(null);
  const [metrics, setMetrics] = useState({
    ram: { used: 0, total: 0 },
    cpu: 0,
    load: 0,
    disk: { used: 0, free: 0, total: 0 },
    uptime: 0
  });

  useEffect(() => {
    const updateMetrics = () => {
      if (window.performance && window.performance.memory) {
        const used = window.performance.memory.usedJSHeapSize / 1024 / 1024;
        const total = window.performance.memory.totalJSHeapSize / 1024 / 1024;
        setMetrics(prev => ({ ...prev, ram: { used, total } }));
      }
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let lastTime = Date.now();
    let lastUsage = 0;

    const updateSystemMetrics = async () => {
      if (window.performance && window.performance.memory) {
        const now = Date.now();
        const currentUsage = window.performance.memory.usedJSHeapSize;
        const timeDiff = now - lastTime;
        const usageDiff = Math.abs(currentUsage - lastUsage);
        
        const cpuPercent = Math.min(100, (usageDiff / timeDiff) * 0.01);
        
        lastTime = now;
        lastUsage = currentUsage;
        
        if (window.electron && window.electron.getSystemMetrics) {
          try {
            const systemMetrics = await window.electron.getSystemMetrics();
            setMetrics(prev => ({ 
              ...prev, 
              cpu: cpuPercent.toFixed(1),
              load: systemMetrics.loadAvg.toFixed(1),
              disk: systemMetrics.disk
            }));
          } catch (err) {
            setMetrics(prev => ({ 
              ...prev, 
              cpu: cpuPercent.toFixed(1)
            }));
          }
        } else {
          setMetrics(prev => ({ 
            ...prev, 
            cpu: cpuPercent.toFixed(1)
          }));
        }
      }
    };

    updateSystemMetrics();
    const interval = setInterval(updateSystemMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const startTime = Date.now();
    const updateUptime = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setMetrics(prev => ({ ...prev, uptime: elapsed }));
    };

    updateUptime();
    const interval = setInterval(updateUptime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds) => {
    const m = Math.floor(seconds / 60);
    return m > 0 ? `${m}m` : `${seconds}s`;
  };

  const formatBytes = (bytes) => bytes.toFixed(1);

  const diskUsagePercent = metrics.disk.total > 0 
    ? ((metrics.disk.used / metrics.disk.total) * 100).toFixed(1)
    : 0;

  return (
    <div className="relative h-8 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 text-xs text-gray-600 dark:text-gray-400">
      <div className="flex items-center">
      <div className="relative"
        onMouseEnter={() => setHoveredMetric('connections')}
        onMouseLeave={() => setHoveredMetric(null)}
      >
        <span className="hover:text-gray-900 dark:hover:text-gray-200 cursor-default">
          Connections {connections.length}
        </span>
        {hoveredMetric === 'connections' && (
          <div className="absolute bottom-full left-0 mb-2 p-3 bg-gray-800 dark:bg-gray-950 text-white rounded-lg shadow-lg text-xs whitespace-nowrap z-50">
            <div className="font-semibold mb-1">Database Connections</div>
            <div>Total: {connections.length}</div>
            <div>Active: {connectedIds.size}</div>
            <div>Inactive: {connections.length - connectedIds.size}</div>
          </div>
        )}
      </div>
      
      <span className="mx-2">|</span>
      
      <div className="relative"
        onMouseEnter={() => setHoveredMetric('ram')}
        onMouseLeave={() => setHoveredMetric(null)}
      >
        <span className="hover:text-gray-900 dark:hover:text-gray-200 cursor-default">
          RAM {formatBytes(metrics.ram.used)} MB
        </span>
        {hoveredMetric === 'ram' && (
          <div className="absolute bottom-full left-0 mb-2 p-3 bg-gray-800 dark:bg-gray-950 text-white rounded-lg shadow-lg text-xs whitespace-nowrap z-50">
            <div className="font-semibold mb-1">App Memory Usage</div>
            <div>Used: {formatBytes(metrics.ram.used)} MB</div>
            <div>Includes: Main + Renderer processes</div>
          </div>
        )}
      </div>
      
      <span className="mx-2">|</span>
      
      <div className="relative"
        onMouseEnter={() => setHoveredMetric('cpu')}
        onMouseLeave={() => setHoveredMetric(null)}
      >
        <span className="hover:text-gray-900 dark:hover:text-gray-200 cursor-default">
          CPU {metrics.cpu}%
        </span>
        {hoveredMetric === 'cpu' && (
          <div className="absolute bottom-full left-0 mb-2 p-3 bg-gray-800 dark:bg-gray-950 text-white rounded-lg shadow-lg text-xs whitespace-nowrap z-50">
            <div className="font-semibold mb-1">CPU Usage</div>
            <div>Current: {metrics.cpu}%</div>
            <div>Process: Main + Renderer</div>
          </div>
        )}
      </div>
      
      <span className="mx-2">|</span>
      
      <div className="relative"
        onMouseEnter={() => setHoveredMetric('load')}
        onMouseLeave={() => setHoveredMetric(null)}
      >
        <span className="hover:text-gray-900 dark:hover:text-gray-200 cursor-default">
          Load {metrics.load}
        </span>
        {hoveredMetric === 'load' && (
          <div className="absolute bottom-full left-0 mb-2 p-3 bg-gray-800 dark:bg-gray-950 text-white rounded-lg shadow-lg text-xs whitespace-nowrap z-50">
            <div className="font-semibold mb-1">System Load</div>
            <div>Average: {metrics.load}</div>
            <div>Status: {parseFloat(metrics.load) < 1 ? 'Normal' : 'High'}</div>
          </div>
        )}
      </div>
      
      <span className="mx-2">|</span>
      
      <div className="relative"
        onMouseEnter={() => setHoveredMetric('disk')}
        onMouseLeave={() => setHoveredMetric(null)}
      >
        <span className="hover:text-gray-900 dark:hover:text-gray-200 cursor-default">
          {formatBytes(metrics.disk.used)} GB / {formatBytes(metrics.disk.total)} GB
        </span>
        {hoveredMetric === 'disk' && (
          <div className="absolute bottom-full left-0 mb-2 p-3 bg-gray-800 dark:bg-gray-950 text-white rounded-lg shadow-lg text-xs whitespace-nowrap z-50">
            <div className="font-semibold mb-1">Disk Usage</div>
            <div>Used: {formatBytes(metrics.disk.used)} GB</div>
            <div>Free: {formatBytes(metrics.disk.free)} GB</div>
            <div>Total: {formatBytes(metrics.disk.total)} GB</div>
            <div>Usage: {diskUsagePercent}%</div>
          </div>
        )}
      </div>
      
      <span className="mx-2">|</span>
      
      <div className="relative"
        onMouseEnter={() => setHoveredMetric('uptime')}
        onMouseLeave={() => setHoveredMetric(null)}
      >
        <span className="hover:text-gray-900 dark:hover:text-gray-200 cursor-default">
          {formatUptime(metrics.uptime)}
        </span>
        {hoveredMetric === 'uptime' && (
          <div className="absolute bottom-full left-0 mb-2 p-3 bg-gray-800 dark:bg-gray-950 text-white rounded-lg shadow-lg text-xs whitespace-nowrap z-50">
            <div className="font-semibold mb-1">Application Uptime</div>
            <div>Running: {formatUptime(metrics.uptime)}</div>
            <div>Started: {new Date(Date.now() - metrics.uptime * 1000).toLocaleTimeString()}</div>
          </div>
        )}
      </div>
      </div>
      

    </div>
  );
}

export default StatusBar;
