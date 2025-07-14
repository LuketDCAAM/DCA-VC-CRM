
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfileButton from '@/components/profile/ProfileButton';
import { useUserRoles } from '@/hooks/useUserRoles';
import { 
  BarChart3, 
  DollarSign, 
  Building2, 
  Users, 
  Contact,
  HandCoins
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Deals', href: '/deals', icon: DollarSign },
  { name: 'Portfolio', href: '/portfolio', icon: Building2 },
  { name: 'Venture Investors', href: '/investors', icon: Users },
  { name: 'LP Engagements', href: '/lp-engagements', icon: HandCoins },
  { name: 'Contacts', href: '/contacts', icon: Contact },
];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isViewer } = useUserRoles();

  // Filter navigation for viewers
  const filteredNavigation = isViewer 
    ? navigation.filter(item => item.name === 'Dashboard')
    : navigation;

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <img 
                src="/lovable-uploads/c1b92e43-b852-475a-aa30-04db2ade1108.png" 
                alt="VC Platform Logo" 
                className="h-8 w-auto"
              />
            </div>
            <nav className="hidden md:flex space-x-4">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? "default" : "ghost"}
                    onClick={() => navigate(item.href)}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <ProfileButton />
          </div>
        </div>
      </div>
    </header>
  );
}
