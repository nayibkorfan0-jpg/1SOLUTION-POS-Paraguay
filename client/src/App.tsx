import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Dashboard } from "@/components/Dashboard";
import { ThemeToggle } from "@/components/ThemeToggle";
import NotFound from "@/pages/not-found";
import ConfiguracionPage from "@/pages/configuracion";
import ServiciosPage from "@/pages/servicios";
import OrdenesPage from "@/pages/ordenes";
import ClientesPage from "@/pages/clientes";
import InventarioPage from "@/pages/inventario";
import VentasPage from "@/pages/ventas";
import ReportesPage from "@/pages/reportes";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Dashboard />} />
      <Route path="/dashboard" component={() => <Dashboard />} />
      <Route path="/ordenes" component={() => <OrdenesPage />} />
      <Route path="/clientes" component={() => <ClientesPage />} />
      <Route path="/servicios" component={() => <ServiciosPage />} />
      <Route path="/inventario" component={() => <InventarioPage />} />
      <Route path="/ventas" component={() => <VentasPage />} />
      <Route path="/reportes" component={() => <ReportesPage />} />
      <Route path="/configuracion" component={() => <ConfiguracionPage />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1">
              <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-auto">
                <div className="container mx-auto p-6">
                  <Router />
                </div>
              </main>
            </div>
          </div>
          <Toaster />
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
