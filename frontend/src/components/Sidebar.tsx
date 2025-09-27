import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { removeToken } from '../utils/auth';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '', path: '/dashboard' },
    { id: 'inventory', label: 'Inventory', icon: '', path: '/inventory' },
    { id: 'sales', label: 'Sales', icon: '', path: '/sales' },
    { id: 'purchases', label: 'Purchases', icon: '', path: '/purchases' },
    { id: 'vendors', label: 'Vendors', icon: '', path: '/vendors' },
    { id: 'chat', label: 'Chat Assistant', icon: '', path: '/chat' },
    { id: 'integrations', label: 'Integrations', icon: '', path: '/integrations' },
    { id: 'reports', label: 'Reports', icon: '', path: '/reports' },
  ];

  // Get current active item based on current route
  const getCurrentActiveItem = () => {
    const currentPath = location.pathname;
    
    // Check for exact matches first
    const exactMatch = navItems.find(item => item.path === currentPath);
    if (exactMatch) {
      return exactMatch.id;
    }
    
    // Check for sub-route matches
    if (currentPath.startsWith('/purchases')) {
      return 'purchases';
    }
    if (currentPath.startsWith('/inventory')) {
      return 'inventory';
    }
    if (currentPath.startsWith('/sales')) {
      return 'sales';
    }
    if (currentPath.startsWith('/vendors')) {
      return 'vendors';
    }
    if (currentPath.startsWith('/chat')) {
      return 'chat';
    }
    if (currentPath.startsWith('/integrations')) {
      return 'integrations';
    }
    if (currentPath.startsWith('/reports')) {
      return 'reports';
    }
    
    // Default to dashboard
    return 'dashboard';
  };

  const handleItemClick = (item: NavItem) => {
    navigate(item.path);
  };

  const handleLogout = () => {
    removeToken();
    navigate('/');
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 z-50">
      {/* Clean White Background */}
      <div className="h-full bg-white border-r border-gray-200 shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded-sm"></div>
              </div>
              <span className="text-xl font-bold text-gray-900">{import.meta.env.VITE_APP_NAME || 'StockPilot'}</span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 py-4">
            <nav className="px-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center px-3 py-2.5 text-left rounded-lg transition-colors duration-200 ${
                    getCurrentActiveItem() === item.id
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Logout Section */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2.5 text-left rounded-lg text-red-400 hover:bg-red-50 transition-colors duration-200"
            >
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;