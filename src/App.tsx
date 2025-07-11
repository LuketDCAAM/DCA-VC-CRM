
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from './hooks/useAuth';
import { useUserRoles } from './hooks/useUserRoles';
import AuthForm from './components/auth/AuthForm';
import ApprovalStatus from './components/auth/ApprovalStatus';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import Deals from './pages/Deals';
import Portfolio from './pages/Portfolio';
import Investors from './pages/Investors';
import Contacts from './pages/Contacts';
import Reminders from './pages/Reminders';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { isApproved, isViewer, loading: rolesLoading } = useUserRoles();

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  // If user is logged in but not approved, show approval status
  if (!isApproved) {
    return <ApprovalStatus />;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Redirect viewers to dashboard for all other routes */}
            {isViewer ? (
              <>
                <Route path="/deals" element={<Navigate to="/dashboard" replace />} />
                <Route path="/portfolio" element={<Navigate to="/dashboard" replace />} />
                <Route path="/investors" element={<Navigate to="/dashboard" replace />} />
                <Route path="/contacts" element={<Navigate to="/dashboard" replace />} />
                <Route path="/reminders" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </>
            ) : (
              <>
                <Route path="/deals" element={<Deals />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/investors" element={<Investors />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/reminders" element={<Reminders />} />
                <Route path="*" element={<NotFound />} />
              </>
            )}
          </Routes>
        </div>
      </main>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
