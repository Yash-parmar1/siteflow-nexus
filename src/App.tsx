import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import SiteCommandCenter from "./pages/SiteCommandCenter";
import Assets from "./pages/Assets";
import Installations from "./pages/Installations";
import Maintenance from "./pages/Maintenance";
import Vendors from "./pages/Vendors";
import Clients from "./pages/Clients";
import Reports from "./pages/Reports";
import Finance from "./pages/Finance";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/site/:siteId" element={<SiteCommandCenter />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/installations" element={<Installations />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
