import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'md', message = 'Loading...', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const Spinner = () => (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizeClasses[size]} text-blue-600 animate-spin`} />
      {message && (
        <p className="text-sm text-ink-600 font-medium">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
        <div className="bg-white rounded-lg p-6 shadow-lift">
          <Spinner />
        </div>
      </div>
    );
  }

  return <Spinner />;
};

export default LoadingSpinner;
