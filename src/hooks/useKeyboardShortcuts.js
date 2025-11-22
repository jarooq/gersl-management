import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Custom hook for global keyboard shortcuts
 * Provides app-wide keyboard navigation and command functionality
 *
 * Supported shortcuts:
 * - Ctrl/Cmd + K: Toggle command palette / global search
 * - N: New task (context-aware based on current route)
 * - ESC: Close modals and overlays
 * - /: Focus search bar
 * - Arrow Up/Down: Navigate lists
 * - Enter: Open selected item
 *
 * @param {Object} handlers - Custom handlers for various shortcuts
 * @param {Function} handlers.onCommandPalette - Handler for Cmd/Ctrl+K
 * @param {Function} handlers.onNewTask - Handler for 'N' key
 * @param {Function} handlers.onEscape - Handler for ESC key
 * @param {Function} handlers.onFocusSearch - Handler for '/' key
 * @param {Function} handlers.onNavigateUp - Handler for up arrow
 * @param {Function} handlers.onNavigateDown - Handler for down arrow
 * @param {Function} handlers.onSelectItem - Handler for Enter key
 * @param {boolean} disabled - Disable all shortcuts if true
 */
const useKeyboardShortcuts = (handlers = {}, disabled = false) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is typing in an input/textarea
  const isTyping = useCallback((event) => {
    const target = event.target;
    const tagName = target.tagName.toLowerCase();
    const isEditable = target.isContentEditable;
    const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';

    return isInput || isEditable;
  }, []);

  // Get context-aware new task handler
  const getNewTaskHandler = useCallback(() => {
    const path = location.pathname;

    // If on a specific project page, create task for that project
    if (path.includes('/projects/') && handlers.onNewTask) {
      return handlers.onNewTask;
    }

    // If on tasks page, use the tasks page handler
    if ((path.includes('/tasks') || path.includes('/my-tasks')) && handlers.onNewTask) {
      return handlers.onNewTask;
    }

    // Default: navigate to tasks page
    return () => navigate('/tasks');
  }, [location.pathname, handlers.onNewTask, navigate]);

  // Main keyboard event handler
  const handleKeyDown = useCallback((event) => {
    // Skip if shortcuts are disabled
    if (disabled) return;

    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdOrCtrl = isMac ? metaKey : ctrlKey;

    // Cmd/Ctrl + K: Command palette / global search
    if (cmdOrCtrl && key === 'k') {
      event.preventDefault();
      if (handlers.onCommandPalette) {
        handlers.onCommandPalette();
      } else {
        // Default: focus search if available
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search" i]');
        if (searchInput) {
          searchInput.focus();
        }
      }
      return;
    }

    // For remaining shortcuts, skip if user is typing
    if (isTyping(event)) return;

    switch (key) {
      case 'n':
      case 'N':
        // N: New task (context-aware)
        if (!ctrlKey && !metaKey && !shiftKey && !altKey) {
          event.preventDefault();
          const newTaskHandler = getNewTaskHandler();
          newTaskHandler();
        }
        break;

      case 'Escape':
        // ESC: Close modals and overlays
        event.preventDefault();
        if (handlers.onEscape) {
          handlers.onEscape();
        } else {
          // Default: close any open modals by clicking backdrop or close button
          const closeButton = document.querySelector('[role="dialog"] button[aria-label*="close" i], .modal button[aria-label*="close" i]');
          const backdrop = document.querySelector('.modal-backdrop, [role="dialog"][aria-modal="true"]');

          if (closeButton) {
            closeButton.click();
          } else if (backdrop) {
            // Click outside the modal content
            const modalContent = backdrop.querySelector('.modal-content, [role="document"]');
            if (modalContent && !modalContent.contains(event.target)) {
              backdrop.click();
            }
          }
        }
        break;

      case '/':
        // /: Focus search bar
        if (!ctrlKey && !metaKey && !shiftKey && !altKey) {
          event.preventDefault();
          if (handlers.onFocusSearch) {
            handlers.onFocusSearch();
          } else {
            // Default: focus first search input found
            const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search" i]');
            if (searchInput) {
              searchInput.focus();
              searchInput.select(); // Select existing text for easy overwrite
            }
          }
        }
        break;

      case 'ArrowUp':
        // Arrow Up: Navigate lists
        if (handlers.onNavigateUp && !ctrlKey && !metaKey) {
          event.preventDefault();
          handlers.onNavigateUp();
        }
        break;

      case 'ArrowDown':
        // Arrow Down: Navigate lists
        if (handlers.onNavigateDown && !ctrlKey && !metaKey) {
          event.preventDefault();
          handlers.onNavigateDown();
        }
        break;

      case 'Enter':
        // Enter: Open selected item
        if (handlers.onSelectItem && !isTyping(event)) {
          const activeElement = document.activeElement;
          // Only trigger if not on a button or link
          if (activeElement.tagName.toLowerCase() !== 'button' &&
              activeElement.tagName.toLowerCase() !== 'a') {
            event.preventDefault();
            handlers.onSelectItem();
          }
        }
        break;

      default:
        break;
    }
  }, [disabled, handlers, isTyping, getNewTaskHandler]);

  // Set up event listener
  useEffect(() => {
    if (disabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, disabled]);

  // Return utility functions
  return {
    isTyping,
    currentPath: location.pathname,
  };
};

export default useKeyboardShortcuts;
