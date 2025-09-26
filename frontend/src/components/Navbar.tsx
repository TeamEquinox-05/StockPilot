import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { removeToken } from '../utils/auth';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const Navbar = () => {
  const [activeItem, setActiveItem] = useState('dashboard');
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '', path: '/dashboard' },
    { id: 'inventory', label: 'Inventory', icon: '', path: '/inventory' },
    { id: 'sales', label: 'Sales', icon: '', path: '/sales' },
    { id: 'purchases', label: 'Purchases', icon: '', path: '/purchases' },
    { id: 'integrations', label: 'Integrations', icon: '', path: '/integrations' },
    { id: 'channels', label: 'Active Channels', icon: '', path: '/channels' },
    { id: 'reports', label: 'Reports', icon: '', path: '/reports' },
    { id: 'documents', label: 'Documents', icon: '', path: '/documents' },
  ];

  const handleItemClick = (item: NavItem) => {
    setActiveItem(item.id);
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
              <span className="text-xl font-bold text-gray-900">StockPilot</span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-4">
              {navItems.map((item) => (
                <div key={item.id}>
                  <button
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all duration-200 group ${
                      activeItem === item.id
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activeItem === item.id ? 'bg-white' : 'bg-gray-400'
                      }`}></div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </button>
                </div>
              ))}
            </nav>
          </div>

          {/* User Section */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-700 font-semibold text-sm">U</span>
              </div>
              <div>
                <p className="text-gray-900 font-medium text-sm">User</p>
                <p className="text-gray-500 text-xs">Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-sm border border-gray-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;