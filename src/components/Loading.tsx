/**
 * Reusable Loading Screen Component
 * Used for full-page loading states with consistent styling across the app
 */

interface LoadingScreenProps {
  message?: string;
  fullHeight?: boolean;
}

export function LoadingScreen({ 
  message = "Loading...", 
  fullHeight = true 
}: LoadingScreenProps) {
  return (
    <div className={`flex items-center justify-center ${fullHeight ? 'min-h-screen' : 'h-full'} bg-white`}>
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-green-600 rounded-full animate-spin"></div>
          </div>
        </div>
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
}

/**
 * Loading Spinner for inline use (buttons, icons, etc)
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-3 w-3 border-2',
    md: 'h-4 w-4 border-2',
    lg: 'h-6 w-6 border-3'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div className="absolute inset-0 border border-gray-200 rounded-full"></div>
      <div className="absolute inset-0 border-t-green-600 border-t border-transparent rounded-full animate-spin"></div>
    </div>
  );
}

/**
 * Loading Skeleton for content placeholders
 */
interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export function LoadingSkeleton({ lines = 3, className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
      ))}
    </div>
  );
}
