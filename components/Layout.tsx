import React from 'react';
import { Home, PlusCircle, Globe, User } from 'lucide-react';
import { AppRoute } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeRoute, onNavigate }) => {
  // Hide nav on auth page
  if (activeRoute === AppRoute.AUTH) {
    return <div className="min-h-screen bg-white">{children}</div>;
  }

  const navItems = [
    { id: AppRoute.HOME, icon: Home, label: 'Home' },
    { id: AppRoute.CREATE, icon: PlusCircle, label: 'Plan' },
    { id: AppRoute.SOCIAL, icon: Globe, label: 'Social' },
    { id: AppRoute.PROFILE, icon: User, label: 'Profile' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20 relative">
      <main className="flex-grow overflow-y-auto no-scrollbar">
        {children}
      </main>

      {/* Sticky Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50 shadow-lg">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 transition-colors duration-200 ${
              activeRoute === item.id ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <item.icon size={24} strokeWidth={activeRoute === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;