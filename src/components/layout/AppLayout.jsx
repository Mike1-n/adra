import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout({ currentTab, onSelectTab, currentTabTitle, onSwitchToAdminWeb, children }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-white text-slate-900 overflow-hidden font-sans">
      {/* Desktop Sidebar (Only visible on lg+ screens) */}
      <div className="hidden lg:block h-full shrink-0">
        <Sidebar currentTab={currentTab} onSelectTab={onSelectTab} onSwitchToAdminWeb={onSwitchToAdminWeb} />
      </div>

      {/* Responsive Mobile/Tablet Sidebar Drawer (Visible on <lg screens when toggled) */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Slide-over Drawer */}
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <Sidebar
              currentTab={currentTab}
              onSelectTab={(tabId) => {
                onSelectTab(tabId);
                setIsMobileSidebarOpen(false);
              }}
              onSwitchToAdminWeb={onSwitchToAdminWeb}
              isMobile={true}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          currentTab={currentTab}
          onSelectTab={onSelectTab}
          currentTabTitle={currentTabTitle}
          onSwitchToAdminWeb={onSwitchToAdminWeb}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6 lg:p-8 pb-8 bg-white">
          <div className="max-w-7xl mx-auto space-y-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
