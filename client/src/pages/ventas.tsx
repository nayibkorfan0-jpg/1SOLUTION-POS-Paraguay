import { useState, useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Search,
  Filter,
  AlertTriangle,
  DollarSign,
  User,
  Calendar,
  Car,
  FileText,
  Trash2,
  ShoppingCart,
  Eye,
  Download,
  Calculator
} from "lucide-react";
import { insertSaleSchema, type Sale, type Customer, type Service, type WorkOrder } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Sale form schema
const saleFormSchema = insertSaleSchema.extend({
  items: z.array(z.object({
    type: z.enum(['service', 'combo']),
    id: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.number().min(1),
  })).min(1, "Debe agregar al menos un item"),
});

type SaleFormData = z.infer<typeof saleFormSchema>;

// Payment methods
const paymentMethods = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta de Crédito/Débito" },
  { value: "transferencia", label: "Transferencia Bancaria" },
  { value: "cuenta", label: "Cuenta Corriente" },
];

// Mock data
const mockSales: Sale[] = [
  {
    id: "s1",
    numeroFactura: "001-001-0000001",
    customerId: "c1",
    workOrderId: "wo1",
    fecha: new Date().toISOString(),
    subtotal: "65000",
    impuestos: "6500",
    total: "71500",
    medioPago: "efectivo",
    regimenTurismo: false,
    timbradoUsado: "12345678",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "s2",
    numeroFactura: "001-001-0000002",
    customerId: "c2",
    workOrderId: null,
    fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    subtotal: "120000",
    impuestos: "12000",
    total: "132000",
    medioPago: "tarjeta",
    regimenTurismo: false,
    timbradoUsado: "12345678",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "s3",
    numeroFactura: "001-001-0000003",
    customerId: "c4",
    workOrderId: "wo3",
    fecha: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    subtotal: "95000",
    impuestos: "0",
    total: "95000",
    medioPago: "efectivo",
    regimenTurismo: true,
    timbradoUsado: "12345678",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockCustomers = {
  c1: { nombre: "Juan Pérez", docNumero: "12345678", regimenTurismo: false },
  c2: { nombre: "María González", docNumero: "87654321", regimenTurismo: false },
  c3: { nombre: "Carlos Silva", docNumero: "11223344", regimenTurismo: false },
  c4: { nombre: "John Smith", docNumero: "US123456789", regimenTurismo: true },
};

const mockServices = [
  { id: "srv1", nombre: "Lavado Básico", precio: 35000 },
  { id: "srv2", nombre: "Lavado Premium", precio: 65000 },
  { id: "srv3", nombre: "Encerado", precio: 45000 },
  { id: "srv4", nombre: "Motor", precio: 25000 },
  { id: "srv5", nombre: "Tapizado", precio: 55000 },
];

const mockCombos = [
  { id: "cmb1", nombre: "Combo Completo", precio: 120000 },
  { id: "cmb2", nombre: "Combo Premium", precio: 95000 },
];

// Tax rate (10% IVA in Paraguay)
const TAX_RATE = 0.10;

// Format price for Paraguay (Guaraní)
const formatPrice = (price: number | string) => {
  const numPrice = typeof price === 'string' ? parseInt(price) : price;
  return `Gs. ${numPrice.toLocaleString('es-PY')}`;
};

export default function VentasPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPayment, setFilterPayment] = useState<string>("all");
  const [filterTourism, setFilterTourism] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [timbradoStatus, setTimbradoStatus] = useState<{ isValid: boolean; error?: string }>({ isValid: true });

  // Check timbrado status on load
  useEffect(() => {
    // Mock timbrado validation - in real app would check actual timbrado
    const mockTimbradoCheck = () => {
      const today = new Date();
      const timbradoEnd = new Date('2024-12-31'); // Mock expiry date
      const isValid = today <= timbradoEnd;
      
      setTimbradoStatus({
        isValid,
        error: isValid ? undefined : "Timbrado vencido - No se pueden emitir facturas"
      });
    };
    
    mockTimbradoCheck();
  }, []);

  // Simulated queries
  const { data: sales = mockSales, isLoading } = useQuery({
    queryKey: ['/api/sales'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockSales;
    }
  });

  // Filter sales
  const filteredSales = sales.filter(sale => {
    const customer = mockCustomers[sale.customerId as keyof typeof mockCustomers];
    
    const matchesSearch = 
      sale.numeroFactura.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer?.docNumero.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPayment = filterPayment === "all" || sale.medioPago === filterPayment;
    const matchesTourism = filterTourism === "all" || 
      (filterTourism === "tourism" && sale.regimenTurismo) ||
      (filterTourism === "local" && !sale.regimenTurismo);
    
    return matchesSearch && matchesPayment && matchesTourism;
  });

  // Calculate stats
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todaySales = sales.filter(sale => new Date(sale.fecha) >= startOfDay);
  const totalToday = todaySales.reduce((sum, sale) => sum + parseInt(sale.total), 0);

  // Form setup
  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      customerId: "",
      workOrderId: "",
      medioPago: "efectivo",
      regimenTurismo: false,
      items: [],
    },
  });

  // Watch customer to set tourism regime
  const watchCustomer = form.watch("customerId");
  const watchItems = form.watch("items");

  useEffect(() => {
    if (watchCustomer) {
      const customer = mockCustomers[watchCustomer as keyof typeof mockCustomers];
      if (customer) {
        form.setValue("regimenTurismo", customer.regimenTurismo);
      }
    }
  }, [watchCustomer, form]);

  // Calculate totals
  const subtotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const isLocalCustomer = !form.watch("regimenTurismo");
  const taxes = isLocalCustomer ? Math.round(subtotal * TAX_RATE) : 0;
  const total = subtotal + taxes;

  // Mock mutations
  const createMutation = useMutation({
    mutationFn: async (data: SaleFormData) => {
      if (!timbradoStatus.isValid) {
        throw new Error("No se puede facturar con timbrado vencido");
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { 
        ...data, 
        id: Date.now().toString(), 
        numeroFactura: `001-001-${String(sales.length + 1).padStart(7, '0')}`,
        fecha: new Date().toISOString(),
        subtotal: subtotal.toString(),
        impuestos: taxes.toString(),
        total: total.toString(),
        timbradoUsado: "12345678",
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      setIsDialogOpen(false);
      setSelectedItems([]);
      form.reset();
      toast({
        title: "Venta registrada",
        description: "La factura se ha generado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al procesar venta",
        description: error.message || "No se pudo procesar la venta.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SaleFormData) => {
    const saleData = {
      ...data,
      items: selectedItems,
    };
    createMutation.mutate(saleData);
  };

  const addItem = (type: 'service' | 'combo', id: string, name: string, price: number) => {
    const existingItem = selectedItems.find(item => item.id === id && item.type === type);
    if (existingItem) {
      setSelectedItems(items => 
        items.map(item => 
          item.id === id && item.type === type 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedItems(items => [...items, { type, id, name, price, quantity: 1 }]);
    }
  };

  const removeItem = (type: string, id: string) => {
    setSelectedItems(items => items.filter(item => !(item.id === id && item.type === type)));
  };

  const updateQuantity = (type: string, id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(type, id);
      return;
    }
    setSelectedItems(items => 
      items.map(item => 
        item.id === id && item.type === type 
          ? { ...item, quantity }
          : item
      )
    );
  };

  const openDialog = () => {
    setEditingSale(null);
    setSelectedItems([]);
    form.reset();
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando ventas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold text-foreground" data-testid="text-sales-title">
              Punto de Venta
            </h1>
            <p className="text-muted-foreground" data-testid="text-sales-subtitle">
              Facturación y registro de ventas
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={openDialog} 
              disabled={!timbradoStatus.isValid}
              data-testid="button-new-sale"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Venta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Venta</DialogTitle>
              <DialogDescription>
                Registre una nueva venta y genere la factura correspondiente
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                            {Object.entries(mockCustomers).map(([id, customer]) => (
                              <SelectItem key={id} value={id}>
                                {customer.nombre} ({customer.docNumero})
                                {customer.regimenTurismo && " - Turista"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="medioPago"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medio de Pago *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-payment-method">
                              <SelectValue placeholder="Seleccione el medio de pago" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {paymentMethods.map((method) => (
                              <SelectItem key={method.value} value={method.value}>
                                {method.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Services Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Servicios</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {mockServices.map((service) => (
                      <Button
                        key={service.id}
                        type="button"
                        variant="outline"
                        onClick={() => addItem('service', service.id, service.nombre, service.precio)}
                        className="h-auto p-3 flex flex-col items-start"
                        data-testid={`button-add-service-${service.id}`}
                      >
                        <span className="font-medium">{service.nombre}</span>
                        <span className="text-sm text-muted-foreground">{formatPrice(service.precio)}</span>
                      </Button>
                    ))}
                  </div>

                  <h3 className="text-lg font-semibold">Combos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {mockCombos.map((combo) => (
                      <Button
                        key={combo.id}
                        type="button"
                        variant="outline"
                        onClick={() => addItem('combo', combo.id, combo.nombre, combo.precio)}
                        className="h-auto p-3 flex flex-col items-start"
                        data-testid={`button-add-combo-${combo.id}`}
                      >
                        <span className="font-medium">{combo.nombre}</span>
                        <span className="text-sm text-muted-foreground">{formatPrice(combo.precio)}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Selected Items */}
                {selectedItems.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Items Seleccionados</h3>
                    <div className="space-y-2">
                      {selectedItems.map((item, index) => (
                        <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-3 border rounded" data-testid={`item-${item.type}-${item.id}`}>
                          <div className="flex-1">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              ({item.type === 'service' ? 'Servicio' : 'Combo'})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.type, item.id, parseInt(e.target.value) || 0)}
                              className="w-16"
                              data-testid={`input-quantity-${item.type}-${item.id}`}
                            />
                            <span className="font-medium min-w-24 text-right">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(item.type, item.id)}
                              data-testid={`button-remove-${item.type}-${item.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="p-4 bg-muted rounded space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-medium" data-testid="text-subtotal">{formatPrice(subtotal)}</span>
                      </div>
                      {isLocalCustomer && (
                        <div className="flex justify-between">
                          <span>IVA (10%):</span>
                          <span className="font-medium" data-testid="text-taxes">{formatPrice(taxes)}</span>
                        </div>
                      )}
                      {!isLocalCustomer && (
                        <div className="flex justify-between text-green-600">
                          <span>Exento IVA (Turismo):</span>
                          <span className="font-medium">Gs. 0</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span data-testid="text-total">{formatPrice(total)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-sale"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || selectedItems.length === 0 || !form.watch("customerId")}
                    data-testid="button-process-sale"
                  >
                    {createMutation.isPending ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4 mr-2" />
                        Procesar Venta - {formatPrice(total)}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Timbrado Status Alert */}
      {!timbradoStatus.isValid && (
        <Alert className="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            ⚠️ {timbradoStatus.error}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Ventas Hoy</p>
                <p className="text-2xl font-semibold text-green-600" data-testid="stat-today-sales">
                  {formatPrice(totalToday)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Facturas Hoy</p>
                <p className="text-2xl font-semibold" data-testid="stat-today-invoices">{todaySales.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Promedio por Venta</p>
                <p className="text-2xl font-semibold text-blue-600" data-testid="stat-average-sale">
                  {formatPrice(todaySales.length > 0 ? Math.round(totalToday / todaySales.length) : 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Ventas</p>
                <p className="text-2xl font-semibold text-orange-600" data-testid="stat-total-sales">{sales.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número de factura, cliente o documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-sales"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterPayment} onValueChange={setFilterPayment}>
                <SelectTrigger className="w-40" data-testid="select-filter-payment">
                  <SelectValue placeholder="Medio de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterTourism} onValueChange={setFilterTourism}>
                <SelectTrigger className="w-32" data-testid="select-filter-tourism">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="local">Locales</SelectItem>
                  <SelectItem value="tourism">Turistas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Sales Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSales.map((sale) => {
          const customer = mockCustomers[sale.customerId as keyof typeof mockCustomers];
          
          return (
            <Card key={sale.id} className="hover-elevate" data-testid={`card-sale-${sale.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-lg" data-testid={`text-invoice-number-${sale.id}`}>
                      {sale.numeroFactura}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {sale.regimenTurismo && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Turismo
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {paymentMethods.find(m => m.value === sale.medioPago)?.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium" data-testid={`text-customer-${sale.id}`}>
                      {customer?.nombre}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm" data-testid={`text-date-${sale.id}`}>
                      {formatDate(sale.fecha)}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span data-testid={`text-subtotal-${sale.id}`}>{formatPrice(sale.subtotal)}</span>
                  </div>
                  {parseInt(sale.impuestos) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IVA:</span>
                      <span data-testid={`text-taxes-${sale.id}`}>{formatPrice(sale.impuestos)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-green-600" data-testid={`text-total-${sale.id}`}>
                      {formatPrice(sale.total)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1 mt-3">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1"
                    onClick={() => {/* View details */}}
                    data-testid={`button-view-${sale.id}`}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {/* Download invoice */}}
                    data-testid={`button-download-${sale.id}`}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredSales.length === 0 && (
        <Card className="p-8 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No se encontraron ventas
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm || filterPayment !== "all" || filterTourism !== "all"
              ? "No hay ventas que coincidan con los filtros aplicados."
              : "Aún no hay ventas registradas en el sistema."
            }
          </p>
          {(!searchTerm && filterPayment === "all" && filterTourism === "all") && timbradoStatus.isValid && (
            <Button onClick={openDialog} data-testid="button-add-first-sale">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Primera Venta
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}