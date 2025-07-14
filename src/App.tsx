
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
import Investors from "./pages/Investors";
import Contacts from "./pages/Contacts";
import Reminders from "./pages/Reminders";
import LPEngagements from "./pages/LPEngagements";
import ExternalDataDashboard from "./pages/ExternalDataDashboard";
import NotFound from "./pages/NotFound";
import MicrosoftAuthCallback from "./pages/auth/microsoft/callback";

const queryClient = new QueryClient();

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
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/deals" element={<Deals />} />
                    <Route path="/portfolio" element={<Portfolio />} />
                    <Route path="/investors" element={<Investors />} />
                    <Route path="/contacts" element={<Contacts />} />
                    <Route path="/reminders" element={<Reminders />} />
                    <Route path="/lp-engagements" element={<LPEngagements />} />
                    <Route path="/external-data" element={<ExternalDataDashboard />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
