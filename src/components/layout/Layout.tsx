
import React from 'react';
import Header from './Header';
import { TaskNotificationPopup } from '@/components/tasks/TaskNotificationPopup';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <TaskNotificationPopup />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
