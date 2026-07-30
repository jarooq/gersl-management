import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 20, 50, 100],
  showItemsPerPage = true,
  showSummary = true,
  className = ''
}) => {
  // Calculate range of items being displayed
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      let startPage, endPage;
      if (currentPage <= 3) {
        // Near the start
        startPage = 2;
        endPage = 5;
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        startPage = totalPages - 4;
        endPage = totalPages - 1;
      } else {
        // In the middle
        startPage = currentPage - 1;
        endPage = currentPage + 1;
      }

      // Add ellipsis if needed
      if (startPage > 2) {
        pages.push('...');
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const handlePageClick = (page) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value);
    // Calculate what page we should be on with new items per page
    const firstItemOnCurrentPage = (currentPage - 1) * itemsPerPage;
    const newPage = Math.floor(firstItemOnCurrentPage / newItemsPerPage) + 1;
    onItemsPerPageChange(newItemsPerPage, newPage);
  };

  if (totalPages <= 1 && !showItemsPerPage) {
    return null; // Don't show pagination if only one page and no items-per-page selector
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Left side - Summary and items per page */}
      <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
        {showSummary && totalItems > 0 && (
          <div className="text-sm text-ink-700">
            Showing <span className="font-semibold">{startItem}</span> to{' '}
            <span className="font-semibold">{endItem}</span> of{' '}
            <span className="font-semibold">{totalItems}</span> results
          </div>
        )}

        {showItemsPerPage && itemsPerPageOptions.length > 1 && (
          <div className="flex items-center gap-2">
            <label htmlFor="itemsPerPage" className="text-sm text-ink-700">
              Per page:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="px-3 py-1 border border-ink-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              {itemsPerPageOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side - Page navigation */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* First page button */}
          <button
            onClick={() => handlePageClick(1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg transition ${
              currentPage === 1
                ? 'text-ink-400 cursor-not-allowed'
                : 'text-ink-700 hover:bg-ink-100 active:bg-ink-200'
            }`}
            title="First page"
          >
            <ChevronsLeft className="w-5 h-5" />
          </button>

          {/* Previous page button */}
          <button
            onClick={() => handlePageClick(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg transition ${
              currentPage === 1
                ? 'text-ink-400 cursor-not-allowed'
                : 'text-ink-700 hover:bg-ink-100 active:bg-ink-200'
            }`}
            title="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-3 py-2 text-ink-500"
                  >
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={page}
                  onClick={() => handlePageClick(page)}
                  className={`min-w-[40px] px-3 py-2 rounded-lg font-medium transition ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-ink-700 hover:bg-ink-100 active:bg-ink-200'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Next page button */}
          <button
            onClick={() => handlePageClick(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg transition ${
              currentPage === totalPages
                ? 'text-ink-400 cursor-not-allowed'
                : 'text-ink-700 hover:bg-ink-100 active:bg-ink-200'
            }`}
            title="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Last page button */}
          <button
            onClick={() => handlePageClick(totalPages)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg transition ${
              currentPage === totalPages
                ? 'text-ink-400 cursor-not-allowed'
                : 'text-ink-700 hover:bg-ink-100 active:bg-ink-200'
            }`}
            title="Last page"
          >
            <ChevronsRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

// Custom hook for pagination logic
export const usePagination = (data, initialItemsPerPage = 20) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(initialItemsPerPage);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newItemsPerPage, newPage = 1) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(newPage);
  };

  // Reset to page 1 when data changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  return {
    currentPage,
    totalPages,
    totalItems: data.length,
    itemsPerPage,
    paginatedData,
    handlePageChange,
    handleItemsPerPageChange
  };
};

export default Pagination;
