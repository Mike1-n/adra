import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';

export function AppLayout({ currentTab, onSelectTab, currentTabTitle, children }) {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Desktop Sidebar (Only visible on lg+ screens) */}
      <div className="hidden lg:block h-full shrink-0">
        <Sidebar currentTab={currentTab} onSelectTab={onSelectTab} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          currentTab={currentTab}
          onSelectTab={onSelectTab}
          currentTabTitle={currentTabTitle}
        />

        <main className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8 bg-slate-950">
          <div className="max-w-7xl mx-auto space-y-5">
            {children}
          </div>
        </main>
      </div>

      {/* Native Mobile Bottom Navigation Bar (Visible on mobile/tablet screens) */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={onSelectTab}
      />
    </div>
  );
}
