
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, Users, DollarSign, Contact, BarChart3, LogOut, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRoles } from '@/hooks/useUserRoles';
import { UserApprovalsDialog } from '@/components/admin/UserApprovalsDialog';
import ProfileButton from '@/components/profile/ProfileButton';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Deals', href: '/deals', icon: DollarSign },
  { name: 'Portfolio', href: '/portfolio', icon: Building2 },
  { name: 'Investors', href: '/investors', icon: Users },
  { name: 'Contacts', href: '/contacts', icon: Contact },
];

export default function Header() {
  const location = useLocation();
  const { toast } = useToast();
  const { isAdmin, isViewer } = useUserRoles();
  const [open, setOpen] = React.useState(false);

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

  // Filter navigation items for viewers - only show Dashboard
  const filteredNavigation = isViewer 
    ? navigation.filter(item => item.href === '/dashboard')
    : navigation;

  const navLinkClasses = (isActive: boolean) =>
    cn(
      'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-muted text-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    );

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b bg-white px-4 md:px-6">
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="flex items-center">
          <img src="/lovable-uploads/c1b92e43-b852-475a-aa30-04db2ade1108.png" alt="DCA logo" className="h-8" />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {filteredNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={navLinkClasses(location.pathname.startsWith(item.href))}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* Desktop controls */}
        <div className="hidden md:flex items-center gap-4">
            {isAdmin && <UserApprovalsDialog />}
            <ProfileButton />
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Sign Out</span>
            </Button>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <nav className="grid gap-2 text-lg font-medium">
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center mb-4">
                     <img src="/lovable-uploads/c1b92e43-b852-475a-aa30-04db2ade1108.png" alt="DCA logo" className="h-8" />
                  </Link>
                  {filteredNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setOpen(false)}
                      className={navLinkClasses(location.pathname.startsWith(item.href))}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto flex flex-col gap-2">
                    {isAdmin && <UserApprovalsDialog />}
                    <ProfileButton />
                    <Button onClick={handleSignOut} variant="secondary" className='w-full justify-start'>
                      <LogOut className="mr-2 h-5 w-5" />
                      Sign Out
                    </Button>
                </div>
              </SheetContent>
            </Sheet>
        </div>
      </div>
    </header>
  );
}
