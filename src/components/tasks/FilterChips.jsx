import React from 'react';
import { X } from 'lucide-react';

/**
 * Filter Chips Component
 * Displays active filters as removable chips
 * Allows quick filter management
 */
const FilterChips = ({ filters, onRemoveFilter, onClearAll }) => {
  // Generate chips from active filters
  const chips = [];

  // Status chips
  if (filters.status && filters.status.length > 0) {
    filters.status.forEach(status => {
      chips.push({
        id: `status-${status}`,
        label: `Status: ${status}`,
        color: 'bg-blue-100 text-blue-800',
        onRemove: () => onRemoveFilter('status', status)
      });
    });
  }

  // Priority chips
  if (filters.priority && filters.priority.length > 0) {
    filters.priority.forEach(priority => {
      const colorClass =
        priority === 'High' || priority === 'Urgent'
          ? 'bg-red-100 text-red-800'
          : priority === 'Medium'
          ? 'bg-orange-100 text-orange-800'
          : 'bg-green-100 text-green-800';

      chips.push({
        id: `priority-${priority}`,
        label: `Priority: ${priority}`,
        color: colorClass,
        onRemove: () => onRemoveFilter('priority', priority)
      });
    });
  }

  // Date range chip
  if (filters.dateFrom || filters.dateTo) {
    const dateLabel = filters.dateFrom && filters.dateTo
      ? `${filters.dateFrom} to ${filters.dateTo}`
      : filters.dateFrom
      ? `From ${filters.dateFrom}`
      : `Until ${filters.dateTo}`;

    chips.push({
      id: 'date-range',
      label: `Due: ${dateLabel}`,
      color: 'bg-purple-100 text-purple-800',
      onRemove: () => {
        onRemoveFilter('dateFrom', '');
        onRemoveFilter('dateTo', '');
      }
    });
  }

  // Project chips
  if (filters.project && filters.project.length > 0) {
    filters.project.forEach((projectId) => {
      chips.push({
        id: `project-${projectId}`,
        label: `Project: ${projectId}`,
        color: 'bg-indigo-100 text-indigo-800',
        onRemove: () => onRemoveFilter('project', projectId)
      });
    });
  }

  // Assignee chips
  if (filters.assignee && filters.assignee.length > 0) {
    filters.assignee.forEach((assigneeId) => {
      chips.push({
        id: `assignee-${assigneeId}`,
        label: `Assignee: ${assigneeId}`,
        color: 'bg-teal-100 text-teal-800',
        onRemove: () => onRemoveFilter('assignee', assigneeId)
      });
    });
  }

  // Search term chip
  if (filters.searchTerm) {
    chips.push({
      id: 'search',
      label: `Search: "${filters.searchTerm}"`,
      color: 'bg-ink-100 text-ink-800',
      onRemove: () => onRemoveFilter('searchTerm', '')
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-ink-50 rounded-lg border border-ink-200">
      <span className="text-sm font-medium text-ink-600">Active Filters:</span>

      {chips.map(chip => (
        <div
          key={chip.id}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${chip.color} text-sm font-medium`}
        >
          <span>{chip.label}</span>
          <button
            onClick={chip.onRemove}
            className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
            title="Remove filter"
          >
            <X size={14} />
          </button>
        </div>
      ))}

      <button
        onClick={onClearAll}
        className="ml-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        Clear All
      </button>
    </div>
  );
};

export default FilterChips;
