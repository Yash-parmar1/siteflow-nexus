import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import SiteCommandCenter from "./pages/SiteCommandCenter";
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
            <Route path="/site/:siteId" element={<SiteCommandCenter />} />
            {/* Placeholder routes */}
            <Route path="/assets" element={<PlaceholderPage title="Assets (ACS)" />} />
            <Route path="/installations" element={<PlaceholderPage title="Installations" />} />
            <Route path="/maintenance" element={<PlaceholderPage title="Maintenance" />} />
            <Route path="/vendors" element={<PlaceholderPage title="Vendors" />} />
            <Route path="/clients" element={<PlaceholderPage title="Clients" />} />
            <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
            <Route path="/finance" element={<PlaceholderPage title="Finance" />} />
            <Route path="/admin" element={<PlaceholderPage title="Admin" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-foreground mb-2">{title}</h1>
        <p className="text-muted-foreground">This module is under development</p>
      </div>
    </div>
  );
}

export default App;
