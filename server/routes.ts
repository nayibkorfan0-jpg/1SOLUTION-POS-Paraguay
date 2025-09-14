import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCompanyConfigSchema, 
  insertServiceSchema, 
  insertServiceComboSchema, 
  insertServiceComboItemSchema,
  insertSaleSchema,
  insertSaleItemSchema
} from "@shared/schema";
import { validateRUC, validateTimbradoDates, validateActiveTimbrado } from "./utils/paraguayan-validators";
import type { Request, Response, NextFunction } from "express";

/**
 * Middleware to validate active timbrado for billing operations
 * Blocks requests if timbrado is expired or not configured
 */
async function requireActiveTimbrado(req: Request, res: Response, next: NextFunction) {
  try {
    const config = await storage.getCompanyConfig();
    const validation = validateActiveTimbrado(config ?? null);

    if (!validation.isValid) {
      return res.status(403).json({
        error: "Operación de facturación bloqueada",
        details: validation.error,
        code: "TIMBRADO_INVALID",
        daysLeft: validation.daysLeft
      });
    }

    // Add config to request for use in routes
    (req as any).companyConfig = config;
    (req as any).timbradoStatus = validation;
    next();
  } catch (error) {
    console.error("Error validating timbrado:", error);
    res.status(500).json({
      error: "Error validating timbrado",
      details: "No se pudo verificar el estado del timbrado"
    });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Company Configuration Routes
  app.get("/api/company-config", async (req, res) => {
    try {
      const config = await storage.getCompanyConfig();
      res.json(config || null);
    } catch (error) {
      console.error("Error fetching company config:", error);
      res.status(500).json({ error: "Failed to fetch company configuration" });
    }
  });

  app.put("/api/company-config", async (req, res) => {
    try {
      // Validate request body
      const validation = insertCompanyConfigSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validation.error.errors
        });
      }

      const data = validation.data;

      // Basic RUC validation - allow free format as requested by user
      if (!data.ruc || data.ruc.trim().length === 0) {
        return res.status(400).json({
          error: "RUC requerido",
          details: "Debe ingresar un número de RUC"
        });
      }

      // Validate timbrado dates
      const timbradoValidation = validateTimbradoDates(data.timbradoDesde, data.timbradoHasta);
      if (!timbradoValidation.isValid) {
        return res.status(400).json({
          error: "Fechas de timbrado inválidas",
          details: timbradoValidation.error
        });
      }

      // Check if configuration exists
      const existingConfig = await storage.getCompanyConfig();
      
      let result;
      if (existingConfig) {
        result = await storage.updateCompanyConfig(existingConfig.id, data);
      } else {
        result = await storage.createCompanyConfig(data);
      }

      if (!result) {
        return res.status(500).json({ error: "Failed to save company configuration" });
      }

      res.json(result);
    } catch (error) {
      console.error("Error saving company config:", error);
      res.status(500).json({ error: "Failed to save company configuration" });
    }
  });

  // Timbrado validation status endpoint
  app.get("/api/timbrado/status", async (req, res) => {
    try {
      const config = await storage.getCompanyConfig();
      const validation = validateActiveTimbrado(config ?? null);
      
      res.json({
        isValid: validation.isValid,
        blocksInvoicing: validation.blocksInvoicing,
        daysLeft: validation.daysLeft,
        error: validation.error
      });
    } catch (error) {
      console.error("Error checking timbrado status:", error);
      res.status(500).json({ error: "Failed to check timbrado status" });
    }
  });

  // Services Routes
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  app.get("/api/services/active", async (req, res) => {
    try {
      const services = await storage.getActiveServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching active services:", error);
      res.status(500).json({ error: "Failed to fetch active services" });
    }
  });

  app.get("/api/services/:id", async (req, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({ error: "Failed to fetch service" });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const validation = insertServiceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validation.error.errors
        });
      }

      const service = await storage.createService(validation.data);
      res.json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ error: "Failed to create service" });
    }
  });

  app.put("/api/services/:id", async (req, res) => {
    try {
      const validation = insertServiceSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validation.error.errors
        });
      }

      const service = await storage.updateService(req.params.id, validation.data);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ error: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", async (req, res) => {
    try {
      // Soft delete - deactivate the service
      const service = await storage.updateService(req.params.id, { activo: false });
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json({ message: "Service deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating service:", error);
      res.status(500).json({ error: "Failed to deactivate service" });
    }
  });

  // Service Combos Routes
  app.get("/api/service-combos", async (req, res) => {
    try {
      const combos = await storage.getServiceCombos();
      res.json(combos);
    } catch (error) {
      console.error("Error fetching service combos:", error);
      res.status(500).json({ error: "Failed to fetch service combos" });
    }
  });

  app.get("/api/service-combos/active", async (req, res) => {
    try {
      const combos = await storage.getActiveServiceCombos();
      res.json(combos);
    } catch (error) {
      console.error("Error fetching active service combos:", error);
      res.status(500).json({ error: "Failed to fetch active service combos" });
    }
  });

  app.get("/api/service-combos/:id", async (req, res) => {
    try {
      const combo = await storage.getServiceCombo(req.params.id);
      if (!combo) {
        return res.status(404).json({ error: "Service combo not found" });
      }
      
      // Get combo items with service details
      const comboItems = await storage.getServiceComboItems(combo.id);
      const serviceIds = comboItems.map(item => item.serviceId);
      const services = [];
      
      for (const serviceId of serviceIds) {
        const service = await storage.getService(serviceId);
        if (service) {
          services.push(service);
        }
      }

      res.json({
        ...combo,
        services
      });
    } catch (error) {
      console.error("Error fetching service combo:", error);
      res.status(500).json({ error: "Failed to fetch service combo" });
    }
  });

  app.post("/api/service-combos", async (req, res) => {
    try {
      const { serviceIds, ...comboData } = req.body;

      // Validate combo data
      const validation = insertServiceComboSchema.safeParse(comboData);
      if (!validation.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validation.error.errors
        });
      }

      // Validate service IDs
      if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length < 2) {
        return res.status(400).json({
          error: "Validation failed",
          details: "A combo must include at least 2 services"
        });
      }

      // Create the combo
      const combo = await storage.createServiceCombo(validation.data);

      // Add service items to combo
      for (const serviceId of serviceIds) {
        await storage.createServiceComboItem({
          comboId: combo.id,
          serviceId
        });
      }

      res.json(combo);
    } catch (error) {
      console.error("Error creating service combo:", error);
      res.status(500).json({ error: "Failed to create service combo" });
    }
  });

  app.put("/api/service-combos/:id", async (req, res) => {
    try {
      const { serviceIds, ...comboData } = req.body;

      // Validate combo data
      const validation = insertServiceComboSchema.partial().safeParse(comboData);
      if (!validation.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validation.error.errors
        });
      }

      // Update the combo
      const combo = await storage.updateServiceCombo(req.params.id, validation.data);
      if (!combo) {
        return res.status(404).json({ error: "Service combo not found" });
      }

      // Update service items if provided
      if (serviceIds && Array.isArray(serviceIds)) {
        if (serviceIds.length < 2) {
          return res.status(400).json({
            error: "Validation failed",
            details: "A combo must include at least 2 services"
          });
        }

        // Remove existing combo items
        await storage.deleteServiceComboItemsByCombo(combo.id);

        // Add new service items
        for (const serviceId of serviceIds) {
          await storage.createServiceComboItem({
            comboId: combo.id,
            serviceId
          });
        }
      }

      res.json(combo);
    } catch (error) {
      console.error("Error updating service combo:", error);
      res.status(500).json({ error: "Failed to update service combo" });
    }
  });

  app.delete("/api/service-combos/:id", async (req, res) => {
    try {
      // Soft delete - deactivate the combo
      const combo = await storage.updateServiceCombo(req.params.id, { activo: false });
      if (!combo) {
        return res.status(404).json({ error: "Service combo not found" });
      }
      res.json({ message: "Service combo deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating service combo:", error);
      res.status(500).json({ error: "Failed to deactivate service combo" });
    }
  });

  // Example billing routes that would be protected by timbrado validation
  // These are demonstrations for future point-of-sale implementation
  
  // Example: Create invoice route (protected by timbrado validation)
  app.post("/api/sales/invoice", requireActiveTimbrado, async (req, res) => {
    try {
      // This route would be blocked if timbrado is expired
      // Future implementation would create actual invoices here
      const config = (req as any).companyConfig;
      
      res.json({
        message: "Factura creada exitosamente",
        timbrado: {
          numero: config.timbradoNumero,
          establecimiento: config.establecimiento,
          puntoExpedicion: config.puntoExpedicion
        },
        note: "Esta es una ruta de demostración - implementación futura"
      });
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  // Example: Create receipt route (protected by timbrado validation)
  app.post("/api/sales/receipt", requireActiveTimbrado, async (req, res) => {
    try {
      // This route would be blocked if timbrado is expired
      // Future implementation would create actual receipts here
      const config = (req as any).companyConfig;
      
      res.json({
        message: "Recibo creado exitosamente",
        timbrado: {
          numero: config.timbradoNumero,
          establecimiento: config.establecimiento,
          puntoExpedicion: config.puntoExpedicion
        },
        note: "Esta es una ruta de demostración - implementación futura"
      });
    } catch (error) {
      console.error("Error creating receipt:", error);
      res.status(500).json({ error: "Failed to create receipt" });
    }
  });

  // Sales Routes
  app.get("/api/sales", async (req, res) => {
    try {
      const sales = await storage.getSales();
      res.json(sales);
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ error: "Failed to fetch sales" });
    }
  });

  app.get("/api/sales/:id", async (req, res) => {
    try {
      const sale = await storage.getSale(req.params.id);
      if (!sale) {
        return res.status(404).json({ error: "Sale not found" });
      }
      res.json(sale);
    } catch (error) {
      console.error("Error fetching sale:", error);
      res.status(500).json({ error: "Failed to fetch sale" });
    }
  });

  app.post("/api/sales/create-from-order", requireActiveTimbrado, async (req, res) => {
    try {
      const { saleData, action } = req.body;
      
      // Validate sale data
      const validation = insertSaleSchema.safeParse(saleData);
      if (!validation.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validation.error.errors
        });
      }

      const companyConfig = (req as any).companyConfig;
      
      // Generate sequential invoice number
      const lastSale = await storage.getLastSale();
      const nextNumber = lastSale ? extractInvoiceNumber(lastSale.numeroFactura) + 1 : 1;
      const numeroFactura = generateInvoiceNumber(
        companyConfig.establecimiento,
        companyConfig.puntoExpedicion,
        nextNumber
      );

      // Create sale with generated invoice number
      const saleToCreate = {
        ...validation.data,
        numeroFactura,
        timbradoUsado: companyConfig.timbradoNumero,
      };

      const sale = await storage.createSale(saleToCreate);
      
      // Create sale items
      if (saleData.items && Array.isArray(saleData.items)) {
        for (const item of saleData.items) {
          await storage.createSaleItem({
            saleId: sale.id,
            serviceId: item.type === 'service' ? item.id : null,
            inventoryItemId: item.type === 'product' ? item.id : null,
            nombre: item.name,
            precioUnitario: item.price.toString(),
            cantidad: item.quantity,
            subtotal: (item.price * item.quantity).toString(),
          });
        }
      }

      // Update work order status if needed (mark as invoiced)
      if (saleData.workOrderId) {
        await storage.updateWorkOrder(saleData.workOrderId, {
          estado: "entregado" // Mark as delivered when invoiced
        });
      }

      res.json({
        ...sale,
        items: saleData.items,
        action
      });
    } catch (error) {
      console.error("Error creating sale from order:", error);
      res.status(500).json({ error: "Failed to create sale" });
    }
  });

  app.get("/api/sales/:id/print", async (req, res) => {
    try {
      const sale = await storage.getSale(req.params.id);
      if (!sale) {
        return res.status(404).json({ error: "Sale not found" });
      }

      const saleItems = await storage.getSaleItems(req.params.id);
      const customer = sale.customerId ? await storage.getCustomer(sale.customerId) : null;
      const companyConfig = await storage.getCompanyConfig();

      res.json({
        sale,
        items: saleItems,
        customer,
        companyConfig
      });
    } catch (error) {
      console.error("Error fetching sale for printing:", error);
      res.status(500).json({ error: "Failed to fetch sale for printing" });
    }
  });

  // Helper function to extract invoice number from string format
  function extractInvoiceNumber(numeroFactura: string): number {
    const parts = numeroFactura.split('-');
    return parseInt(parts[parts.length - 1]) || 0;
  }

  // Helper function to generate invoice number
  function generateInvoiceNumber(establecimiento: string, puntoExpedicion: string, numero: number): string {
    const paddedNumero = numero.toString().padStart(7, '0');
    return `${establecimiento}-${puntoExpedicion}-${paddedNumero}`;
  }

  const httpServer = createServer(app);

  return httpServer;
}
