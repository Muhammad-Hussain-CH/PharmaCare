// src/components/WorkerLayout.tsx
// Minimal layout for worker role — no sidebar, just header + logout
// Authors: Muhammad Hussain & Ali Ahmed Mansoor

import { useAuth } from '../context/AuthContext';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: isDark ? '#0F0D1A' : '#F5F3FF' }}
    >
      {/* Worker Header */}
      <header
        className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-20 border-b"
        style={{
          background: isDark ? '#1A1730' : '#FFFFFF',
          borderColor: isDark ? '#2D2B45' : '#E5E7EB',
        }}
      >
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-blue-600">PharmaCare POS</h1>
          <span className="text-sm font-semibold text-gray-600">Worker</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800">{user?.full_name}</p>
            <p className="text-xs text-gray-500">Worker Account</p>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            title="Toggle theme"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            title="Logout"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main
        className="pt-16 min-h-screen"
        style={{ background: isDark ? '#0F0D1A' : '#F5F3FF' }}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
