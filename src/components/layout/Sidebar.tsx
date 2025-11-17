import { NavLink } from 'react-router-dom';
import { Home, Plus, List, Info, HelpCircle, Users, BarChart3, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  const agentLinks = [
    { to: '/agent/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/agent/capture-lead', icon: Plus, label: 'Capture Lead' },
    { to: '/agent/leads', icon: List, label: 'My Leads' },
    { to: '/services', icon: Info, label: 'Services & Pricing' },
    { to: '/help', icon: HelpCircle, label: 'Help & Support' },
  ];

  const managerLinks = [
    { to: '/manager/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/manager/leads', icon: List, label: 'All Leads' },
    { to: '/manager/agents', icon: Users, label: 'Agents' },
    { to: '/manager/reports', icon: BarChart3, label: 'Reports' },
    { to: '/services', icon: Info, label: 'Services & Pricing' },
  ];

  const links = isManager ? managerLinks : agentLinks;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-border z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static md:z-auto w-64`}
      >
        <nav className="p-4">
          <ul className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary-cta/10 text-primary-cta font-medium'
                          : 'text-text-primary hover:bg-secondary-bg'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}

