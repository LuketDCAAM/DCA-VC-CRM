
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Layout from "./components/layout/Layout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Deals from "./pages/Deals";
import Portfolio from "./pages/Portfolio";
import InvestorsSimple from "./pages/InvestorsSimple";
import Contacts from "./pages/Contacts";
import Reminders from "./pages/Reminders";
import LPEngagements from "./pages/LPEngagements";
import ExternalDataDashboard from "./pages/ExternalDataDashboard";
import NotFound from "./pages/NotFound";
import MicrosoftAuthCallback from "./pages/auth/microsoft/callback";
import { useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent automatic refetching on window focus to avoid loading issues when switching tabs
      refetchOnWindowFocus: false,
      // Reduce retry attempts to avoid hanging requests
      retry: 1,
      // Set a reasonable stale time to prevent unnecessary refetches
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Index />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth/microsoft/callback" element={<MicrosoftAuthCallback />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/deals" element={<Deals />} />
                      <Route path="/portfolio" element={<Portfolio />} />
                      <Route path="/investors" element={<InvestorsSimple />} />
                      <Route path="/contacts" element={<Contacts />} />
                      <Route path="/reminders" element={<Reminders />} />
                      <Route path="/lp-engagements" element={<LPEngagements />} />
                      <Route path="/external-data" element={<ExternalDataDashboard />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
