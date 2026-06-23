"use client";

import { useEffect, useState } from "react";
import { Sparkles, Leaf } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
  fullHeight?: boolean;
}

const ECO_TIPS = [
  "Nurturing the planet, one plate at a time...",
  "Did you know? 1/3 of all food produced is wasted globally.",
  "Reducing food waste is a key solution to climate change.",
  "Connecting surplus fresh meals with local communities.",
  "Saving food saves resources, water, and CO2 emissions.",
  "Thank you for fighting food waste with us!",
  "Loading fresh organic updates from your area...",
  "Connecting with local donors and food partners..."
];

export function LoadingScreen({ 
  message = "Loading...", 
  fullHeight = true 
}: LoadingScreenProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [fadeState, setFadeState] = useState<"in" | "out">("in");

  useEffect(() => {
    const tipInterval = setInterval(() => {
      // Step 1: Trigger fade out
      setFadeState("out");
      
      // Step 2: Swap message and trigger fade in after transition delay
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % ECO_TIPS.length);
        setFadeState("in");
      }, 300);
    }, 4500);

    return () => clearInterval(tipInterval);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center ${fullHeight ? 'min-h-[100dvh]' : 'h-full'} bg-gradient-to-br from-emerald-50 via-teal-50/30 to-lime-50/40 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 relative overflow-hidden p-6 transition-colors duration-500`}>
      
      {/* Decorative ambient glowing circles */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-3xl animate-blob-float-1 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-lime-300/10 dark:bg-lime-500/5 rounded-full blur-3xl animate-blob-float-2 pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-64 h-64 bg-teal-400/5 dark:bg-teal-500/5 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDuration: '6s' }} />

      {/* Glassmorphic Loader Card */}
      <div className="text-center z-10 max-w-md w-full bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl border border-white/40 dark:border-neutral-800/40 shadow-2xl shadow-emerald-950/5 rounded-3xl p-8 sm:p-10 flex flex-col items-center">
        
        {/* Animated Double Ring & Logo */}
        <div className="relative mb-8 flex items-center justify-center h-28 w-28">
          {/* Outer dashed spinning ring */}
          <div className="absolute w-24 h-24 rounded-full border border-dashed border-emerald-500/40 dark:border-emerald-500/30 animate-spin" style={{ animationDuration: '10s' }} />
          
          {/* Inner solid counter-spinning gradient ring */}
          <div className="absolute w-20 h-20 rounded-full border-2 border-t-emerald-500 border-r-teal-400 border-b-transparent border-l-transparent animate-spin-reverse" />
          
          {/* Pulsing ring visual echo */}
          <div className="absolute w-16 h-16 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 animate-ping" style={{ animationDuration: '2.5s' }} />
          
          {/* Central Logo Container */}
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 animate-pulse-scale">
            <Leaf className="h-7 w-7" />
          </div>
        </div>

        {/* Brand details */}
        <div className="space-y-1 mb-8">
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: '4s' }} />
            FWRP Platform
          </div>
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">
            Saving Fresh Food
          </h2>
        </div>

        {/* Custom Progress Bar Loader */}
        <div className="w-full bg-emerald-100/60 dark:bg-neutral-800/60 rounded-full h-1.5 overflow-hidden mb-6 relative">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 absolute left-0 top-0 w-full"
            style={{
              animation: 'shimmer-slide 2s linear infinite',
              backgroundImage: 'linear-gradient(90deg, #10b981 0%, #14b8a6 50%, #10b981 100%)',
              backgroundSize: '200% 100%'
            }} 
          />
        </div>

        {/* Primary Load Status */}
        <p className="text-gray-900 dark:text-gray-100 text-sm font-semibold mb-2">
          {message}
        </p>

        {/* Rotating Eco-Tip text carousel with smooth fade */}
        <div className="h-10 flex items-center justify-center">
          <p 
            className={`text-gray-500 dark:text-gray-400 text-xs font-medium max-w-[280px] leading-relaxed transition-all duration-300 transform ${
              fadeState === "in" 
                ? "opacity-100 translate-y-0" 
                : "opacity-0 -translate-y-1"
            }`}
          >
            {ECO_TIPS[tipIndex]}
          </p>
        </div>
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
      <div className="absolute inset-0 border border-gray-200 dark:border-neutral-800 rounded-full"></div>
      <div className="absolute inset-0 border-t-emerald-600 border-t border-transparent rounded-full animate-spin"></div>
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
        <div 
          key={i} 
          className="h-4 bg-gray-200 dark:bg-neutral-800 rounded animate-pulse"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}
