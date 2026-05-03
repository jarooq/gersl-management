import React, { useState, useMemo } from 'react';
import { formatDeadlineDisplay, calculateDeadlineStatus } from '../../utils/deadlineMonitor';

/**
 * GanttChart Component
 * Displays project tasks in a visual timeline format
 */
const GanttChart = ({ project, onTaskClick }) => {
  const [viewMode, setViewMode] = useState('month'); // 'week', 'month', 'quarter'
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate date range for the chart
  const dateRange = useMemo(() => {
    const start = new Date(project.startDate || new Date());
    const end = new Date(project.endDate || new Date());

    // Extend range to show full view
    if (viewMode === 'week') {
      start.setDate(start.getDate() - 7);
      end.setDate(end.getDate() + 7);
    } else if (viewMode === 'month') {
      start.setMonth(start.getMonth() - 1);
      end.setMonth(end.getMonth() + 1);
    } else {
      start.setMonth(start.getMonth() - 3);
      end.setMonth(end.getMonth() + 3);
    }

    return { start, end };
  }, [project.startDate, project.endDate, viewMode]);

  // Generate timeline columns
  const timelineColumns = useMemo(() => {
    const columns = [];
    const { start, end } = dateRange;
    const current = new Date(start);

    if (viewMode === 'week') {
      while (current <= end) {
        columns.push({
          date: new Date(current),
          label: `${current.getDate()}`,
          fullLabel: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
        current.setDate(current.getDate() + 1);
      }
    } else if (viewMode === 'month') {
      while (current <= end) {
        columns.push({
          date: new Date(current),
          label: current.getDate() === 1 ? current.toLocaleDateString('en-US', { month: 'short' }) : '',
          fullLabel: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          isMonthStart: current.getDate() === 1
        });
        current.setDate(current.getDate() + 7); // Weekly columns in month view
      }
    } else {
      while (current <= end) {
        columns.push({
          date: new Date(current),
          label: current.toLocaleDateString('en-US', { month: 'short' }),
          fullLabel: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          isMonthStart: true
        });
        current.setMonth(current.getMonth() + 1);
      }
    }

    return columns;
  }, [dateRange, viewMode]);

  // Calculate task bar position and width
  const calculateTaskBar = (task) => {
    if (!task.startDate || !task.deadline) {
      return null;
    }

    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.deadline);
    const { start, end } = dateRange;

    // Calculate position as percentage
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const startOffset = Math.ceil((taskStart - start) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((taskEnd - taskStart) / (1000 * 60 * 60 * 24));

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return {
      left: Math.max(0, left),
      width: Math.max(2, Math.min(width, 100 - left)), // Minimum 2% width
      startOffset,
      duration
    };
  };

  // Get status color
  const getStatusColor = (task) => {
    if (task.status === 'Completed') return 'bg-green-500';
    if (task.status === 'Cancelled') return 'bg-ink-400';
    if (task.status === 'In Progress') return 'bg-blue-500';

    // Check if overdue
    if (task.deadline) {
      const deadlineStatus = calculateDeadlineStatus(task.deadline);
      if (deadlineStatus.status === 'overdue') return 'bg-red-500';
      if (deadlineStatus.status === 'due_today' || deadlineStatus.status === 'due_tomorrow') return 'bg-orange-500';
    }

    return 'bg-ink-300';
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
    const badges = {
      'Critical': <span className="px-1 py-0.5 text-xs bg-red-100 text-red-700 rounded">Critical</span>,
      'High': <span className="px-1 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">High</span>,
      'Medium': <span className="px-1 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">Medium</span>,
      'Low': <span className="px-1 py-0.5 text-xs bg-green-100 text-green-700 rounded">Low</span>
    };
    return badges[priority] || null;
  };

  // Get today marker position
  const getTodayPosition = () => {
    const today = new Date();
    const { start, end } = dateRange;
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const daysFromStart = Math.ceil((today - start) / (1000 * 60 * 60 * 24));
    return (daysFromStart / totalDays) * 100;
  };

  const tasks = project.tasks || [];
  const tasksWithDates = tasks.filter(t => t.startDate && t.deadline);

  if (tasksWithDates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-ink-500">
          <p className="text-lg font-medium mb-2">No Tasks with Timelines</p>
          <p className="text-sm">Add tasks with start dates and deadlines to see the Gantt chart.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b border-ink-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-ink-800">Project Timeline</h3>

        {/* View Mode Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('quarter')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'quarter'
                ? 'bg-blue-600 text-white'
                : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
            }`}
          >
            Quarter
          </button>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Timeline Header */}
          <div className="flex border-b border-ink-200 bg-ink-50">
            <div className="w-64 p-2 border-r border-ink-200 font-semibold text-sm text-ink-700">
              Task Name
            </div>
            <div className="flex-1 relative">
              <div className="flex h-10">
                {timelineColumns.map((col, index) => (
                  <div
                    key={index}
                    className={`flex-1 px-1 py-2 text-xs text-center border-r border-ink-200 ${
                      col.isMonthStart ? 'font-semibold' : ''
                    }`}
                    title={col.fullLabel}
                  >
                    {col.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className="relative">
            {tasksWithDates.map((task, taskIndex) => {
              const barData = calculateTaskBar(task);

              if (!barData) return null;

              return (
                <div
                  key={task.id}
                  className="flex border-b border-ink-100 hover:bg-ink-50 transition-colors"
                >
                  {/* Task Info */}
                  <div className="w-64 p-2 border-r border-ink-200">
                    <div className="text-sm font-medium text-ink-800 truncate" title={task.name || task.title}>
                      {task.name || task.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {getPriorityBadge(task.priority)}
                      <span className="text-xs text-ink-500">
                        {task.assignees?.length > 0 && `${task.assignees.length} assigned`}
                      </span>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="flex-1 relative h-12 p-1">
                    {/* Task Bar */}
                    <div
                      className={`absolute top-2 h-6 rounded ${getStatusColor(task)} opacity-80 hover:opacity-100 cursor-pointer transition-opacity`}
                      style={{
                        left: `${barData.left}%`,
                        width: `${barData.width}%`
                      }}
                      onClick={() => onTaskClick && onTaskClick(task)}
                      title={`${task.name || task.title}\n${task.startDate} - ${task.deadline}\nStatus: ${task.status}\nProgress: ${task.progress}%`}
                    >
                      <div className="px-2 py-0.5 text-xs text-white font-medium truncate">
                        {task.progress}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Today Marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none"
              style={{ left: `calc(256px + ${getTodayPosition()}%)` }}
            >
              <div className="absolute -top-2 -left-6 bg-red-500 text-white text-xs px-2 py-0.5 rounded">
                Today
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="p-4 bg-ink-50 border-t border-ink-200">
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span>Due Soon</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Overdue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-ink-300 rounded"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-ink-400 rounded"></div>
                <span>Cancelled</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="p-4 bg-white border-t border-ink-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-ink-500">Total Tasks</div>
            <div className="text-lg font-semibold text-ink-800">{tasksWithDates.length}</div>
          </div>
          <div>
            <div className="text-ink-500">In Progress</div>
            <div className="text-lg font-semibold text-blue-600">
              {tasksWithDates.filter(t => t.status === 'In Progress').length}
            </div>
          </div>
          <div>
            <div className="text-ink-500">Completed</div>
            <div className="text-lg font-semibold text-green-600">
              {tasksWithDates.filter(t => t.status === 'Completed').length}
            </div>
          </div>
          <div>
            <div className="text-ink-500">Overdue</div>
            <div className="text-lg font-semibold text-red-600">
              {tasksWithDates.filter(t => {
                const today = new Date().toISOString().split('T')[0];
                return t.deadline < today && t.status !== 'Completed' && t.status !== 'Cancelled';
              }).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
