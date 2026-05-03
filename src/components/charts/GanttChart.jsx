import React, { useMemo } from 'react';
import { Calendar, Flag, User } from 'lucide-react';

const GanttChart = ({ tasks }) => {
  // Calculate the date range for the Gantt chart
  const { startDate, endDate, totalDays } = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      const today = new Date();
      return {
        startDate: today,
        endDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
        totalDays: 30
      };
    }

    const dates = tasks
      .filter(task => task.startDate || task.dueDate)
      .flatMap(task => [
        task.startDate ? new Date(task.startDate) : null,
        task.dueDate ? new Date(task.dueDate) : null
      ])
      .filter(Boolean);

    if (dates.length === 0) {
      const today = new Date();
      return {
        startDate: today,
        endDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
        totalDays: 30
      };
    }

    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    // Add padding
    const padding = 3 * 24 * 60 * 60 * 1000; // 3 days
    const start = new Date(minDate.getTime() - padding);
    const end = new Date(maxDate.getTime() + padding);

    const days = Math.ceil((end - start) / (24 * 60 * 60 * 1000));

    return {
      startDate: start,
      endDate: end,
      totalDays: days
    };
  }, [tasks]);

  // Generate month labels
  const months = useMemo(() => {
    const result = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const monthStart = new Date(current);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      const displayEnd = monthEnd > end ? end : monthEnd;

      const daysInMonth = Math.ceil((displayEnd - monthStart) / (24 * 60 * 60 * 1000)) + 1;
      const percentage = (daysInMonth / totalDays) * 100;

      result.push({
        label: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        percentage,
        days: daysInMonth
      });

      current.setMonth(current.getMonth() + 1);
      current.setDate(1);
    }

    return result;
  }, [startDate, endDate, totalDays]);

  const getTaskPosition = (task) => {
    const taskStart = task.startDate ? new Date(task.startDate) : new Date();
    const taskEnd = task.dueDate ? new Date(task.dueDate) : new Date(taskStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const offsetDays = Math.max(0, (taskStart - startDate) / (24 * 60 * 60 * 1000));
    const durationDays = Math.max(1, (taskEnd - taskStart) / (24 * 60 * 60 * 1000));

    const left = (offsetDays / totalDays) * 100;
    const width = (durationDays / totalDays) * 100;

    return { left: `${left}%`, width: `${Math.max(width, 2)}%` };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-500';
      case 'In Progress': return 'bg-blue-500';
      case 'Pending': return 'bg-ink-400';
      case 'On Hold': return 'bg-yellow-500';
      default: return 'bg-ink-400';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-500';
      case 'Medium': return 'text-yellow-500';
      case 'Low': return 'text-green-500';
      default: return 'text-ink-500';
    }
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-ink-500">
        <Calendar size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-medium">No tasks to display</p>
        <p className="text-sm">Create tasks to see them in the timeline</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ink-900">Project Timeline</h3>
        <div className="flex items-center gap-4 text-sm text-ink-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-ink-400 rounded"></div>
            <span>Pending</span>
          </div>
        </div>
      </div>

      {/* Gantt Chart Container */}
      <div className="border border-ink-200 rounded-lg overflow-hidden">
        {/* Timeline Header */}
        <div className="bg-ink-50 border-b border-ink-200">
          <div className="flex">
            <div className="w-64 px-4 py-3 font-semibold text-sm text-ink-700 border-r border-ink-200">
              Task
            </div>
            <div className="flex-1 flex">
              {months.map((month, idx) => (
                <div
                  key={idx}
                  style={{ width: `${month.percentage}%` }}
                  className="px-2 py-3 text-center text-sm font-semibold text-ink-700 border-r border-ink-200"
                >
                  {month.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="divide-y divide-ink-200">
          {tasks.map((task) => {
            const position = getTaskPosition(task);

            return (
              <div key={task.id} className="flex hover:bg-ink-50 transition">
                {/* Task Info */}
                <div className="w-64 px-4 py-3 border-r border-ink-200">
                  <div className="flex items-start gap-2">
                    <Flag size={14} className={`mt-0.5 flex-shrink-0 ${getPriorityColor(task.priority)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate" title={task.title}>
                        {task.title}
                      </p>
                      {task.assignee && (
                        <div className="flex items-center gap-1 mt-1">
                          <User size={12} className="text-ink-400" />
                          <p className="text-xs text-ink-500 truncate">
                            {task.assignee.fullName || task.assignee.username}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline Bar */}
                <div className="flex-1 relative py-3 px-2">
                  <div className="relative h-8">
                    {/* Background grid */}
                    <div className="absolute inset-0 flex">
                      {months.map((month, idx) => (
                        <div
                          key={idx}
                          style={{ width: `${month.percentage}%` }}
                          className="border-r border-ink-100"
                        />
                      ))}
                    </div>

                    {/* Task bar */}
                    <div
                      className={`absolute h-6 top-1 rounded ${getStatusColor(task.status)} shadow-sm flex items-center justify-center`}
                      style={position}
                    >
                      <span className="text-white text-xs font-medium px-2 truncate">
                        {task.progress}%
                      </span>
                    </div>

                    {/* Today marker */}
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (today >= startDate && today <= endDate) {
                        const todayOffset = (today - startDate) / (24 * 60 * 60 * 1000);
                        const todayPosition = (todayOffset / totalDays) * 100;
                        return (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                            style={{ left: `${todayPosition}%` }}
                            title="Today"
                          />
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between text-sm text-ink-600 pt-2">
        <div>
          Showing {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </div>
        <div>
          {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
