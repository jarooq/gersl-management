import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search, Home, FileText, Users, Calendar, DollarSign, Settings, FolderOpen, Target, BarChart3 } from 'lucide-react';

/**
 * Command Palette Component
 * Global search and navigation interface
 * Triggered by Cmd/Ctrl + K
 */
const CommandPalette = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Available commands/navigation options
  const commands = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, path: '/admin/dashboard', category: 'Navigation' },
    { id: 'my-dashboard', name: 'My Dashboard', icon: Target, path: '/admin/my-dashboard', category: 'Navigation' },
    { id: 'executive-dashboard', name: 'Executive Dashboard', icon: BarChart3, path: '/admin/executive-dashboard', category: 'Navigation' },
    { id: 'projects', name: 'Projects', icon: FolderOpen, path: '/admin/projects', category: 'Navigation' },
    { id: 'tasks', name: 'All Tasks', icon: Target, path: '/admin/operations/tasks', category: 'Navigation' },
    { id: 'my-tasks', name: 'My Tasks', icon: Target, path: '/admin/operations/my-tasks', category: 'Navigation' },
    { id: 'orphans', name: 'Orphan Management', icon: Users, path: '/admin/orphans', category: 'Navigation' },
    { id: 'proposals', name: 'Proposals', icon: FileText, path: '/admin/proposals', category: 'Navigation' },
    { id: 'partners', name: 'Partners', icon: Users, path: '/admin/partners', category: 'Navigation' },
    { id: 'finance', name: 'Finance', icon: DollarSign, path: '/admin/finance', category: 'Navigation' },
    { id: 'meal', name: 'MEAL', icon: Calendar, path: '/admin/meal', category: 'Navigation' },
    { id: 'hr', name: 'Human Resources', icon: Users, path: '/admin/hr', category: 'Navigation' },
    { id: 'settings', name: 'Settings', icon: Settings, path: '/admin/settings', category: 'Navigation' },
  ];

  // Filter commands based on search query
  const filteredCommands = commands.filter(command =>
    command.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    command.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Focus input when palette opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle command selection
  const handleCommandSelect = useCallback((command) => {
    navigate(command.path);
    onClose();
  }, [navigate, onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < filteredCommands.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            handleCommandSelect(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, handleCommandSelect, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Command Palette Modal */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
        <div className="bg-white rounded-lg shadow-pop border border-ink-200 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-ink-200">
            <Search className="text-ink-400" size={20} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search commands or navigate..."
              className="flex-1 outline-none text-ink-700 placeholder-ink-400"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(0);
              }}
            />
            <button
              onClick={onClose}
              className="p-1 hover:bg-ink-100 rounded transition-colors"
            >
              <X size={18} className="text-ink-500" />
            </button>
          </div>

          {/* Commands List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="px-4 py-8 text-center text-ink-500">
                No commands found
              </div>
            ) : (
              <div className="py-2">
                {filteredCommands.map((command, index) => {
                  const Icon = command.icon;
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={command.id}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                        isSelected
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : 'hover:bg-ink-50 border-l-4 border-transparent'
                      }`}
                      onClick={() => handleCommandSelect(command)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <Icon
                        size={20}
                        className={isSelected ? 'text-blue-600' : 'text-ink-400'}
                      />
                      <div className="flex-1 text-left">
                        <div className={`font-medium ${
                          isSelected ? 'text-blue-900' : 'text-ink-700'
                        }`}>
                          {command.name}
                        </div>
                        <div className="text-xs text-ink-500">
                          {command.category}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="text-xs text-blue-600 font-medium">
                          Enter ↵
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer with keyboard hints */}
          <div className="px-4 py-2 bg-ink-50 border-t border-ink-200 flex items-center justify-between text-xs text-ink-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-ink-300 rounded text-ink-600">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white border border-ink-300 rounded text-ink-600">↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-ink-300 rounded text-ink-600">↵</kbd>
                to select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-ink-300 rounded text-ink-600">Esc</kbd>
                to close
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommandPalette;
