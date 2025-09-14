import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Building2, Upload, AlertTriangle, CheckCircle, Calendar, MapPin, Phone, Mail, Hash, FileText } from "lucide-react";
import { insertCompanyConfigSchema, type CompanyConfig } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { ImageUpload } from "@/components/ImageUpload";
import { validateRUC } from "@/lib/utils";

// Extend the schema with additional frontend validations
const configFormSchema = insertCompanyConfigSchema.extend({
  ruc: z.string()
    .min(1, "El RUC es obligatorio")
    .max(50, "El RUC no puede exceder 50 caracteres"),
  timbradoDesde: z.string()
    .min(1, "La fecha de inicio del timbrado es obligatoria"),
  timbradoHasta: z.string()
    .min(1, "La fecha de vencimiento del timbrado es obligatoria"),
  establecimiento: z.string()
    .length(3, "El establecimiento debe tener exactamente 3 dígitos")
    .regex(/^\d{3}$/, "El establecimiento debe ser numérico"),
  puntoExpedicion: z.string()
    .length(3, "El punto de expedición debe tener exactamente 3 dígitos")
    .regex(/^\d{3}$/, "El punto de expedición debe ser numérico"),
}).refine((data) => {
  const startDate = new Date(data.timbradoDesde);
  const endDate = new Date(data.timbradoHasta);
  return endDate > startDate;
}, {
  message: "La fecha de vencimiento debe ser posterior a la fecha de inicio",
  path: ["timbradoHasta"],
});

type ConfigFormData = z.infer<typeof configFormSchema>;

export default function ConfiguracionPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [timbradoStatus, setTimbradoStatus] = useState<'valid' | 'warning' | 'expired'>('valid');
  const [daysLeft, setDaysLeft] = useState<number>(0);

  // Fetch current configuration
  const { data: config, isLoading } = useQuery<CompanyConfig | null>({
    queryKey: ['/api/company-config'],
  });

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configFormSchema),
    defaultValues: {
      ruc: "",
      razonSocial: "",
      nombreFantasia: "",
      timbradoNumero: "",
      timbradoDesde: "",
      timbradoHasta: "",
      establecimiento: "001",
      puntoExpedicion: "001",
      direccion: "",
      ciudad: "Asunción",
      telefono: "",
      email: "",
      logoPath: "",
      moneda: "PYG",
    },
  });

  // Update form when data is loaded
  useEffect(() => {
    if (config) {
      form.reset({
        ruc: config.ruc,
        razonSocial: config.razonSocial,
        nombreFantasia: config.nombreFantasia || "",
        timbradoNumero: config.timbradoNumero,
        timbradoDesde: config.timbradoDesde,
        timbradoHasta: config.timbradoHasta,
        establecimiento: config.establecimiento,
        puntoExpedicion: config.puntoExpedicion,
        direccion: config.direccion,
        ciudad: config.ciudad,
        telefono: config.telefono || "",
        email: config.email || "",
        logoPath: config.logoPath || "",
        moneda: config.moneda,
      });
    }
  }, [config, form]);

  // Watch timbrado dates for status calculation
  const timbradoHasta = form.watch("timbradoHasta");
  
  useEffect(() => {
    if (timbradoHasta) {
      const endDate = new Date(timbradoHasta);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      setDaysLeft(diffDays);
      
      if (diffDays < 0) {
        setTimbradoStatus('expired');
      } else if (diffDays <= 30) {
        setTimbradoStatus('warning');
      } else {
        setTimbradoStatus('valid');
      }
    }
  }, [timbradoHasta]);

  // Mutation for saving configuration
  const saveMutation = useMutation({
    mutationFn: async (data: ConfigFormData) => {
      return apiRequest('PUT', '/api/company-config', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/company-config'] });
      toast({
        title: "Configuración guardada",
        description: "La configuración de la empresa se ha guardado correctamente.",
      });
    },
    onError: (error: any) => {
      console.error('Error saving config:', error);
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ConfigFormData) => {
    saveMutation.mutate(data);
  };

  const getTimbradoStatusBadge = () => {
    switch (timbradoStatus) {
      case 'expired':
        return (
          <Badge variant="destructive" className="ml-2">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Vencido hace {Math.abs(daysLeft)} días
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            <Calendar className="w-3 h-3 mr-1" />
            Vence en {daysLeft} días
          </Badge>
        );
      case 'valid':
        return (
          <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Válido por {daysLeft} días
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold text-foreground" data-testid="text-config-title">
            Configuración de Empresa
          </h1>
          <p className="text-muted-foreground" data-testid="text-config-subtitle">
            Configure los datos fiscales y empresariales para Paraguay
          </p>
        </div>
      </div>

      {/* Timbrado Status Alert */}
      {timbradoHasta && timbradoStatus !== 'valid' && (
        <Alert className={`border-l-4 ${
          timbradoStatus === 'expired' 
            ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20' 
            : 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20'
        }`}>
          <AlertTriangle className={`h-4 w-4 ${
            timbradoStatus === 'expired' ? 'text-red-600' : 'text-orange-600'
          }`} />
          <AlertDescription className={timbradoStatus === 'expired' ? 'text-red-800 dark:text-red-200' : 'text-orange-800 dark:text-orange-200'}>
            {timbradoStatus === 'expired' 
              ? `⚠️ Timbrado vencido hace ${Math.abs(daysLeft)} días. No se pueden emitir facturas.`
              : `⚠️ Timbrado vence en ${daysLeft} días. Se recomienda renovar pronto.`
            }
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Información de la Empresa
              </CardTitle>
              <CardDescription>
                Datos básicos de identificación empresarial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ruc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        RUC *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="80000000-0" 
                          {...field} 
                          data-testid="input-ruc"
                        />
                      </FormControl>
                      <FormDescription>
                        Formato paraguayo: 8 dígitos + guión + dígito verificador
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="moneda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-moneda">
                            <SelectValue placeholder="Seleccione la moneda" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PYG">PYG - Guaraní Paraguayo</SelectItem>
                          <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="razonSocial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razón Social *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nombre oficial de la empresa" 
                        {...field} 
                        data-testid="input-razon-social"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nombreFantasia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de Fantasía</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nombre comercial (opcional)" 
                        {...field} 
                        value={field.value || ""}
                        data-testid="input-nombre-fantasia"
                      />
                    </FormControl>
                    <FormDescription>
                      Nombre comercial bajo el cual opera la empresa
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Timbrado Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Información de Timbrado
                {timbradoHasta && getTimbradoStatusBadge()}
              </CardTitle>
              <CardDescription>
                Datos del timbrado fiscal para facturación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="timbradoNumero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Timbrado *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="12345678" 
                        {...field} 
                        data-testid="input-timbrado-numero"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="timbradoDesde"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Inicio *</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          data-testid="input-timbrado-desde"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timbradoHasta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Vencimiento *</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          data-testid="input-timbrado-hasta"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="establecimiento"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Establecimiento *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="001" 
                          maxLength={3}
                          {...field} 
                          data-testid="input-establecimiento"
                          className="max-w-28 font-mono tabular-nums"
                        />
                      </FormControl>
                      <FormDescription>
                        Código de 3 dígitos (ej: 001)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="puntoExpedicion"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Punto de Expedición *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="001" 
                          maxLength={3}
                          {...field} 
                          data-testid="input-punto-expedicion"
                          className="max-w-28 font-mono tabular-nums"
                        />
                      </FormControl>
                      <FormDescription>
                        Código de 3 dígitos (ej: 001)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Información de Contacto
              </CardTitle>
              <CardDescription>
                Datos de ubicación y contacto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Dirección completa de la empresa" 
                        {...field} 
                        data-testid="input-direccion"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="ciudad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Asunción" 
                          {...field} 
                          data-testid="input-ciudad"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Teléfono
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+595 21 123456" 
                          {...field} 
                          value={field.value || ""}
                          data-testid="input-telefono"
                        />
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
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="empresa@email.com" 
                          {...field} 
                          value={field.value || ""}
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Logo de la Empresa
              </CardTitle>
              <CardDescription>
                Subir logo para facturas y reportes (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="logoPath"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ImageUpload
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Seleccionar logo de la empresa"
                        data-testid="upload-logo"
                      />
                    </FormControl>
                    <FormDescription>
                      Formatos soportados: JPG, PNG. Tamaño máximo: 5MB.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={saveMutation.isPending}
              data-testid="button-save-config"
            >
              {saveMutation.isPending ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Guardando...
                </>
              ) : (
                "Guardar Configuración"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}