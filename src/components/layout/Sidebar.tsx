
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, Users, DollarSign, Contact, BarChart3, LogOut, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRoles } from '@/hooks/useUserRoles';
import { UserApprovalsDialog } from '@/components/admin/UserApprovalsDialog';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Deals', href: '/deals', icon: DollarSign },
  { name: 'Portfolio', href: '/portfolio', icon: Building2 },
  { name: 'Investors', href: '/investors', icon: Users },
  { name: 'Contacts', href: '/contacts', icon: Contact },
];

export default function Sidebar() {
  const location = useLocation();
  const { toast } = useToast();
  const { isAdmin } = useUserRoles();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex flex-1 flex-col">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-xl font-bold text-white">DCA VC CRM</h1>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                  location.pathname === item.href
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        {/* Admin Controls */}
        {isAdmin && (
          <div className="px-4 py-2 border-t border-gray-700">
            <div className="flex items-center mb-2">
              <Shield className="h-4 w-4 text-green-400 mr-2" />
              <span className="text-sm text-green-400 font-medium">Admin</span>
            </div>
            <UserApprovalsDialog />
          </div>
        )}
        
        <div className="p-4">
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
