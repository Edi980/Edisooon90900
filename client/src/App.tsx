import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import { MobileDashboard } from "@/components/MobileDashboard";
import { useMobile } from "@/hooks/useMobile";
import NotFound from "@/pages/not-found";

function Router() {
  const isMobile = useMobile();
  
  return (
    <Switch>
      <Route path="/" component={() => isMobile ? <MobileDashboard /> : <Dashboard />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
