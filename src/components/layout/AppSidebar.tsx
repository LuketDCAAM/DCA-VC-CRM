import { cn } from '@/lib/utils';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import ProfileButton from '@/components/profile/ProfileButton';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { UserManagementDialog } from '@/components/admin/UserManagementDialog';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useOpenTaskCount } from '@/hooks/useOpenTaskCount';
import {
  BarChart3,
  DollarSign,
  Building2,
  Users,
  Contact,
  HandCoins,
  ClipboardList,
  Sparkles,
  Target,
  BookOpen,
  Sliders,
  Plug,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Deals', href: '/deals', icon: DollarSign },
  { name: 'Portfolio', href: '/portfolio', icon: Building2 },
  { name: 'Venture Investors', href: '/investors', icon: Users },
  { name: 'LP Engagements', href: '/lp-engagements', icon: HandCoins },
  { name: 'Contacts', href: '/contacts', icon: Contact },
  { name: 'Tasks', href: '/tasks', icon: ClipboardList },
  { name: 'Assistant', href: '/assistant', icon: Sparkles },
  { name: 'Thesis', href: '/settings/thesis', icon: Target },
  { name: 'Integrations', href: '/settings/integrations', icon: Plug },
];

export default function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { pathname } = useLocation();
  const { isViewer, isAdmin } = useUserRoles();
  const { count: openTaskCount } = useOpenTaskCount();

  const items = isViewer
    ? navigation.filter((i) => i.name === 'Dashboard')
    : isAdmin
      ? [
          ...navigation,
          { name: 'Benchmarks', href: '/settings/benchmarks', icon: Sliders },
          { name: 'Agent Rules', href: '/settings/agent-instructions', icon: BookOpen },
        ]
      : navigation;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className={cn('flex items-center py-2', collapsed ? 'justify-center px-1' : 'gap-2 px-2')}>
          <img
            src="/lovable-uploads/c1b92e43-b852-475a-aa30-04db2ade1108.png"
            alt="VC Platform Logo"
            className="h-7 w-auto max-w-full object-contain shrink-0"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const showBadge = item.name === 'Tasks' && openTaskCount > 1;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.name}>
                      <NavLink to={item.href} className="flex items-center gap-2 relative">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.name}</span>
                        {showBadge && (
                          <span
                            className={
                              collapsed
                                ? 'absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground'
                                : 'ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground'
                            }
                          >
                            {openTaskCount > 99 ? '99+' : openTaskCount}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <div
          className={
            collapsed
              ? 'flex flex-col items-center gap-2 py-2'
              : 'flex items-center justify-between gap-2 px-2 py-2'
          }
        >
          {isAdmin && <UserManagementDialog />}
          <ThemeToggle />
          <ProfileButton />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
