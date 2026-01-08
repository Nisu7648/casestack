import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  Archive, 
  Download, 
  ScrollText, 
  Settings,
  LogOut,
  Building2
} from 'lucide-react';

// ============================================
// LAYOUT COMPONENT
// Persistent sidebar, PC-only, official
// ============================================

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/cases', label: 'Cases', icon: FileText },
    { path: '/search', label: 'Search', icon: Search },
    { path: '/archive', label: 'Archive', icon: Archive },
    { path: '/audit', label: 'Audit Logs', icon: ScrollText },
  ];

  // Admin-only menu item
  if (user?.role === 'ADMIN' || user?.role === 'PARTNER') {
    menuItems.push({ path: '/admin', label: 'Admin', icon: Settings });
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-bold">CASESTACK</h1>
              <p className="text-xs text-gray-400">Finalization System</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-gray-800">
            <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-gray-400">{user.role}</p>
            <p className="text-xs text-gray-500 mt-1">{user.firmName}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <p className="text-xs text-gray-500">© 2024 CASESTACK</p>
          <p className="text-xs text-gray-600 mt-1">v1.0.0</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
