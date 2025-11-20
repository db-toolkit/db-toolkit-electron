import { memo, useMemo, useCallback, useState, useRef } from 'react';

const VirtualizedList = memo(function VirtualizedList({ 
  items, 
  itemHeight = 40, 
  containerHeight = 400, 
  renderItem, 
  className = "" 
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  const BUFFER_SIZE = 5;
  
  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - BUFFER_SIZE);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + (BUFFER_SIZE * 2);
    const end = Math.min(items.length, start + visibleCount);
    return { start, end };
  }, [scrollTop, items.length, itemHeight, containerHeight]);
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange]);
  
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);
  
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;
  
  return (
    <div 
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, idx) => (
            <div key={visibleRange.start + idx} style={{ height: itemHeight }}>
              {renderItem(item, visibleRange.start + idx)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export { VirtualizedList };