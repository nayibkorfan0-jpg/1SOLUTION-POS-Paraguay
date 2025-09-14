import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import SaleDialog from "@/components/SaleDialog";
import { 
  Car, 
  Plus, 
  Edit, 
  Clock, 
  DollarSign, 
  Search,
  Filter,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  Pause,
  Play,
  Eye,
  CreditCard
} from "lucide-react";
import { insertWorkOrderSchema, type WorkOrder, type Customer, type Vehicle, type Service } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Work order form schema
const workOrderFormSchema = insertWorkOrderSchema.extend({
  customerName: z.string().optional(),
  vehicleInfo: z.string().optional(),
});

type WorkOrderFormData = z.infer<typeof workOrderFormSchema>;

// Status configuration
const statusConfig = {
  recibido: { 
    label: "Recibido", 
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    icon: Clock 
  },
  "en-proceso": { 
    label: "En Proceso", 
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    icon: Play 
  },
  listo: { 
    label: "Listo", 
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: CheckCircle 
  },
  entregado: { 
    label: "Entregado", 
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    icon: CheckCircle 
  }
};

// Format price for Paraguay (Guaraní)
const formatPrice = (price: number | string) => {
  const numPrice = typeof price === 'string' ? parseInt(price) : price;
  return `Gs. ${numPrice.toLocaleString('es-PY')}`;
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-PY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function OrdenesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [sellingOrder, setSellingOrder] = useState<WorkOrder | null>(null);

  // Mock data - will be replaced with real API calls
  const mockWorkOrders: WorkOrder[] = [
    {
      id: "1",
      numero: 1001,
      customerId: "c1",
      vehicleId: "v1",
      estado: "recibido",
      fechaEntrada: new Date(),
      fechaInicio: null,
      fechaFin: null,
      fechaEntrega: null,
      observaciones: "Cliente solicita lavado completo",
      total: "75000",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      numero: 1002,
      customerId: "c2",
      vehicleId: "v2",
      estado: "en-proceso",
      fechaEntrada: new Date(Date.now() - 2 * 60 * 60 * 1000),
      fechaInicio: new Date(Date.now() - 1 * 60 * 60 * 1000),
      fechaFin: null,
      fechaEntrega: null,
      observaciones: null,
      total: "120000",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
      id: "3",
      numero: 1003,
      customerId: "c3",
      vehicleId: "v3",
      estado: "listo",
      fechaEntrada: new Date(Date.now() - 4 * 60 * 60 * 1000),
      fechaInicio: new Date(Date.now() - 3 * 60 * 60 * 1000),
      fechaFin: new Date(Date.now() - 30 * 60 * 1000),
      fechaEntrega: null,
      observaciones: null,
      total: "95000",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000),
    }
  ];

  // Mock customer/vehicle data
  const mockCustomers: Record<string, Customer> = {
    c1: { 
      id: "c1", 
      nombre: "Juan Pérez", 
      docTipo: "cedula",
      docNumero: "12345678", 
      regimenTurismo: false,
      direccion: null,
      telefono: null,
      email: null,
      pais: null,
      pasaporte: null,
      fechaIngreso: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    c2: { 
      id: "c2", 
      nombre: "María González", 
      docTipo: "cedula",
      docNumero: "87654321", 
      regimenTurismo: false,
      direccion: null,
      telefono: null,
      email: null,
      pais: null,
      pasaporte: null,
      fechaIngreso: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    c3: { 
      id: "c3", 
      nombre: "Carlos Silva", 
      docTipo: "cedula",
      docNumero: "11223344", 
      regimenTurismo: false,
      direccion: null,
      telefono: null,
      email: null,
      pais: null,
      pasaporte: null,
      fechaIngreso: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  };

  const mockVehicles = {
    v1: { placa: "ABC123", marca: "Toyota", modelo: "Hilux", color: "Blanco" },
    v2: { placa: "XYZ789", marca: "Chevrolet", modelo: "Onix", color: "Rojo" },
    v3: { placa: "DEF456", marca: "Nissan", modelo: "Sentra", color: "Azul" }
  };

  // Mock services data
  const mockServices: Service[] = [
    { 
      id: "srv1", 
      nombre: "Lavado Básico", 
      descripcion: "Lavado exterior básico", 
      precio: "35000", 
      duracionMin: 30,
      categoria: "basico", 
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    { 
      id: "srv2", 
      nombre: "Lavado Premium", 
      descripcion: "Lavado completo con encerado", 
      precio: "65000", 
      duracionMin: 60,
      categoria: "premium", 
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    { 
      id: "srv3", 
      nombre: "Encerado", 
      descripcion: "Aplicación de cera protectora", 
      precio: "45000", 
      duracionMin: 45,
      categoria: "encerado", 
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    { 
      id: "srv4", 
      nombre: "Limpieza Motor", 
      descripcion: "Desengrase y limpieza de motor", 
      precio: "25000", 
      duracionMin: 20,
      categoria: "motor", 
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    { 
      id: "srv5", 
      nombre: "Limpieza Tapizado", 
      descripcion: "Aspirado y limpieza de asientos", 
      precio: "55000", 
      duracionMin: 40,
      categoria: "tapizado", 
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  // Simulated queries - will be replaced with real API calls
  const { data: workOrders = mockWorkOrders, isLoading } = useQuery({
    queryKey: ['/api/work-orders'],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockWorkOrders;
    }
  });

  // Filter work orders
  const filteredOrders = workOrders.filter(order => {
    const customer = mockCustomers[order.customerId as keyof typeof mockCustomers];
    const vehicle = mockVehicles[order.vehicleId as keyof typeof mockVehicles];
    
    const matchesSearch = 
      order.numero.toString().includes(searchTerm) ||
      customer?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle?.placa.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || order.estado === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Form setup
  const form = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderFormSchema),
    defaultValues: {
      customerId: "",
      vehicleId: "",
      estado: "recibido",
      observaciones: "",
      total: "0",
    },
  });

  // Mock mutations - will be replaced with real API calls
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...data, id: Date.now().toString(), numero: 1004 };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders'] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Orden creada",
        description: "La orden de servicio se ha creado correctamente.",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { id, newStatus };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-orders'] });
      toast({
        title: "Estado actualizado",
        description: "El estado de la orden se ha actualizado correctamente.",
      });
    },
  });

  const onSubmit = (data: WorkOrderFormData) => {
    createMutation.mutate(data);
  };

  // Handle opening sale dialog
  const handleSale = (order: WorkOrder) => {
    setSellingOrder(order);
    setIsSaleDialogOpen(true);
  };

  // Handle closing sale dialog
  const handleCloseSaleDialog = () => {
    setSellingOrder(null);
    setIsSaleDialogOpen(false);
  };

  // Handle opening dialog for editing
  const openDialog = (order?: WorkOrder) => {
    if (order) {
      setEditingOrder(order);
      form.reset({
        customerId: order.customerId,
        vehicleId: order.vehicleId,
        estado: order.estado,
        observaciones: order.observaciones || "",
        total: order.total,
      });
    } else {
      setEditingOrder(null);
      form.reset();
    }
    setIsDialogOpen(true);
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: orderId, newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Car className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold text-foreground" data-testid="text-orders-title">
              Órdenes de Servicio
            </h1>
            <p className="text-muted-foreground" data-testid="text-orders-subtitle">
              Gestione las órdenes de trabajo del lavadero
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()} data-testid="button-add-order">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Orden
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingOrder ? "Editar Orden" : "Nueva Orden de Servicio"}
              </DialogTitle>
              <DialogDescription>
                {editingOrder ? "Modifique los datos de la orden" : "Registre una nueva orden de servicio"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-customer">
                            <SelectValue placeholder="Seleccione un cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="c1">Juan Pérez (12345678)</SelectItem>
                          <SelectItem value="c2">María González (87654321)</SelectItem>
                          <SelectItem value="c3">Carlos Silva (11223344)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehículo *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-vehicle">
                            <SelectValue placeholder="Seleccione un vehículo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="v1">ABC123 - Toyota Hilux Blanco</SelectItem>
                          <SelectItem value="v2">XYZ789 - Chevrolet Onix Rojo</SelectItem>
                          <SelectItem value="v3">DEF456 - Nissan Sentra Azul</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observaciones"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observaciones</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observaciones especiales..." 
                          {...field} 
                          value={field.value || ""}
                          data-testid="input-observations"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-order"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-save-order"
                  >
                    {createMutation.isPending ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      editingOrder ? "Actualizar" : "Crear Orden"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número, cliente o placa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-orders"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40" data-testid="select-filter-status">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="recibido">Recibido</SelectItem>
                  <SelectItem value="en-proceso">En Proceso</SelectItem>
                  <SelectItem value="listo">Listo</SelectItem>
                  <SelectItem value="entregado">Entregado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((order) => {
          const customer = mockCustomers[order.customerId as keyof typeof mockCustomers];
          const vehicle = mockVehicles[order.vehicleId as keyof typeof mockVehicles];
          const status = statusConfig[order.estado as keyof typeof statusConfig];
          const StatusIcon = status.icon;

          return (
            <Card key={order.id} className="hover-elevate" data-testid={`card-order-${order.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-lg" data-testid={`text-order-number-${order.id}`}>
                      #{order.numero}
                    </span>
                  </div>
                  <Badge className={status.color} data-testid={`badge-status-${order.id}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium" data-testid={`text-customer-${order.id}`}>
                      {customer?.nombre}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm" data-testid={`text-vehicle-${order.id}`}>
                      {vehicle?.placa} - {vehicle?.marca} {vehicle?.modelo}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm" data-testid={`text-date-${order.id}`}>
                      {formatDate(order.fechaEntrada.toISOString())}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-600" data-testid={`text-total-${order.id}`}>
                      {formatPrice(order.total)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {/* View details */}}
                      data-testid={`button-view-${order.id}`}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openDialog(order)}
                      data-testid={`button-edit-${order.id}`}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {order.observaciones && (
                  <div className="mt-3 p-2 bg-muted rounded text-sm" data-testid={`text-observations-${order.id}`}>
                    {order.observaciones}
                  </div>
                )}

                {/* Status Actions */}
                <div className="flex gap-1 mt-3">
                  {order.estado === "recibido" && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusChange(order.id, "en-proceso")}
                      data-testid={`button-start-${order.id}`}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Iniciar
                    </Button>
                  )}
                  {order.estado === "en-proceso" && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusChange(order.id, "listo")}
                      data-testid={`button-finish-${order.id}`}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Finalizar
                    </Button>
                  )}
                  {order.estado === "listo" && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusChange(order.id, "entregado")}
                        data-testid={`button-deliver-${order.id}`}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Entregar
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleSale(order)}
                        data-testid={`button-sell-${order.id}`}
                        className="ml-1"
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        Vender
                      </Button>
                    </>
                  )}
                  {order.estado === "entregado" && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleSale(order)}
                      data-testid={`button-sell-delivered-${order.id}`}
                    >
                      <CreditCard className="h-3 w-3 mr-1" />
                      Vender
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <Card className="p-8 text-center">
          <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No se encontraron órdenes
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm || filterStatus !== "all" 
              ? "No hay órdenes que coincidan con los filtros aplicados."
              : "Aún no hay órdenes registradas en el sistema."
            }
          </p>
          {(!searchTerm && filterStatus === "all") && (
            <Button onClick={() => openDialog()} data-testid="button-add-first-order">
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Orden
            </Button>
          )}
        </Card>
      )}

      {/* Sale Dialog */}
      <SaleDialog
        isOpen={isSaleDialogOpen}
        onClose={handleCloseSaleDialog}
        workOrder={sellingOrder}
        customer={sellingOrder ? mockCustomers[sellingOrder.customerId] || null : null}
        services={mockServices}
      />
    </div>
  );
}