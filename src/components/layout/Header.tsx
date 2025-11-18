import { useState } from 'react';
import { Search, Bell, User, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = () => {
    const query = searchTerm.trim();
    if (!query) return;

    const targetRoute = user?.role === 'manager' ? '/manager/leads' : '/agent/leads';
    navigate(targetRoute, { state: { searchQuery: query } });
    setSearchTerm('');
  };

  return (
    <header className="bg-header-nav text-white shadow-md">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-md hover:bg-white/10"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-logo-accent rounded-md flex items-center justify-center font-bold">
              IY
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-semibold">Call Center Portal</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-md px-3 py-1.5 flex-1 max-w-md">
            <Search className="w-4 h-4" />
            <input
              type="text"
              placeholder="Search leads..."
              className="bg-transparent border-none outline-none text-white placeholder-white/70 flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
            <button
              type="button"
              onClick={handleSearch}
              className="text-sm font-medium text-white/80 hover:text-white transition"
            >
              Search
            </button>
          </div>

          <button className="p-2 rounded-md hover:bg-white/10 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-status-error rounded-full"></span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-white/10"
            >
              <User className="w-5 h-5" />
              <span className="hidden md:block text-sm">{user?.fullName}</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-border z-50">
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-medium text-text-primary">{user?.fullName}</p>
                  <p className="text-xs text-text-secondary">{user?.email}</p>
                  <p className="text-xs text-text-secondary mt-1">
                    {user?.role === 'manager' ? 'Manager' : 'Agent'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-secondary-bg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

