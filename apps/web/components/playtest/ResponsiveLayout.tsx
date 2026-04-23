/**
 * Responsive Layout Component
 * Adapts game UI for mobile, tablet, and desktop screens
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { GameState } from '@/lib/game/game-engine';

interface ResponsiveLayoutProps {
  gameState: GameState;
  children: React.ReactNode;
  isMobile?: boolean;
  isTablet?: boolean;
}

/**
 * Detect screen size
 */
export function useScreenSize() {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  React.useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 768) {
          setScreenSize('mobile');
        } else if (window.innerWidth < 1024) {
          setScreenSize('tablet');
        } else {
          setScreenSize('desktop');
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
}

/**
 * Mobile-optimized game layout
 */
export function MobileGameLayout({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<'board' | 'hand' | 'log'>('board');

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white overflow-hidden">
      {/* Mobile Header - Minimal */}
      <div className="border-b border-slate-700 bg-slate-800/50 px-4 py-4 flex-shrink-0">
        <h1 className="text-lg font-bold">Gundam Playtester</h1>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow overflow-y-auto">
        {/* Content rendered by parent */}
        {children}
      </div>

      {/* Mobile Tabs */}
      <div className="border-t border-slate-700 bg-slate-800/50 flex gap-0 flex-shrink-0">
        {(['board', 'hand', 'log'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 px-4 text-center transition text-sm font-semibold border-b-2 ${
              activeTab === tab
                ? 'border-purple-600 text-purple-300 bg-slate-800'
                : 'border-slate-700 text-white hover:text-white'
            }`}
          >
            {tab === 'board' && '🎮'}
            {tab === 'hand' && '🃏'}
            {tab === 'log' && '📋'}
            {tab.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Tablet-optimized game layout
 */
export function TabletGameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Tablet Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Gundam TCG Playtester</h1>
        <div className="text-sm text-white">Tablet View</div>
      </div>

      {/* Main Content */}
      <div className="flex-grow overflow-hidden grid grid-cols-2 gap-4 p-4">
        {children}
      </div>
    </div>
  );
}

/**
 * Desktop game layout (full featured)
 */
export function DesktopGameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {children}
    </div>
  );
}

/**
 * Responsive wrapper that selects layout based on screen size
 */
export function ResponsiveGameLayout({ children, gameState }: ResponsiveLayoutProps) {
  const screenSize = useScreenSize();

  if (screenSize === 'mobile') {
    return <MobileGameLayout>{children}</MobileGameLayout>;
  }

  if (screenSize === 'tablet') {
    return <TabletGameLayout>{children}</TabletGameLayout>;
  }

  return <DesktopGameLayout>{children}</DesktopGameLayout>;
}
