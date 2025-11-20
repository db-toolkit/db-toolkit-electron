import { memo, useMemo, useCallback, useState, useRef } from 'react';

const VirtualizedTableRow = memo(function VirtualizedTableRow({ row, columns, style, index }) {
  return (
    <div 
      style={style} 
      className={`flex border-b border-gray-200 dark:border-gray-700 ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'} hover:bg-blue-50 dark:hover:bg-blue-900/20`}
    >
      {row.map((cell, cellIdx) => (
        <div 
          key={cellIdx} 
          className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 flex-1 min-w-0 truncate"
          title={cell !== null ? String(cell) : 'NULL'}
        >
          {cell !== null ? String(cell) : (
            <span className="text-gray-400 dark:text-gray-500 italic">NULL</span>
          )}
        </div>
      ))}
    </div>
  );
});

const VirtualizedTable = memo(function VirtualizedTable({ rows, columns }) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  const ROW_HEIGHT = 48;
  const CONTAINER_HEIGHT = 400;
  const BUFFER_SIZE = 5;
  
  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_SIZE);
    const visibleCount = Math.ceil(CONTAINER_HEIGHT / ROW_HEIGHT) + (BUFFER_SIZE * 2);
    const end = Math.min(rows.length, start + visibleCount);
    return { start, end };
  }, [scrollTop, rows.length]);
  
  const visibleRows = useMemo(() => {
    return rows.slice(visibleRange.start, visibleRange.end);
  }, [rows, visibleRange]);
  
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);
  
  const totalHeight = rows.length * ROW_HEIGHT;
  const offsetY = visibleRange.start * ROW_HEIGHT;
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex">
        {columns.map((col) => (
          <div
            key={col}
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex-1 min-w-0"
          >
            {col}
          </div>
        ))}
      </div>
      
      {/* Virtualized Body */}
      <div 
        ref={containerRef}
        className="overflow-auto"
        style={{ height: CONTAINER_HEIGHT }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleRows.map((row, idx) => (
              <VirtualizedTableRow
                key={visibleRange.start + idx}
                row={row}
                columns={columns}
                index={visibleRange.start + idx}
                style={{ height: ROW_HEIGHT }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

const RegularTable = memo(function RegularTable({ rows, columns }) {
  return (
    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {rows.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {cell !== null ? String(cell) : (
                    <span className="text-gray-400 dark:text-gray-500 italic">NULL</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

const ResultsTable = memo(function ResultsTable({ result }) {
  const shouldVirtualize = useMemo(() => {
    return result?.rows?.length > 100;
  }, [result?.rows?.length]);
  
  const memoizedColumns = useMemo(() => result?.columns || [], [result?.columns]);
  const memoizedRows = useMemo(() => result?.rows || [], [result?.rows]);
  
  if (!result || !result.rows) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          Results ({result.total_rows} rows)
        </h3>
        <div className="flex items-center gap-4">
          {shouldVirtualize && (
            <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
              Virtualized
            </span>
          )}
          <span className="text-sm text-gray-600">
            Execution time: {result.execution_time?.toFixed(2)}s
          </span>
        </div>
      </div>

      {shouldVirtualize ? (
        <VirtualizedTable rows={memoizedRows} columns={memoizedColumns} />
      ) : (
        <RegularTable rows={memoizedRows} columns={memoizedColumns} />
      )}
    </div>
  );
});

export { ResultsTable };
