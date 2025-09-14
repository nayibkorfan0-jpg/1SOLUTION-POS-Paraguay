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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Plus, 
  Edit, 
  Search,
  Filter,
  User,
  Phone,
  Mail,
  MapPin,
  Hash,
  Car,
  Plane,
  Eye,
  Calendar
} from "lucide-react";
import { insertCustomerSchema, type Customer, type Vehicle } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Customer form schema with additional validation
const customerFormSchema = insertCustomerSchema.extend({
  docNumero: z.string()
    .min(1, "El número de documento es obligatorio")
    .max(20, "El número de documento no puede exceder 20 caracteres"),
  telefono: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  direccion: z.string().optional(),
  // Tourism fields - conditional validation
  pais: z.string().optional(),
  pasaporte: z.string().optional(),
  fechaIngreso: z.string().optional(),
}).refine((data) => {
  if (data.regimenTurismo) {
    return data.pais && data.pasaporte && data.fechaIngreso;
  }
  return true;
}, {
  message: "Para régimen turismo es obligatorio país, pasaporte y fecha de ingreso",
  path: ["pais"],
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

// Document types
const docTypes = [
  { value: "CI", label: "Cédula de Identidad" },
  { value: "RUC", label: "RUC" },
  { value: "PASS", label: "Pasaporte" },
];

// Mock data
const mockCustomers: Customer[] = [
  {
    id: "c1",
    nombre: "Juan Pérez García",
    docTipo: "CI",
    docNumero: "12345678",
    email: "juan@email.com",
    telefono: "+595 21 123456",
    direccion: "Av. España 1234, Asunción",
    regimenTurismo: false,
    pais: null,
    pasaporte: null,
    fechaIngreso: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c2",
    nombre: "María González Silva",
    docTipo: "CI",
    docNumero: "87654321",
    email: "maria.g@email.com",
    telefono: "+595 983 456789",
    direccion: "Calle Palma 567, Asunción",
    regimenTurismo: false,
    pais: null,
    pasaporte: null,
    fechaIngreso: null,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "c3",
    nombre: "Carlos Roberto Silva",
    docTipo: "RUC",
    docNumero: "80012345-6",
    email: "carlos@empresa.com",
    telefono: "+595 21 987654",
    direccion: "Zona Industrial, San Lorenzo",
    regimenTurismo: false,
    pais: null,
    pasaporte: null,
    fechaIngreso: null,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "c4",
    nombre: "John Smith",
    docTipo: "PASS",
    docNumero: "US123456789",
    email: "john.smith@email.com",
    telefono: "+1 555 123456",
    direccion: "Hotel Sheraton, Asunción",
    regimenTurismo: true,
    pais: "USA",
    pasaporte: "US123456789",
    fechaIngreso: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock vehicles per customer
const mockVehicles: Record<string, Vehicle[]> = {
  c1: [{
    id: "v1",
    customerId: "c1",
    placa: "ABC123",
    marca: "Toyota",
    modelo: "Hilux",
    color: "Blanco",
    observaciones: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }],
  c2: [{
    id: "v2",
    customerId: "c2",
    placa: "XYZ789",
    marca: "Chevrolet",
    modelo: "Onix",
    color: "Rojo",
    observaciones: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }],
  c3: [
    {
      id: "v3",
      customerId: "c3",
      placa: "DEF456",
      marca: "Nissan",
      modelo: "Sentra",
      color: "Azul",
      observaciones: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "v4",
      customerId: "c3",
      placa: "GHI789",
      marca: "Ford",
      modelo: "Ranger",
      color: "Negro",
      observaciones: "Vehículo de empresa",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  c4: [{
    id: "v5",
    customerId: "c4",
    placa: "TUR001",
    marca: "Toyota",
    modelo: "Corolla",
    color: "Gris",
    observaciones: "Vehículo de alquiler",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }],
};

export default function ClientesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showTourism, setShowTourism] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Simulated queries
  const { data: customers = mockCustomers, isLoading } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockCustomers;
    }
  });

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.docNumero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.telefono?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || customer.docTipo === filterType;
    const matchesTourism = !showTourism || customer.regimenTurismo;
    
    return matchesSearch && matchesType && matchesTourism;
  });

  // Form setup
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      nombre: "",
      docTipo: "CI",
      docNumero: "",
      email: "",
      telefono: "",
      direccion: "",
      regimenTurismo: false,
      pais: "",
      pasaporte: "",
      fechaIngreso: "",
    },
  });

  // Watch tourism regime to show/hide fields
  const watchTourism = form.watch("regimenTurismo");

  // Mock mutations
  const createMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...data, id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Cliente creado",
        description: "El cliente se ha registrado correctamente.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CustomerFormData }) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...data, id, updatedAt: new Date().toISOString() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      setIsDialogOpen(false);
      setEditingCustomer(null);
      form.reset();
      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente se han actualizado correctamente.",
      });
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      form.reset({
        nombre: customer.nombre,
        docTipo: customer.docTipo,
        docNumero: customer.docNumero,
        email: customer.email || "",
        telefono: customer.telefono || "",
        direccion: customer.direccion || "",
        regimenTurismo: customer.regimenTurismo,
        pais: customer.pais || "",
        pasaporte: customer.pasaporte || "",
        fechaIngreso: customer.fechaIngreso || "",
      });
    } else {
      setEditingCustomer(null);
      form.reset();
    }
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold text-foreground" data-testid="text-customers-title">
              Gestión de Clientes
            </h1>
            <p className="text-muted-foreground" data-testid="text-customers-subtitle">
              Administre clientes locales y turistas
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()} data-testid="button-add-customer">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}
              </DialogTitle>
              <DialogDescription>
                {editingCustomer ? "Modifique los datos del cliente" : "Registre un nuevo cliente en el sistema"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan Pérez García" {...field} data-testid="input-customer-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="docTipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Documento *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-doc-type">
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {docTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
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
                    name="docNumero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número *</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678" {...field} data-testid="input-doc-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="+595 21 123456" {...field} value={field.value || ""} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="cliente@email.com" {...field} value={field.value || ""} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="direccion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Av. España 1234, Asunción" {...field} value={field.value || ""} data-testid="input-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="regimenTurismo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-tourism-regime"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center gap-2">
                          <Plane className="h-4 w-4" />
                          Régimen Turismo
                        </FormLabel>
                        <FormDescription>
                          Marque si el cliente es extranjero/turista
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {watchTourism && (
                  <div className="space-y-4 p-4 border rounded-md bg-blue-50 dark:bg-blue-950/20">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Información de Turismo
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="pais"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>País de Origen *</FormLabel>
                            <FormControl>
                              <Input placeholder="USA, BRA, ARG..." {...field} value={field.value || ""} data-testid="input-country" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pasaporte"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pasaporte *</FormLabel>
                            <FormControl>
                              <Input placeholder="US123456789" {...field} value={field.value || ""} data-testid="input-passport" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="fechaIngreso"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de Ingreso *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value || ""} data-testid="input-entry-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-customer"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-customer"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      editingCustomer ? "Actualizar" : "Crear Cliente"
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
                  placeholder="Buscar por nombre, documento, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-customers"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40" data-testid="select-filter-doc-type">
                  <SelectValue placeholder="Tipo documento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="CI">Cédula</SelectItem>
                  <SelectItem value="RUC">RUC</SelectItem>
                  <SelectItem value="PASS">Pasaporte</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant={showTourism ? "default" : "outline"}
                onClick={() => setShowTourism(!showTourism)}
                data-testid="button-filter-tourism"
              >
                <Plane className="h-4 w-4 mr-2" />
                Solo Turistas
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => {
          const vehicles = mockVehicles[customer.id] || [];
          
          return (
            <Card key={customer.id} className="hover-elevate" data-testid={`card-customer-${customer.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-lg truncate" data-testid={`text-customer-name-${customer.id}`}>
                      {customer.nombre}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {customer.regimenTurismo && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        <Plane className="h-3 w-3 mr-1" />
                        Turista
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {customer.docTipo}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium" data-testid={`text-doc-number-${customer.id}`}>
                      {customer.docNumero}
                    </span>
                  </div>
                  {customer.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm" data-testid={`text-phone-${customer.id}`}>
                        {customer.telefono}
                      </span>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate" data-testid={`text-email-${customer.id}`}>
                        {customer.email}
                      </span>
                    </div>
                  )}
                  {customer.direccion && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm" data-testid={`text-address-${customer.id}`}>
                        {customer.direccion}
                      </span>
                    </div>
                  )}
                </div>

                {customer.regimenTurismo && (
                  <>
                    <Separator />
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">País:</span>
                        <span className="font-medium">{customer.pais}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pasaporte:</span>
                        <span className="font-medium">{customer.pasaporte}</span>
                      </div>
                      {customer.fechaIngreso && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ingreso:</span>
                          <span className="font-medium">{formatDate(customer.fechaIngreso)}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Vehículos ({vehicles.length})</span>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {/* View details */}}
                        data-testid={`button-view-${customer.id}`}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openDialog(customer)}
                        data-testid={`button-edit-${customer.id}`}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {vehicles.length > 0 ? (
                    <div className="space-y-1">
                      {vehicles.slice(0, 2).map((vehicle) => (
                        <div key={vehicle.id} className="flex items-center gap-2 text-sm">
                          <Car className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate" data-testid={`text-vehicle-${vehicle.id}`}>
                            {vehicle.placa} - {vehicle.marca} {vehicle.modelo}
                          </span>
                        </div>
                      ))}
                      {vehicles.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{vehicles.length - 2} vehículos más
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Sin vehículos registrados
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  Cliente desde {formatDate(customer.createdAt)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredCustomers.length === 0 && (
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No se encontraron clientes
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm || filterType !== "all" || showTourism
              ? "No hay clientes que coincidan con los filtros aplicados."
              : "Aún no hay clientes registrados en el sistema."
            }
          </p>
          {(!searchTerm && filterType === "all" && !showTourism) && (
            <Button onClick={() => openDialog()} data-testid="button-add-first-customer">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Primer Cliente
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}