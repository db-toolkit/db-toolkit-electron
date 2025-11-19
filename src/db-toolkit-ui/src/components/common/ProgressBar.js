/**
 * Progress bar component
 */

export function ProgressBar({ progress, label, showPercentage = true, size = 'md', variant = 'primary' }) {
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const variants = {
    primary: 'bg-blue-600 dark:bg-blue-500',
    success: 'bg-green-600 dark:bg-green-500',
    warning: 'bg-yellow-600 dark:bg-yellow-500',
    danger: 'bg-red-600 dark:bg-red-500',
  };

  const percentage = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`${sizes[size]} ${variants[variant]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
