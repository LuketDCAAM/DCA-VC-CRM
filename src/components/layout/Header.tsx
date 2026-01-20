
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfileButton from '@/components/profile/ProfileButton';
import { useUserRoles } from '@/hooks/useUserRoles';
import { UserManagementDialog } from '@/components/admin/UserManagementDialog';
import { 
  BarChart3, 
  DollarSign, 
  Building2, 
  Users, 
  Contact,
  HandCoins,
  ClipboardList
} from 'lucide-react';
import ThemeToggle from '@/components/theme/ThemeToggle';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Deals', href: '/deals', icon: DollarSign },
  { name: 'Portfolio', href: '/portfolio', icon: Building2 },
  { name: 'Venture Investors', href: '/investors', icon: Users },
  { name: 'LP Engagements', href: '/lp-engagements', icon: HandCoins },
  { name: 'Contacts', href: '/contacts', icon: Contact },
  { name: 'Tasks', href: '/tasks', icon: ClipboardList },
];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isViewer, isAdmin } = useUserRoles();

  // Filter navigation for viewers
  const filteredNavigation = isViewer 
    ? navigation.filter(item => item.name === 'Dashboard')
    : navigation;

  return (
    <header className="bg-background shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <img 
                src="/lovable-uploads/c1b92e43-b852-475a-aa30-04db2ade1108.png" 
                alt="VC Platform Logo" 
                className="h-7 w-auto"
              />
            </div>
            <nav className="hidden lg:flex space-x-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => navigate(item.href)}
                    className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 h-9"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden xl:inline">{item.name}</span>
                  </Button>
                );
              })}
            </nav>
            
            {isAdmin && (
              <div className="ml-6">
                <UserManagementDialog />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ProfileButton />
          </div>
        </div>
      </div>
    </header>
  );
}
