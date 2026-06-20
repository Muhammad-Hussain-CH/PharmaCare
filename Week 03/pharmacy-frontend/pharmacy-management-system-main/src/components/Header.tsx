import { Bell, Sun, Moon, Search, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/medicines': 'Medicines',
  '/suppliers': 'Suppliers',
  '/purchase-orders': 'Purchase Orders',
  '/prescriptions': 'Prescriptions & Dispense',
  '/expiry-alerts': 'Expiry Alerts',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export default function Header() {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const title = Object.entries(pageTitles).find(([path]) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  )?.[1] ?? 'PharmaCare';

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
    : 'MH';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      className="fixed top-0 left-[260px] right-0 h-16 flex items-center justify-between px-6 z-20 border-b"
      style={{
        background: isDark ? '#1A1730' : '#FFFFFF',
        borderColor: isDark ? '#2D2B45' : '#E5E7EB',
      }}
    >
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search anything..."
            className="pl-8 pr-4 py-2 text-sm bg-gray-50 dark:bg-[#252240] border border-gray-200 dark:border-[#2D2B45] rounded-lg text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] w-56"
          />
        </div>

        {/* Bell */}
        <button className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252240] transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252240] transition-colors"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <div style={{ transform: isDark ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 300ms ease' }}>
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </div>
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-[#2A2238] transition-colors"
          title="Logout"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#7C3AED] flex items-center justify-center" title={user?.full_name || 'Logged in user'}>
          <span className="text-white text-xs font-bold">{initials}</span>
        </div>
      </div>
    </header>
  );
}
