import { MetricCard } from "./MetricCard";
import { TimbradoAlert } from "./TimbradoAlert";
import { RecentSales } from "./RecentSales";
import { ServicePopular } from "./ServicePopular";
import { InventoryAlerts } from "./InventoryAlerts";
import { formatDateTime } from "@/lib/utils";
import { DollarSign, Car, Users, Package, Settings, Building2 } from "lucide-react";
import logoUrl from "@assets/Gemini_Generated_Image_kwl7qlkwl7qlkwl7_1757809609665.png";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { type CompanyConfig } from "@shared/schema";

export function Dashboard() {
  const currentDateTime = new Date();
  
  // Fetch company configuration for header display
  const { data: config } = useQuery<CompanyConfig | null>({
    queryKey: ['/api/company-config'],
  });
  
  // Get company display name for subtitle - show real company data
  const getCompanyDisplayName = () => {
    if (!config) return 'Empresa no configurada';
    
    const companyName = config.nombreFantasia || config.razonSocial;
    return companyName || 'Empresa no configurada';
  };
  
  const getCompanySubtitle = () => {
    if (!config) return 'Gestión completa del negocio • Configure los datos de su empresa';
    
    const parts = [];
    // Add company name first
    const companyName = config.nombreFantasia || config.razonSocial;
    if (companyName) parts.push(companyName);
    
    // Add location
    if (config.ciudad) parts.push(config.ciudad);
    
    // Add RUC
    if (config.ruc) parts.push(`RUC: ${config.ruc}`);
    
    return parts.length > 0 ? parts.join(' • ') : 'Gestión completa del negocio';
  };
  
  // Mock data for the dashboard - todo: remove mock functionality
  const mockMetrics = [
    {
      title: "Ventas de Hoy",
      value: "Gs. 1.250.000",
      icon: <DollarSign />,
      trend: { value: '+12%', type: 'up' as const }
    },
    {
      title: "Servicios Realizados", 
      value: "23",
      icon: <Car />,
      trend: { value: '+5', type: 'up' as const, label: 'vs ayer' }
    },
    {
      title: "Clientes Atendidos",
      value: "18", 
      icon: <Users />,
      trend: { value: '+3', type: 'up' as const, label: 'nuevos' }
    },
    {
      title: "Stock Crítico",
      value: "4",
      icon: <Package />,
      trend: { value: 'Productos', type: 'down' as const }
    }
  ];

  const mockSales = [
    {
      id: '001234',
      client: 'María González',
      time: '10:30',
      service: 'Lavado Full Detail',
      vehicle: 'SUV',
      status: 'completado' as const,
      amount: 45000,
      orderNumber: '#001234'
    },
    {
      id: '001235',
      client: 'Carlos Mendoza',
      time: '11:15',
      service: 'Lavado Básico',
      vehicle: 'Auto',
      status: 'en-proceso' as const,
      amount: 25000,
      orderNumber: '#001235'
    },
    {
      id: '001236',
      client: 'Ana Rodríguez',
      time: '12:00',
      service: 'Pulido + Inyección',
      vehicle: 'Camioneta',
      status: 'completado' as const,
      amount: 85000,
      orderNumber: '#001236'
    },
    {
      id: '001237',
      client: 'Roberto Silva',
      time: '12:30',
      service: 'Aspirado',
      vehicle: 'Moto',
      status: 'completado' as const,
      amount: 15000,
      orderNumber: '#001237'
    },
    {
      id: '001238',
      client: 'Lucia Benítez',
      time: '13:45',
      service: 'Paquete Turismo',
      vehicle: 'Auto',
      status: 'pendiente' as const,
      amount: 60000,
      orderNumber: '#001238'
    }
  ];

  const mockServices = [
    {
      name: 'Lavado Full Detail',
      count: 12,
      revenue: 540000,
      vehicleBreakdown: { auto: 8, suv: 3, camioneta: 1, moto: 0 },
      percentage: 35
    },
    {
      name: 'Lavado Básico',
      count: 8,
      revenue: 200000,
      vehicleBreakdown: { auto: 6, suv: 0, camioneta: 0, moto: 2 },
      percentage: 25
    },
    {
      name: 'Pulido',
      count: 6,
      revenue: 360000,
      vehicleBreakdown: { auto: 4, suv: 2, camioneta: 0, moto: 0 },
      percentage: 20
    },
    {
      name: 'Aspirado',
      count: 4,
      revenue: 60000,
      vehicleBreakdown: { auto: 2, suv: 0, camioneta: 0, moto: 2 },
      percentage: 15
    },
    {
      name: 'Tratamiento Anti-Hongos',
      count: 2,
      revenue: 80000,
      vehicleBreakdown: { auto: 1, suv: 1, camioneta: 0, moto: 0 },
      percentage: 5
    }
  ];

  const mockInventoryItems = [
    {
      id: '1',
      name: 'Shampoo para Autos',
      currentStock: 5,
      minStock: 10,
      unit: 'litros',
      supplier: 'AutoLimpieza S.A.',
      lastOrder: '15/01/2024',
      status: 'critico' as const
    },
    {
      id: '2',
      name: 'Paños de Microfibra',
      currentStock: 12,
      minStock: 20,
      unit: 'unidades',
      supplier: 'Textiles del Este',
      lastOrder: '10/01/2024',
      status: 'bajo' as const
    },
    {
      id: '3',
      name: 'Cera Líquida',
      currentStock: 2,
      minStock: 8,
      unit: 'litros',
      supplier: 'AutoLimpieza S.A.',
      lastOrder: '08/01/2024',
      status: 'critico' as const
    },
    {
      id: '4',
      name: 'Desinfectante',
      currentStock: 8,
      minStock: 15,
      unit: 'litros',
      supplier: 'Químicos Paraguay',
      lastOrder: '12/01/2024',
      status: 'bajo' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
            <img 
              src={config?.logoPath || logoUrl}
              alt={config?.logoPath ? `${config.razonSocial || config.nombreFantasia || 'Empresa'} - Logo` : "1SOLUTION - Sistema de gestión para lavaderos"}
              className="w-10 h-10 object-contain"
              data-testid="img-logo-dashboard"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                const currentSrc = img.src;
                
                // Triple fallback: company logo → 1SOLUTION logo → Building2 icon
                if (config?.logoPath && currentSrc.includes(config.logoPath)) {
                  // First fallback: company logo failed, try 1SOLUTION logo
                  img.src = logoUrl;
                  img.alt = "1SOLUTION - Sistema de gestión para lavaderos";
                } else if (currentSrc.includes('Gemini_Generated_Image')) {
                  // Second fallback: 1SOLUTION logo failed, show Building2 icon
                  img.style.display = 'none';
                  img.nextElementSibling?.classList.remove('hidden');
                } else {
                  // Final fallback: show Building2 icon
                  img.style.display = 'none';
                  img.nextElementSibling?.classList.remove('hidden');
                }
              }}
            />
            <Building2 className="h-6 w-6 text-primary hidden" data-testid="icon-logo-fallback" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground" data-testid="text-dashboard-title">
              Dashboard - 1SOLUTION
            </h1>
            <p className="text-muted-foreground" data-testid="text-dashboard-subtitle">
              {getCompanySubtitle()}
            </p>
            {config && (
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                {config.establecimiento && config.puntoExpedicion && (
                  <span>Timbrado: {config.establecimiento}-{config.puntoExpedicion}</span>
                )}
                {config.moneda && (
                  <span>Moneda: {config.moneda}</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground" data-testid="text-current-time">
              {formatDateTime(currentDateTime)}
            </p>
          </div>
          <Button
            size="icon"
            variant="outline"
            data-testid="button-settings"
            onClick={() => console.log('Navigate to settings')}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timbrado Alert */}
      <TimbradoAlert />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockMetrics.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            trend={metric.trend}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <RecentSales sales={mockSales} total={230000} />
          <ServicePopular
            services={mockServices}
            totalServices={32}
            totalRevenue={1240000}
            mostPopular="Lavado Full Detail"
          />
        </div>

        {/* Right Column */}
        <div>
          <InventoryAlerts
            items={mockInventoryItems}
            totalProducts={24}
            criticalCount={2}
            lowCount={2}
          />
        </div>
      </div>
    </div>
  );
}