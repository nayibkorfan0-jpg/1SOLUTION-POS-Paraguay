import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Car,
  Calendar,
  Download,
  Eye,
  Star,
  Clock,
  Package,
  CreditCard,
  FileText,
  RefreshCw
} from "lucide-react";

// Mock data for reports
const mockSalesData = {
  daily: [
    { date: "2024-01-15", amount: 450000, orders: 8 },
    { date: "2024-01-16", amount: 320000, orders: 6 },
    { date: "2024-01-17", amount: 580000, orders: 12 },
    { date: "2024-01-18", amount: 720000, orders: 15 },
    { date: "2024-01-19", amount: 390000, orders: 7 },
    { date: "2024-01-20", amount: 650000, orders: 11 },
    { date: "2024-01-21", amount: 480000, orders: 9 },
  ],
  monthly: [
    { month: "Nov 2023", amount: 12500000, orders: 180 },
    { month: "Dic 2023", amount: 14200000, orders: 195 },
    { month: "Ene 2024", amount: 15800000, orders: 220 },
  ]
};

const mockServicesData = [
  { id: 1, name: "Lavado Básico", count: 145, revenue: 5075000, percentage: 32 },
  { id: 2, name: "Lavado Premium", count: 89, revenue: 5785000, percentage: 28 },
  { id: 3, name: "Combo Completo", count: 67, revenue: 8040000, percentage: 24 },
  { id: 4, name: "Encerado", count: 78, revenue: 3510000, percentage: 18 },
  { id: 5, name: "Motor", count: 95, revenue: 2375000, percentage: 15 },
];

const mockCustomersData = [
  { id: 1, name: "Juan Pérez", visits: 12, spent: 850000, lastVisit: "2024-01-20" },
  { id: 2, name: "María González", visits: 8, spent: 640000, lastVisit: "2024-01-19" },
  { id: 3, name: "Carlos Silva", visits: 15, spent: 1200000, lastVisit: "2024-01-21" },
  { id: 4, name: "Ana López", visits: 6, spent: 480000, lastVisit: "2024-01-18" },
  { id: 5, name: "Roberto Díaz", visits: 9, spent: 720000, lastVisit: "2024-01-17" },
];

const mockInventoryAlerts = [
  { id: 1, product: "Shampoo Auto", current: 5, minimum: 10, status: "critical" },
  { id: 2, product: "Cera Líquida", current: 0, minimum: 5, status: "out" },
  { id: 3, product: "Microfibra", current: 8, minimum: 15, status: "low" },
  { id: 4, product: "Desengrasante", current: 3, minimum: 8, status: "low" },
];

// Format price for Paraguay (Guaraní)
const formatPrice = (price: number) => {
  return `Gs. ${price.toLocaleString('es-PY')}`;
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-PY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function ReportesPage() {
  const [period, setPeriod] = useState<string>("week");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Simulated queries
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['/api/reports/sales', period],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockSalesData;
    }
  });

  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ['/api/reports/services'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockServicesData;
    }
  });

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['/api/reports/customers'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      return mockCustomersData;
    }
  });

  // Calculate current period stats
  const currentWeekSales = mockSalesData.daily.reduce((sum, day) => sum + day.amount, 0);
  const currentWeekOrders = mockSalesData.daily.reduce((sum, day) => sum + day.orders, 0);
  const avgOrderValue = currentWeekOrders > 0 ? Math.round(currentWeekSales / currentWeekOrders) : 0;
  const totalCustomers = mockCustomersData.length;

  if (salesLoading || servicesLoading || customersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold text-foreground" data-testid="text-reports-title">
              Reportes de Negocio
            </h1>
            <p className="text-muted-foreground" data-testid="text-reports-subtitle">
              Análisis de ventas, servicios y rendimiento
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-export-report">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" data-testid="button-refresh-reports">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32" data-testid="select-period">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Hoy</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mes</SelectItem>
                  <SelectItem value="quarter">Trimestre</SelectItem>
                  <SelectItem value="year">Año</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              
              {period === "custom" && (
                <>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-40"
                    placeholder="Desde"
                    data-testid="input-date-from"
                  />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-40"
                    placeholder="Hasta"
                    data-testid="input-date-to"
                  />
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Ventas del Período</p>
                <p className="text-2xl font-semibold text-green-600" data-testid="metric-period-sales">
                  {formatPrice(currentWeekSales)}
                </p>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">+12% vs anterior</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Car className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Órdenes Completadas</p>
                <p className="text-2xl font-semibold text-blue-600" data-testid="metric-orders-completed">
                  {currentWeekOrders}
                </p>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">+8% vs anterior</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                <p className="text-2xl font-semibold text-purple-600" data-testid="metric-average-ticket">
                  {formatPrice(avgOrderValue)}
                </p>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">+3% vs anterior</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Clientes Activos</p>
                <p className="text-2xl font-semibold text-orange-600" data-testid="metric-active-customers">
                  {totalCustomers}
                </p>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">+5% vs anterior</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Ventas por Día
            </CardTitle>
            <CardDescription>
              Evolución de ventas en los últimos 7 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockSalesData.daily.map((day, index) => {
                const maxAmount = Math.max(...mockSalesData.daily.map(d => d.amount));
                const percentage = (day.amount / maxAmount) * 100;
                
                return (
                  <div key={index} className="space-y-2" data-testid={`sales-bar-${index}`}>
                    <div className="flex justify-between text-sm">
                      <span>{formatDate(day.date)}</span>
                      <span className="font-medium">{formatPrice(day.amount)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{day.orders} órdenes</span>
                      <span>{formatPrice(Math.round(day.amount / day.orders))} promedio</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Servicios Más Populares
            </CardTitle>
            <CardDescription>
              Ranking de servicios por ingresos generados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockServicesData.map((service, index) => (
                <div key={service.id} className="flex items-center gap-3" data-testid={`service-rank-${index}`}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-amber-600' :
                    'bg-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{service.name}</span>
                      <span className="text-sm text-green-600 font-medium">
                        {formatPrice(service.revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{service.count} servicios</span>
                      <span>{service.percentage}% del total</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mejores Clientes
            </CardTitle>
            <CardDescription>
              Clientes con mayor facturación y frecuencia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockCustomersData.map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between p-3 border rounded" data-testid={`top-customer-${index}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {customer.visits} visitas • Última: {formatDate(customer.lastVisit)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatPrice(customer.spent)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(Math.round(customer.spent / customer.visits))} promedio
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Alertas de Inventario
            </CardTitle>
            <CardDescription>
              Productos con stock crítico o agotado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockInventoryAlerts.map((alert, index) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded" data-testid={`inventory-alert-${index}`}>
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{alert.product}</p>
                      <p className="text-sm text-muted-foreground">
                        Stock actual: {alert.current} | Mínimo: {alert.minimum}
                      </p>
                    </div>
                  </div>
                  <Badge className={
                    alert.status === 'out' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : alert.status === 'critical'
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }>
                    {alert.status === 'out' ? 'Agotado' : 
                     alert.status === 'critical' ? 'Crítico' : 'Bajo'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Acciones Rápidas
          </CardTitle>
          <CardDescription>
            Enlaces rápidos a reportes detallados y exportaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" data-testid="button-sales-report">
              <DollarSign className="h-6 w-6 text-green-600" />
              <span className="text-sm font-medium">Reporte de Ventas</span>
              <span className="text-xs text-muted-foreground">Detallado por período</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" data-testid="button-services-report">
              <Star className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium">Análisis de Servicios</span>
              <span className="text-xs text-muted-foreground">Popularidad y rentabilidad</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" data-testid="button-customers-report">
              <Users className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium">Reporte de Clientes</span>
              <span className="text-xs text-muted-foreground">Segmentación y valor</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" data-testid="button-inventory-report">
              <Package className="h-6 w-6 text-orange-600" />
              <span className="text-sm font-medium">Control de Stock</span>
              <span className="text-xs text-muted-foreground">Movimientos y alertas</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}