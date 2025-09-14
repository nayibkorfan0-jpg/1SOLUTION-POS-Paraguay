import { 
  type User, type InsertUser,
  type CompanyConfig, type InsertCompanyConfig,
  type Customer, type InsertCustomer,
  type Vehicle, type InsertVehicle,
  type Service, type InsertService,
  type ServiceCombo, type InsertServiceCombo,
  type ServiceComboItem, type InsertServiceComboItem,
  type WorkOrder, type InsertWorkOrder,
  type WorkOrderItem, type InsertWorkOrderItem,
  type InventoryItem, type InsertInventoryItem,
  type Sale, type InsertSale,
  type SaleItem, type InsertSaleItem,
  users, companyConfig, customers, vehicles, services, serviceCombos, serviceComboItems,
  workOrders, workOrderItems, inventoryItems, sales, saleItems
} from "@shared/schema";
import { randomUUID } from "crypto";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, desc } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";
import fs from "fs";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Company Config
  getCompanyConfig(): Promise<CompanyConfig | undefined>;
  createCompanyConfig(config: InsertCompanyConfig): Promise<CompanyConfig>;
  updateCompanyConfig(id: string, config: Partial<InsertCompanyConfig>): Promise<CompanyConfig | undefined>;

  // Customers
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomers(): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;

  // Vehicles
  getVehicle(id: string): Promise<Vehicle | undefined>;
  getVehiclesByCustomer(customerId: string): Promise<Vehicle[]>;
  getAllVehicles(): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: string, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: string): Promise<boolean>;

  // Services
  getService(id: string): Promise<Service | undefined>;
  getServices(): Promise<Service[]>;
  getActiveServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string): Promise<boolean>;

  // Service Combos
  getServiceCombo(id: string): Promise<ServiceCombo | undefined>;
  getServiceCombos(): Promise<ServiceCombo[]>;
  getActiveServiceCombos(): Promise<ServiceCombo[]>;
  createServiceCombo(combo: InsertServiceCombo): Promise<ServiceCombo>;
  updateServiceCombo(id: string, combo: Partial<InsertServiceCombo>): Promise<ServiceCombo | undefined>;
  deleteServiceCombo(id: string): Promise<boolean>;

  // Service Combo Items
  getServiceComboItems(comboId: string): Promise<ServiceComboItem[]>;
  createServiceComboItem(item: InsertServiceComboItem): Promise<ServiceComboItem>;
  deleteServiceComboItem(id: string): Promise<boolean>;
  deleteServiceComboItemsByCombo(comboId: string): Promise<void>;

  // Work Orders
  getWorkOrder(id: string): Promise<WorkOrder | undefined>;
  getWorkOrders(): Promise<WorkOrder[]>;
  getWorkOrdersByStatus(status: string): Promise<WorkOrder[]>;
  getWorkOrdersByCustomer(customerId: string): Promise<WorkOrder[]>;
  createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder>;
  updateWorkOrder(id: string, workOrder: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined>;
  deleteWorkOrder(id: string): Promise<boolean>;
  getNextWorkOrderNumber(): Promise<number>;

  // Work Order Items
  getWorkOrderItems(workOrderId: string): Promise<WorkOrderItem[]>;
  createWorkOrderItem(item: InsertWorkOrderItem): Promise<WorkOrderItem>;
  deleteWorkOrderItem(id: string): Promise<boolean>;
  deleteWorkOrderItemsByWorkOrder(workOrderId: string): Promise<void>;

  // Inventory Items
  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  getInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItemsByAlert(alertStatus: string): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: string): Promise<boolean>;
  updateInventoryStock(id: string, newStock: number): Promise<InventoryItem | undefined>;

  // Sales
  getSale(id: string): Promise<Sale | undefined>;
  getSales(): Promise<Sale[]>;
  getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]>;
  getSalesByCustomer(customerId: string): Promise<Sale[]>;
  getLastSale(): Promise<Sale | undefined>;
  createSale(sale: InsertSale): Promise<Sale>;
  updateSale(id: string, sale: Partial<InsertSale>): Promise<Sale | undefined>;
  deleteSale(id: string): Promise<boolean>;

  // Sale Items
  getSaleItems(saleId: string): Promise<SaleItem[]>;
  createSaleItem(item: InsertSaleItem): Promise<SaleItem>;
  deleteSaleItem(id: string): Promise<boolean>;
  deleteSaleItemsBySale(saleId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private companyConfigs: Map<string, CompanyConfig>;
  private customers: Map<string, Customer>;
  private vehicles: Map<string, Vehicle>;
  private services: Map<string, Service>;
  private serviceCombos: Map<string, ServiceCombo>;
  private serviceComboItems: Map<string, ServiceComboItem>;
  private workOrders: Map<string, WorkOrder>;
  private workOrderItems: Map<string, WorkOrderItem>;
  private inventoryItems: Map<string, InventoryItem>;
  private sales: Map<string, Sale>;
  private saleItems: Map<string, SaleItem>;
  private nextWorkOrderNumber: number = 1;

  constructor() {
    this.users = new Map();
    this.companyConfigs = new Map();
    this.customers = new Map();
    this.vehicles = new Map();
    this.services = new Map();
    this.serviceCombos = new Map();
    this.serviceComboItems = new Map();
    this.workOrders = new Map();
    this.workOrderItems = new Map();
    this.inventoryItems = new Map();
    this.sales = new Map();
    this.saleItems = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Company Config
  async getCompanyConfig(): Promise<CompanyConfig | undefined> {
    return Array.from(this.companyConfigs.values())[0]; // Should only be one
  }

  async createCompanyConfig(insertConfig: InsertCompanyConfig): Promise<CompanyConfig> {
    const id = randomUUID();
    const now = new Date();
    const config: CompanyConfig = { 
      ...insertConfig,
      nombreFantasia: insertConfig.nombreFantasia ?? null,
      telefono: insertConfig.telefono ?? null,
      email: insertConfig.email ?? null,
      logoPath: insertConfig.logoPath ?? null,
      establecimiento: insertConfig.establecimiento ?? "001",
      puntoExpedicion: insertConfig.puntoExpedicion ?? "001",
      ciudad: insertConfig.ciudad ?? "Asunción",
      moneda: insertConfig.moneda ?? "PYG",
      id,
      createdAt: now,
      updatedAt: now
    };
    this.companyConfigs.set(id, config);
    return config;
  }

  async updateCompanyConfig(id: string, updates: Partial<InsertCompanyConfig>): Promise<CompanyConfig | undefined> {
    const config = this.companyConfigs.get(id);
    if (!config) return undefined;
    
    const updated: CompanyConfig = {
      ...config,
      ...updates,
      updatedAt: new Date()
    };
    this.companyConfigs.set(id, updated);
    return updated;
  }

  // Customers
  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const now = new Date();
    const customer: Customer = { 
      ...insertCustomer,
      email: insertCustomer.email ?? null,
      telefono: insertCustomer.telefono ?? null,
      direccion: insertCustomer.direccion ?? null,
      pais: insertCustomer.pais ?? null,
      pasaporte: insertCustomer.pasaporte ?? null,
      fechaIngreso: insertCustomer.fechaIngreso ?? null,
      docTipo: insertCustomer.docTipo ?? "CI",
      regimenTurismo: insertCustomer.regimenTurismo ?? false,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;
    
    const updated: Customer = {
      ...customer,
      ...updates,
      updatedAt: new Date()
    };
    this.customers.set(id, updated);
    return updated;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.customers.delete(id);
  }

  // Vehicles
  async getVehicle(id: string): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async getVehiclesByCustomer(customerId: string): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values()).filter(
      vehicle => vehicle.customerId === customerId
    );
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = randomUUID();
    const now = new Date();
    const vehicle: Vehicle = { 
      ...insertVehicle,
      observaciones: insertVehicle.observaciones ?? null,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  async updateVehicle(id: string, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) return undefined;
    
    const updated: Vehicle = {
      ...vehicle,
      ...updates,
      updatedAt: new Date()
    };
    this.vehicles.set(id, updated);
    return updated;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    return this.vehicles.delete(id);
  }

  // Services
  async getService(id: string): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async getServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }

  async getActiveServices(): Promise<Service[]> {
    return Array.from(this.services.values()).filter(service => service.activo);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = randomUUID();
    const now = new Date();
    const service: Service = { 
      ...insertService,
      precio: typeof insertService.precio === 'number' ? insertService.precio.toString() : insertService.precio,
      descripcion: insertService.descripcion ?? null,
      duracionMin: insertService.duracionMin ?? 30,
      activo: insertService.activo ?? true,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.services.set(id, service);
    return service;
  }

  async updateService(id: string, updates: Partial<InsertService>): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (!service) return undefined;
    
    const updated: Service = {
      ...service,
      ...updates,
      precio: updates.precio ? (typeof updates.precio === 'number' ? updates.precio.toString() : updates.precio) : service.precio,
      updatedAt: new Date()
    };
    this.services.set(id, updated);
    return updated;
  }

  async deleteService(id: string): Promise<boolean> {
    return this.services.delete(id);
  }

  // Service Combos
  async getServiceCombo(id: string): Promise<ServiceCombo | undefined> {
    return this.serviceCombos.get(id);
  }

  async getServiceCombos(): Promise<ServiceCombo[]> {
    return Array.from(this.serviceCombos.values());
  }

  async getActiveServiceCombos(): Promise<ServiceCombo[]> {
    return Array.from(this.serviceCombos.values()).filter(combo => combo.activo);
  }

  async createServiceCombo(insertCombo: InsertServiceCombo): Promise<ServiceCombo> {
    const id = randomUUID();
    const now = new Date();
    const combo: ServiceCombo = { 
      ...insertCombo,
      precioTotal: typeof insertCombo.precioTotal === 'number' ? insertCombo.precioTotal.toString() : insertCombo.precioTotal,
      descripcion: insertCombo.descripcion ?? null,
      activo: insertCombo.activo ?? true,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.serviceCombos.set(id, combo);
    return combo;
  }

  async updateServiceCombo(id: string, updates: Partial<InsertServiceCombo>): Promise<ServiceCombo | undefined> {
    const combo = this.serviceCombos.get(id);
    if (!combo) return undefined;
    
    const updated: ServiceCombo = {
      ...combo,
      ...updates,
      precioTotal: updates.precioTotal ? (typeof updates.precioTotal === 'number' ? updates.precioTotal.toString() : updates.precioTotal) : combo.precioTotal,
      updatedAt: new Date()
    };
    this.serviceCombos.set(id, updated);
    return updated;
  }

  async deleteServiceCombo(id: string): Promise<boolean> {
    return this.serviceCombos.delete(id);
  }

  // Service Combo Items
  async getServiceComboItems(comboId: string): Promise<ServiceComboItem[]> {
    return Array.from(this.serviceComboItems.values()).filter(
      item => item.comboId === comboId
    );
  }

  async createServiceComboItem(insertItem: InsertServiceComboItem): Promise<ServiceComboItem> {
    const id = randomUUID();
    const item: ServiceComboItem = { ...insertItem, id };
    this.serviceComboItems.set(id, item);
    return item;
  }

  async deleteServiceComboItem(id: string): Promise<boolean> {
    return this.serviceComboItems.delete(id);
  }

  async deleteServiceComboItemsByCombo(comboId: string): Promise<void> {
    const itemsToDelete = Array.from(this.serviceComboItems.entries())
      .filter(([_, item]) => item.comboId === comboId)
      .map(([id, _]) => id);
    
    itemsToDelete.forEach(id => this.serviceComboItems.delete(id));
  }

  // Work Orders
  async getWorkOrder(id: string): Promise<WorkOrder | undefined> {
    return this.workOrders.get(id);
  }

  async getWorkOrders(): Promise<WorkOrder[]> {
    return Array.from(this.workOrders.values());
  }

  async getWorkOrdersByStatus(status: string): Promise<WorkOrder[]> {
    return Array.from(this.workOrders.values()).filter(
      workOrder => workOrder.estado === status
    );
  }

  async getWorkOrdersByCustomer(customerId: string): Promise<WorkOrder[]> {
    return Array.from(this.workOrders.values()).filter(
      workOrder => workOrder.customerId === customerId
    );
  }

  async createWorkOrder(insertWorkOrder: InsertWorkOrder): Promise<WorkOrder> {
    const id = randomUUID();
    const now = new Date();
    const workOrder: WorkOrder = { 
      ...insertWorkOrder,
      observaciones: insertWorkOrder.observaciones ?? null,
      fechaInicio: insertWorkOrder.fechaInicio ?? null,
      fechaFin: insertWorkOrder.fechaFin ?? null,
      fechaEntrega: insertWorkOrder.fechaEntrega ?? null,
      estado: insertWorkOrder.estado ?? "recibido",
      total: insertWorkOrder.total ?? "0",
      fechaEntrada: insertWorkOrder.fechaEntrada ?? now,
      id,
      numero: this.nextWorkOrderNumber++,
      createdAt: now,
      updatedAt: now
    };
    this.workOrders.set(id, workOrder);
    return workOrder;
  }

  async updateWorkOrder(id: string, updates: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined> {
    const workOrder = this.workOrders.get(id);
    if (!workOrder) return undefined;
    
    const updated: WorkOrder = {
      ...workOrder,
      ...updates,
      updatedAt: new Date()
    };
    this.workOrders.set(id, updated);
    return updated;
  }

  async deleteWorkOrder(id: string): Promise<boolean> {
    return this.workOrders.delete(id);
  }

  async getNextWorkOrderNumber(): Promise<number> {
    return this.nextWorkOrderNumber;
  }

  // Work Order Items
  async getWorkOrderItems(workOrderId: string): Promise<WorkOrderItem[]> {
    return Array.from(this.workOrderItems.values()).filter(
      item => item.workOrderId === workOrderId
    );
  }

  async createWorkOrderItem(insertItem: InsertWorkOrderItem): Promise<WorkOrderItem> {
    const id = randomUUID();
    const item: WorkOrderItem = { 
      ...insertItem,
      serviceId: insertItem.serviceId ?? null,
      comboId: insertItem.comboId ?? null,
      cantidad: insertItem.cantidad ?? 1,
      id 
    };
    this.workOrderItems.set(id, item);
    return item;
  }

  async deleteWorkOrderItem(id: string): Promise<boolean> {
    return this.workOrderItems.delete(id);
  }

  async deleteWorkOrderItemsByWorkOrder(workOrderId: string): Promise<void> {
    const itemsToDelete = Array.from(this.workOrderItems.entries())
      .filter(([_, item]) => item.workOrderId === workOrderId)
      .map(([id, _]) => id);
    
    itemsToDelete.forEach(id => this.workOrderItems.delete(id));
  }

  // Inventory Items
  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    return this.inventoryItems.get(id);
  }

  async getInventoryItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values());
  }

  async getInventoryItemsByAlert(alertStatus: string): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values()).filter(
      item => item.estadoAlerta === alertStatus
    );
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const id = randomUUID();
    const now = new Date();
    const item: InventoryItem = { 
      ...insertItem,
      descripcion: insertItem.descripcion ?? null,
      proveedor: insertItem.proveedor ?? null,
      ultimoPedido: insertItem.ultimoPedido ?? null,
      stockActual: insertItem.stockActual ?? 0,
      stockMinimo: insertItem.stockMinimo ?? 0,
      unidadMedida: insertItem.unidadMedida ?? "UN",
      estadoAlerta: insertItem.estadoAlerta ?? "normal",
      activo: insertItem.activo ?? true,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.inventoryItems.set(id, item);
    return item;
  }

  async updateInventoryItem(id: string, updates: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const item = this.inventoryItems.get(id);
    if (!item) return undefined;
    
    const updated: InventoryItem = {
      ...item,
      ...updates,
      updatedAt: new Date()
    };
    this.inventoryItems.set(id, updated);
    return updated;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    return this.inventoryItems.delete(id);
  }

  async updateInventoryStock(id: string, newStock: number): Promise<InventoryItem | undefined> {
    const item = this.inventoryItems.get(id);
    if (!item) return undefined;
    
    // Update alert status based on new stock
    let estadoAlerta = "normal";
    if (newStock <= 0) {
      estadoAlerta = "critico";
    } else if (newStock <= item.stockMinimo) {
      estadoAlerta = "bajo";
    }
    
    const updated: InventoryItem = {
      ...item,
      stockActual: newStock,
      estadoAlerta,
      updatedAt: new Date()
    };
    this.inventoryItems.set(id, updated);
    return updated;
  }

  // Sales
  async getSale(id: string): Promise<Sale | undefined> {
    return this.sales.get(id);
  }

  async getSales(): Promise<Sale[]> {
    return Array.from(this.sales.values());
  }

  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    return Array.from(this.sales.values()).filter(
      sale => sale.fecha >= startDate && sale.fecha <= endDate
    );
  }

  async getSalesByCustomer(customerId: string): Promise<Sale[]> {
    return Array.from(this.sales.values()).filter(
      sale => sale.customerId === customerId
    );
  }

  async getLastSale(): Promise<Sale | undefined> {
    const allSales = Array.from(this.sales.values());
    if (allSales.length === 0) return undefined;
    return allSales.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }

  async createSale(insertSale: InsertSale): Promise<Sale> {
    const id = randomUUID();
    const now = new Date();
    const sale: Sale = { 
      ...insertSale,
      customerId: insertSale.customerId ?? null,
      workOrderId: insertSale.workOrderId ?? null,
      impuestos: insertSale.impuestos ?? "0",
      regimenTurismo: insertSale.regimenTurismo ?? false,
      fecha: insertSale.fecha ?? now,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.sales.set(id, sale);
    return sale;
  }

  async updateSale(id: string, updates: Partial<InsertSale>): Promise<Sale | undefined> {
    const sale = this.sales.get(id);
    if (!sale) return undefined;
    
    const updated: Sale = {
      ...sale,
      ...updates,
      updatedAt: new Date()
    };
    this.sales.set(id, updated);
    return updated;
  }

  async deleteSale(id: string): Promise<boolean> {
    return this.sales.delete(id);
  }

  // Sale Items
  async getSaleItems(saleId: string): Promise<SaleItem[]> {
    return Array.from(this.saleItems.values()).filter(
      item => item.saleId === saleId
    );
  }

  async createSaleItem(insertItem: InsertSaleItem): Promise<SaleItem> {
    const id = randomUUID();
    const item: SaleItem = { 
      ...insertItem,
      serviceId: insertItem.serviceId ?? null,
      inventoryItemId: insertItem.inventoryItemId ?? null,
      id 
    };
    this.saleItems.set(id, item);
    return item;
  }

  async deleteSaleItem(id: string): Promise<boolean> {
    return this.saleItems.delete(id);
  }

  async deleteSaleItemsBySale(saleId: string): Promise<void> {
    const itemsToDelete = Array.from(this.saleItems.entries())
      .filter(([_, item]) => item.saleId === saleId)
      .map(([id, _]) => id);
    
    itemsToDelete.forEach(id => this.saleItems.delete(id));
  }
}

// SQLite Storage Implementation
export class SQLiteStorage implements IStorage {
  private db: Database.Database;
  private drizzleDb: ReturnType<typeof drizzle>;
  private nextWorkOrderNumber: number = 1;

  constructor(dbPath?: string) {
    // Default to data directory in user's home for production, or local for development
    const defaultPath = process.env.NODE_ENV === 'production' 
      ? path.join(process.env.APPDATA || process.env.HOME || '.', '1SOLUTION', 'database.sqlite')
      : path.join(process.cwd(), 'database.sqlite');
    
    const finalPath = dbPath || defaultPath;
    
    // Ensure directory exists
    const dir = path.dirname(finalPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    this.db = new Database(finalPath);
    this.drizzleDb = drizzle(this.db);
    
    // Initialize database schema
    this.initializeDatabase();
    
    // Initialize work order counter
    this.initializeWorkOrderCounter();
  }

  private initializeDatabase() {
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');
    
    // Create tables manually since we're not using migrations for simplicity
    this.createTables();
  }

  private createTables() {
    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `);

    // Company config table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS company_config (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        ruc TEXT NOT NULL UNIQUE,
        razon_social TEXT NOT NULL,
        nombre_fantasia TEXT,
        timbrado_numero TEXT NOT NULL,
        timbrado_desde TEXT NOT NULL,
        timbrado_hasta TEXT NOT NULL,
        establecimiento TEXT NOT NULL DEFAULT '001',
        punto_expedicion TEXT NOT NULL DEFAULT '001',
        direccion TEXT NOT NULL,
        ciudad TEXT NOT NULL DEFAULT 'Asunción',
        telefono TEXT,
        email TEXT,
        logo_path TEXT,
        moneda TEXT NOT NULL DEFAULT 'PYG',
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);

    // Customers table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        nombre TEXT NOT NULL,
        doc_tipo TEXT NOT NULL DEFAULT 'CI',
        doc_numero TEXT NOT NULL,
        email TEXT,
        telefono TEXT,
        direccion TEXT,
        regimen_turismo INTEGER NOT NULL DEFAULT 0,
        pais TEXT,
        pasaporte TEXT,
        fecha_ingreso TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);

    // Continue with remaining tables...
    this.createRemainingTables();
  }

  private createRemainingTables() {
    // Vehicles table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        customer_id TEXT NOT NULL REFERENCES customers(id),
        placa TEXT NOT NULL,
        marca TEXT NOT NULL,
        modelo TEXT NOT NULL,
        color TEXT NOT NULL,
        observaciones TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);

    // Services table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        nombre TEXT NOT NULL,
        descripcion TEXT,
        precio TEXT NOT NULL,
        duracion_min INTEGER NOT NULL DEFAULT 30,
        categoria TEXT NOT NULL,
        activo INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);

    // Continue with more tables...
    this.createAdditionalTables();
  }

  private createAdditionalTables() {
    // Service combos table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS service_combos (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        nombre TEXT NOT NULL,
        descripcion TEXT,
        precio_total TEXT NOT NULL,
        activo INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);

    // Service combo items table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS service_combo_items (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        combo_id TEXT NOT NULL REFERENCES service_combos(id),
        service_id TEXT NOT NULL REFERENCES services(id)
      );
    `);

    this.createFinalTables();
  }

  private createFinalTables() {
    // Work orders table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS work_orders (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        numero INTEGER NOT NULL UNIQUE,
        customer_id TEXT NOT NULL REFERENCES customers(id),
        vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
        estado TEXT NOT NULL DEFAULT 'recibido',
        fecha_entrada INTEGER NOT NULL DEFAULT (unixepoch()),
        fecha_inicio INTEGER,
        fecha_fin INTEGER,
        fecha_entrega INTEGER,
        observaciones TEXT,
        total TEXT NOT NULL DEFAULT '0',
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);

    // Work order items table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS work_order_items (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        work_order_id TEXT NOT NULL REFERENCES work_orders(id),
        service_id TEXT REFERENCES services(id),
        combo_id TEXT REFERENCES service_combos(id),
        nombre TEXT NOT NULL,
        precio TEXT NOT NULL,
        cantidad INTEGER NOT NULL DEFAULT 1
      );
    `);

    // Inventory items table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        nombre TEXT NOT NULL,
        descripcion TEXT,
        stock_actual INTEGER NOT NULL DEFAULT 0,
        stock_minimo INTEGER NOT NULL DEFAULT 0,
        unidad_medida TEXT NOT NULL DEFAULT 'UN',
        proveedor TEXT,
        ultimo_pedido TEXT,
        estado_alerta TEXT NOT NULL DEFAULT 'normal',
        activo INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);

    // Sales table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        numero_factura TEXT NOT NULL UNIQUE,
        customer_id TEXT REFERENCES customers(id),
        work_order_id TEXT REFERENCES work_orders(id),
        fecha INTEGER NOT NULL DEFAULT (unixepoch()),
        subtotal TEXT NOT NULL,
        impuestos TEXT NOT NULL DEFAULT '0',
        total TEXT NOT NULL,
        medio_pago TEXT NOT NULL,
        regimen_turismo INTEGER NOT NULL DEFAULT 0,
        timbrado_usado TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);

    // Sale items table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        sale_id TEXT NOT NULL REFERENCES sales(id),
        service_id TEXT REFERENCES services(id),
        inventory_item_id TEXT REFERENCES inventory_items(id),
        nombre TEXT NOT NULL,
        cantidad INTEGER NOT NULL,
        precio_unitario TEXT NOT NULL,
        subtotal TEXT NOT NULL
      );
    `);
  }

  private async initializeWorkOrderCounter() {
    const result = this.db.prepare('SELECT MAX(numero) as maxNumber FROM work_orders').get() as { maxNumber: number | null };
    this.nextWorkOrderNumber = (result.maxNumber || 0) + 1;
  }

  // Helper method to generate UUID
  private generateUUID(): string {
    return randomUUID();
  }

  // Helper method to convert SQLite timestamp to Date
  private timestampToDate(timestamp: number): Date {
    return new Date(timestamp * 1000);
  }

  // Helper method to convert Date to SQLite timestamp
  private dateToTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = this.drizzleDb.select().from(users).where(eq(users.id, id)).get();
    return result || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = this.drizzleDb.select().from(users).where(eq(users.username, username)).get();
    return result || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.generateUUID();
    const newUser: User = { ...user, id };
    this.drizzleDb.insert(users).values(newUser).run();
    return newUser;
  }

  // Company Config
  async getCompanyConfig(): Promise<CompanyConfig | undefined> {
    const result = this.drizzleDb.select().from(companyConfig).get();
    if (result) {
      return {
        ...result,
        createdAt: this.timestampToDate(result.createdAt as number),
        updatedAt: this.timestampToDate(result.updatedAt as number)
      } as CompanyConfig;
    }
    return undefined;
  }

  async createCompanyConfig(insertConfig: InsertCompanyConfig): Promise<CompanyConfig> {
    const id = this.generateUUID();
    const now = Math.floor(Date.now() / 1000);
    const config = {
      ...insertConfig,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.drizzleDb.insert(companyConfig).values(config).run();
    return {
      ...config,
      createdAt: this.timestampToDate(now),
      updatedAt: this.timestampToDate(now)
    } as CompanyConfig;
  }

  async updateCompanyConfig(id: string, updates: Partial<InsertCompanyConfig>): Promise<CompanyConfig | undefined> {
    const now = Math.floor(Date.now() / 1000);
    const updateData = { ...updates, updatedAt: now };
    
    const result = this.drizzleDb.update(companyConfig)
      .set(updateData)
      .where(eq(companyConfig.id, id))
      .returning()
      .get();
    
    if (result) {
      return {
        ...result,
        createdAt: this.timestampToDate(result.createdAt as number),
        updatedAt: this.timestampToDate(result.updatedAt as number)
      } as CompanyConfig;
    }
    return undefined;
  }

  // Customers
  async getCustomer(id: string): Promise<Customer | undefined> {
    const result = this.drizzleDb.select().from(customers).where(eq(customers.id, id)).get();
    if (result) {
      return {
        ...result,
        regimenTurismo: Boolean(result.regimenTurismo),
        createdAt: this.timestampToDate(result.createdAt as number),
        updatedAt: this.timestampToDate(result.updatedAt as number)
      } as Customer;
    }
    return undefined;
  }

  async getCustomers(): Promise<Customer[]> {
    const results = this.drizzleDb.select().from(customers).all();
    return results.map(result => ({
      ...result,
      regimenTurismo: Boolean(result.regimenTurismo),
      createdAt: this.timestampToDate(result.createdAt as number),
      updatedAt: this.timestampToDate(result.updatedAt as number)
    })) as Customer[];
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = this.generateUUID();
    const now = Math.floor(Date.now() / 1000);
    const customer = {
      ...insertCustomer,
      id,
      regimenTurismo: insertCustomer.regimenTurismo ? 1 : 0,
      createdAt: now,
      updatedAt: now
    };
    this.drizzleDb.insert(customers).values(customer).run();
    return {
      ...customer,
      regimenTurismo: Boolean(customer.regimenTurismo),
      createdAt: this.timestampToDate(now),
      updatedAt: this.timestampToDate(now)
    } as Customer;
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const now = Math.floor(Date.now() / 1000);
    const updateData = {
      ...updates,
      regimenTurismo: updates.regimenTurismo !== undefined ? (updates.regimenTurismo ? 1 : 0) : undefined,
      updatedAt: now
    };
    
    const result = this.drizzleDb.update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning()
      .get();
    
    if (result) {
      return {
        ...result,
        regimenTurismo: Boolean(result.regimenTurismo),
        createdAt: this.timestampToDate(result.createdAt as number),
        updatedAt: this.timestampToDate(result.updatedAt as number)
      } as Customer;
    }
    return undefined;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = this.drizzleDb.delete(customers).where(eq(customers.id, id)).run();
    return result.changes > 0;
  }

  // Vehicles
  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const result = this.drizzleDb.select().from(vehicles).where(eq(vehicles.id, id)).get();
    if (result) {
      return {
        ...result,
        createdAt: this.timestampToDate(result.createdAt as number),
        updatedAt: this.timestampToDate(result.updatedAt as number)
      } as Vehicle;
    }
    return undefined;
  }

  async getVehiclesByCustomer(customerId: string): Promise<Vehicle[]> {
    const results = this.drizzleDb.select().from(vehicles).where(eq(vehicles.customerId, customerId)).all();
    return results.map(result => ({
      ...result,
      createdAt: this.timestampToDate(result.createdAt as number),
      updatedAt: this.timestampToDate(result.updatedAt as number)
    })) as Vehicle[];
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    const results = this.drizzleDb.select().from(vehicles).all();
    return results.map(result => ({
      ...result,
      createdAt: this.timestampToDate(result.createdAt as number),
      updatedAt: this.timestampToDate(result.updatedAt as number)
    })) as Vehicle[];
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.generateUUID();
    const now = Math.floor(Date.now() / 1000);
    const vehicle = {
      ...insertVehicle,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.drizzleDb.insert(vehicles).values(vehicle).run();
    return {
      ...vehicle,
      createdAt: this.timestampToDate(now),
      updatedAt: this.timestampToDate(now)
    } as Vehicle;
  }

  async updateVehicle(id: string, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const now = Math.floor(Date.now() / 1000);
    const updateData = { ...updates, updatedAt: now };
    
    const result = this.drizzleDb.update(vehicles)
      .set(updateData)
      .where(eq(vehicles.id, id))
      .returning()
      .get();
    
    if (result) {
      return {
        ...result,
        createdAt: this.timestampToDate(result.createdAt as number),
        updatedAt: this.timestampToDate(result.updatedAt as number)
      } as Vehicle;
    }
    return undefined;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    const result = this.drizzleDb.delete(vehicles).where(eq(vehicles.id, id)).run();
    return result.changes > 0;
  }

  // Services
  async getService(id: string): Promise<Service | undefined> {
    const result = this.drizzleDb.select().from(services).where(eq(services.id, id)).get();
    if (result) {
      return {
        ...result,
        activo: Boolean(result.activo),
        createdAt: this.timestampToDate(result.createdAt as number),
        updatedAt: this.timestampToDate(result.updatedAt as number)
      } as Service;
    }
    return undefined;
  }

  async getServices(): Promise<Service[]> {
    const results = this.drizzleDb.select().from(services).all();
    return results.map(result => ({
      ...result,
      activo: Boolean(result.activo),
      createdAt: this.timestampToDate(result.createdAt as number),
      updatedAt: this.timestampToDate(result.updatedAt as number)
    })) as Service[];
  }

  async getActiveServices(): Promise<Service[]> {
    const results = this.drizzleDb.select().from(services).where(eq(services.activo, 1)).all();
    return results.map(result => ({
      ...result,
      activo: Boolean(result.activo),
      createdAt: this.timestampToDate(result.createdAt as number),
      updatedAt: this.timestampToDate(result.updatedAt as number)
    })) as Service[];
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = this.generateUUID();
    const now = Math.floor(Date.now() / 1000);
    const service = {
      ...insertService,
      id,
      precio: typeof insertService.precio === 'number' ? insertService.precio.toString() : insertService.precio,
      activo: insertService.activo !== undefined ? (insertService.activo ? 1 : 0) : 1,
      createdAt: now,
      updatedAt: now
    };
    this.drizzleDb.insert(services).values(service).run();
    return {
      ...service,
      activo: Boolean(service.activo),
      createdAt: this.timestampToDate(now),
      updatedAt: this.timestampToDate(now)
    } as Service;
  }

  async updateService(id: string, updates: Partial<InsertService>): Promise<Service | undefined> {
    const now = Math.floor(Date.now() / 1000);
    const updateData = {
      ...updates,
      precio: updates.precio ? (typeof updates.precio === 'number' ? updates.precio.toString() : updates.precio) : undefined,
      activo: updates.activo !== undefined ? (updates.activo ? 1 : 0) : undefined,
      updatedAt: now
    };
    
    const result = this.drizzleDb.update(services)
      .set(updateData)
      .where(eq(services.id, id))
      .returning()
      .get();
    
    if (result) {
      return {
        ...result,
        activo: Boolean(result.activo),
        createdAt: this.timestampToDate(result.createdAt as number),
        updatedAt: this.timestampToDate(result.updatedAt as number)
      } as Service;
    }
    return undefined;
  }

  async deleteService(id: string): Promise<boolean> {
    const result = this.drizzleDb.delete(services).where(eq(services.id, id)).run();
    return result.changes > 0;
  }

  // Service Combos
  async getServiceCombo(id: string): Promise<ServiceCombo | undefined> {
    const result = this.drizzleDb.select().from(serviceCombos).where(eq(serviceCombos.id, id)).get();
    if (result) {
      return {
        ...result,
        activo: Boolean(result.activo),
        createdAt: this.timestampToDate(result.createdAt as number),
        updatedAt: this.timestampToDate(result.updatedAt as number)
      } as ServiceCombo;
    }
    return undefined;
  }

  async getServiceCombos(): Promise<ServiceCombo[]> {
    const results = this.drizzleDb.select().from(serviceCombos).all();
    return results.map(result => ({
      ...result,
      activo: Boolean(result.activo),
      createdAt: this.timestampToDate(result.createdAt as number),
      updatedAt: this.timestampToDate(result.updatedAt as number)
    })) as ServiceCombo[];
  }

  async getActiveServiceCombos(): Promise<ServiceCombo[]> {
    const results = this.drizzleDb.select().from(serviceCombos).where(eq(serviceCombos.activo, 1)).all();
    return results.map(result => ({
      ...result,
      activo: Boolean(result.activo),
      createdAt: this.timestampToDate(result.createdAt as number),
      updatedAt: this.timestampToDate(result.updatedAt as number)
    })) as ServiceCombo[];
  }

  async createServiceCombo(insertCombo: InsertServiceCombo): Promise<ServiceCombo> {
    const id = this.generateUUID();
    const now = Math.floor(Date.now() / 1000);
    const combo = {
      ...insertCombo,
      id,
      precioTotal: typeof insertCombo.precioTotal === 'number' ? insertCombo.precioTotal.toString() : insertCombo.precioTotal,
      activo: insertCombo.activo !== undefined ? (insertCombo.activo ? 1 : 0) : 1,
      createdAt: now,
      updatedAt: now
    };
    this.drizzleDb.insert(serviceCombos).values(combo).run();
    return {
      ...combo,
      activo: Boolean(combo.activo),
      createdAt: this.timestampToDate(now),
      updatedAt: this.timestampToDate(now)
    } as ServiceCombo;
  }

  async updateServiceCombo(id: string, updates: Partial<InsertServiceCombo>): Promise<ServiceCombo | undefined> {
    const now = Math.floor(Date.now() / 1000);
    const updateData = {
      ...updates,
      precioTotal: updates.precioTotal ? (typeof updates.precioTotal === 'number' ? updates.precioTotal.toString() : updates.precioTotal) : undefined,
      activo: updates.activo !== undefined ? (updates.activo ? 1 : 0) : undefined,
      updatedAt: now
    };
    
    const result = this.drizzleDb.update(serviceCombos)
      .set(updateData)
      .where(eq(serviceCombos.id, id))
      .returning()
      .get();
    
    if (result) {
      return {
        ...result,
        activo: Boolean(result.activo),
        createdAt: this.timestampToDate(result.createdAt as number),
        updatedAt: this.timestampToDate(result.updatedAt as number)
      } as ServiceCombo;
    }
    return undefined;
  }

  async deleteServiceCombo(id: string): Promise<boolean> {
    const result = this.drizzleDb.delete(serviceCombos).where(eq(serviceCombos.id, id)).run();
    return result.changes > 0;
  }

  // Service Combo Items
  async getServiceComboItems(comboId: string): Promise<ServiceComboItem[]> {
    const results = this.drizzleDb.select().from(serviceComboItems).where(eq(serviceComboItems.comboId, comboId)).all();
    return results as ServiceComboItem[];
  }

  async createServiceComboItem(insertItem: InsertServiceComboItem): Promise<ServiceComboItem> {
    const id = this.generateUUID();
    const item = { ...insertItem, id };
    this.drizzleDb.insert(serviceComboItems).values(item).run();
    return item as ServiceComboItem;
  }

  async deleteServiceComboItem(id: string): Promise<boolean> {
    const result = this.drizzleDb.delete(serviceComboItems).where(eq(serviceComboItems.id, id)).run();
    return result.changes > 0;
  }

  async deleteServiceComboItemsByCombo(comboId: string): Promise<void> {
    this.drizzleDb.delete(serviceComboItems).where(eq(serviceComboItems.comboId, comboId)).run();
  }

  // Work Orders
  async getWorkOrder(id: string): Promise<WorkOrder | undefined> {
    const result = this.drizzleDb.select().from(workOrders).where(eq(workOrders.id, id)).get();
    if (result) {
      return {
        ...result,
        fechaEntrada: this.timestampToDate(result.fechaEntrada as number),
        fechaInicio: result.fechaInicio ? this.timestampToDate(result.fechaInicio as number) : null,
        fechaFin: result.fechaFin ? this.timestampToDate(result.fechaFin as number) : null,
        fechaEntrega: result.fechaEntrega ? this.timestampToDate(result.fechaEntrega as number) : null,
        createdAt: this.timestampToDate(result.createdAt as number),
        updatedAt: this.timestampToDate(result.updatedAt as number)
      } as WorkOrder;
    }
    return undefined;
  }

  async getWorkOrders(): Promise<WorkOrder[]> {
    const results = this.drizzleDb.select().from(workOrders).all();
    return results.map(result => ({
      ...result,
      fechaEntrada: this.timestampToDate(result.fechaEntrada as number),
      fechaInicio: result.fechaInicio ? this.timestampToDate(result.fechaInicio as number) : null,
      fechaFin: result.fechaFin ? this.timestampToDate(result.fechaFin as number) : null,
      fechaEntrega: result.fechaEntrega ? this.timestampToDate(result.fechaEntrega as number) : null,
      createdAt: this.timestampToDate(result.createdAt as number),
      updatedAt: this.timestampToDate(result.updatedAt as number)
    })) as WorkOrder[];
  }

  async getWorkOrdersByStatus(status: string): Promise<WorkOrder[]> {
    const results = this.drizzleDb.select().from(workOrders).where(eq(workOrders.estado, status)).all();
    return results.map(result => ({
      ...result,
      fechaEntrada: this.timestampToDate(result.fechaEntrada as number),
      fechaInicio: result.fechaInicio ? this.timestampToDate(result.fechaInicio as number) : null,
      fechaFin: result.fechaFin ? this.timestampToDate(result.fechaFin as number) : null,
      fechaEntrega: result.fechaEntrega ? this.timestampToDate(result.fechaEntrega as number) : null,
      createdAt: this.timestampToDate(result.createdAt as number),
      updatedAt: this.timestampToDate(result.updatedAt as number)
    })) as WorkOrder[];
  }

  async getWorkOrdersByCustomer(customerId: string): Promise<WorkOrder[]> {
    const results = this.drizzleDb.select().from(workOrders).where(eq(workOrders.customerId, customerId)).all();
    return results.map(result => ({
      ...result,
      fechaEntrada: this.timestampToDate(result.fechaEntrada as number),
      fechaInicio: result.fechaInicio ? this.timestampToDate(result.fechaInicio as number) : null,
      fechaFin: result.fechaFin ? this.timestampToDate(result.fechaFin as number) : null,
      fechaEntrega: result.fechaEntrega ? this.timestampToDate(result.fechaEntrega as number) : null,
      createdAt: this.timestampToDate(result.createdAt as number),
      updatedAt: this.timestampToDate(result.updatedAt as number)
    })) as WorkOrder[];
  }

  async createWorkOrder(insertWorkOrder: InsertWorkOrder): Promise<WorkOrder> {
    const id = this.generateUUID();
    const now = Math.floor(Date.now() / 1000);
    const workOrder = {
      ...insertWorkOrder,
      id,
      numero: this.nextWorkOrderNumber++,
      fechaEntrada: insertWorkOrder.fechaEntrada ? this.dateToTimestamp(insertWorkOrder.fechaEntrada as Date) : now,
      fechaInicio: insertWorkOrder.fechaInicio ? this.dateToTimestamp(insertWorkOrder.fechaInicio as Date) : null,
      fechaFin: insertWorkOrder.fechaFin ? this.dateToTimestamp(insertWorkOrder.fechaFin as Date) : null,
      fechaEntrega: insertWorkOrder.fechaEntrega ? this.dateToTimestamp(insertWorkOrder.fechaEntrega as Date) : null,
      createdAt: now,
      updatedAt: now
    };
    this.drizzleDb.insert(workOrders).values(workOrder).run();
    return {
      ...workOrder,
      fechaEntrada: this.timestampToDate(workOrder.fechaEntrada),
      fechaInicio: workOrder.fechaInicio ? this.timestampToDate(workOrder.fechaInicio) : null,
      fechaFin: workOrder.fechaFin ? this.timestampToDate(workOrder.fechaFin) : null,
      fechaEntrega: workOrder.fechaEntrega ? this.timestampToDate(workOrder.fechaEntrega) : null,
      createdAt: this.timestampToDate(now),
      updatedAt: this.timestampToDate(now)
    } as WorkOrder;
  }

  async updateWorkOrder(id: string, updates: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined> {
    const now = Math.floor(Date.now() / 1000);
    const updateData = {
      ...updates,
      fechaInicio: updates.fechaInicio ? this.dateToTimestamp(updates.fechaInicio as Date) : undefined,
      fechaFin: updates.fechaFin ? this.dateToTimestamp(updates.fechaFin as Date) : undefined,
      fechaEntrega: updates.fechaEntrega ? this.dateToTimestamp(updates.fechaEntrega as Date) : undefined,
      updatedAt: now
    };
    
    const result = this.drizzleDb.update(workOrders)
      .set(updateData)
      .where(eq(workOrders.id, id))
      .returning()
      .get();
    
    if (result) {
      return {
        ...result,
        fechaEntrada: this.timestampToDate(result.fechaEntrada as number),
        fechaInicio: result.fechaInicio ? this.timestampToDate(result.fechaInicio as number) : null,
        fechaFin: result.fechaFin ? this.timestampToDate(result.fechaFin as number) : null,
        fechaEntrega: result.fechaEntrega ? this.timestampToDate(result.fechaEntrega as number) : null,
        createdAt: this.timestampToDate(result.createdAt as number),
        updatedAt: this.timestampToDate(result.updatedAt as number)
      } as WorkOrder;
    }
    return undefined;
  }

  async deleteWorkOrder(id: string): Promise<boolean> {
    const result = this.drizzleDb.delete(workOrders).where(eq(workOrders.id, id)).run();
    return result.changes > 0;
  }

  async getNextWorkOrderNumber(): Promise<number> {
    return this.nextWorkOrderNumber;
  }

  // Work Order Items
  async getWorkOrderItems(workOrderId: string): Promise<WorkOrderItem[]> {
    const results = this.drizzleDb.select().from(workOrderItems).where(eq(workOrderItems.workOrderId, workOrderId)).all();
    return results as WorkOrderItem[];
  }

  async createWorkOrderItem(insertItem: InsertWorkOrderItem): Promise<WorkOrderItem> {
    const id = this.generateUUID();
    const item = { ...insertItem, id };
    this.drizzleDb.insert(workOrderItems).values(item).run();
    return item as WorkOrderItem;
  }

  async deleteWorkOrderItem(id: string): Promise<boolean> {
    const result = this.drizzleDb.delete(workOrderItems).where(eq(workOrderItems.id, id)).run();
    return result.changes > 0;
  }

  async deleteWorkOrderItemsByWorkOrder(workOrderId: string): Promise<void> {
    this.drizzleDb.delete(workOrderItems).where(eq(workOrderItems.workOrderId, workOrderId)).run();
  }

  // Inventory Items
  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    const result = this.drizzleDb.select().from(inventoryItems).where(eq(inventoryItems.id, id)).get();
    if (result) {
      return {
        ...result,
        activo: Boolean(result.activo),
        createdAt: this.timestampToDate(result.createdAt as number),
        updatedAt: this.timestampToDate(result.updatedAt as number)
      } as InventoryItem;
    }
    return undefined;
  }

  async getInventoryItems(): Promise<InventoryItem[]> {
    const results = this.drizzleDb.select().from(inventoryItems).all();
    return results.map(result => ({
      ...result,
      activo: Boolean(result.activo),
      createdAt: this.timestampToDate(result.createdAt as number),
      updatedAt: this.timestampToDate(result.updatedAt as number)
    })) as InventoryItem[];
  }

  async getInventoryItemsByAlert(alertStatus: string): Promise<InventoryItem[]> {
    const results = this.drizzleDb.select().from(inventoryItems).where(eq(inventoryItems.estadoAlerta, alertStatus)).all();
    return results.map(result => ({
      ...result,
      activo: Boolean(result.activo),
      createdAt: this.timestampToDate(result.createdAt as number),
      updatedAt: this.timestampToDate(result.updatedAt as number)
    })) as InventoryItem[];
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const id = this.generateUUID();
    const now = Math.floor(Date.now() / 1000);
    const item = {
      ...insertItem,
      id,
      activo: insertItem.activo !== undefined ? (insertItem.activo ? 1 : 0) : 1,
      createdAt: now,
      updatedAt: now
    };
    this.drizzleDb.insert(inventoryItems).values(item).run();
    return {
      ...item,
      activo: Boolean(item.activo),
      createdAt: this.timestampToDate(now),
      updatedAt: this.timestampToDate(now)
    } as InventoryItem;
  }

  async updateInventoryItem(id: string, updates: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const now = Math.floor(Date.now() / 1000);
    const updateData = {
      ...updates,
      activo: updates.activo !== undefined ? (updates.activo ? 1 : 0) : undefined,
      updatedAt: now
    };
    
    const result = this.drizzleDb.update(inventoryItems)
      .set(updateData)
      .where(eq(inventoryItems.id, id))
      .returning()
      .get();
    
    if (result) {
      return {
        ...result,
        activo: Boolean(result.activo),
        createdAt: this.timestampToDate(result.createdAt as number),
        updatedAt: this.timestampToDate(result.updatedAt as number)
      } as InventoryItem;
    }
    return undefined;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    const result = this.drizzleDb.delete(inventoryItems).where(eq(inventoryItems.id, id)).run();
    return result.changes > 0;
  }

  async updateInventoryStock(id: string, newStock: number): Promise<InventoryItem | undefined> {
    const item = await this.getInventoryItem(id);
    if (!item) return undefined;
    
    let estadoAlerta = "normal";
    if (newStock <= 0) {
      estadoAlerta = "critico";
    } else if (newStock <= item.stockMinimo) {
      estadoAlerta = "bajo";
    }
    
    return this.updateInventoryItem(id, {
      stockActual: newStock,
      estadoAlerta
    });
  }

  // Sales
  async getSale(id: string): Promise<Sale | undefined> {
    const result = this.drizzleDb.select().from(sales).where(eq(sales.id, id)).get();
    if (result) {
      return {
        ...result,
        fecha: this.timestampToDate(result.fecha as number),
        regimenTurismo: Boolean(result.regimenTurismo),
        createdAt: this.timestampToDate(result.createdAt as number),
        updatedAt: this.timestampToDate(result.updatedAt as number)
      } as Sale;
    }
    return undefined;
  }

  async getSales(): Promise<Sale[]> {
    const results = this.drizzleDb.select().from(sales).all();
    return results.map(result => ({
      ...result,
      fecha: this.timestampToDate(result.fecha as number),
      regimenTurismo: Boolean(result.regimenTurismo),
      createdAt: this.timestampToDate(result.createdAt as number),
      updatedAt: this.timestampToDate(result.updatedAt as number)
    })) as Sale[];
  }

  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    const startTimestamp = this.dateToTimestamp(startDate);
    const endTimestamp = this.dateToTimestamp(endDate);
    
    const results = this.db.prepare(
      'SELECT * FROM sales WHERE fecha >= ? AND fecha <= ?'
    ).all(startTimestamp, endTimestamp);
    
    return results.map((result: any) => ({
      ...result,
      fecha: this.timestampToDate(result.fecha),
      regimenTurismo: Boolean(result.regimen_turismo),
      createdAt: this.timestampToDate(result.created_at),
      updatedAt: this.timestampToDate(result.updated_at)
    })) as Sale[];
  }

  async getSalesByCustomer(customerId: string): Promise<Sale[]> {
    const results = this.drizzleDb.select().from(sales).where(eq(sales.customerId, customerId)).all();
    return results.map(result => ({
      ...result,
      fecha: this.timestampToDate(result.fecha as number),
      regimenTurismo: Boolean(result.regimenTurismo),
      createdAt: this.timestampToDate(result.createdAt as number),
      updatedAt: this.timestampToDate(result.updatedAt as number)
    })) as Sale[];
  }

  async getLastSale(): Promise<Sale | undefined> {
    const result = this.drizzleDb.select().from(sales).orderBy(desc(sales.createdAt)).limit(1).get();
    if (result) {
      return {
        ...result,
        fecha: this.timestampToDate(result.fecha as number),
        regimenTurismo: Boolean(result.regimenTurismo),
        createdAt: this.timestampToDate(result.createdAt as number),
        updatedAt: this.timestampToDate(result.updatedAt as number)
      } as Sale;
    }
    return undefined;
  }

  async createSale(insertSale: InsertSale): Promise<Sale> {
    const id = this.generateUUID();
    const now = Math.floor(Date.now() / 1000);
    const sale = {
      ...insertSale,
      id,
      fecha: insertSale.fecha ? this.dateToTimestamp(insertSale.fecha as Date) : now,
      regimenTurismo: insertSale.regimenTurismo ? 1 : 0,
      createdAt: now,
      updatedAt: now
    };
    this.drizzleDb.insert(sales).values(sale).run();
    return {
      ...sale,
      fecha: this.timestampToDate(sale.fecha),
      regimenTurismo: Boolean(sale.regimenTurismo),
      createdAt: this.timestampToDate(now),
      updatedAt: this.timestampToDate(now)
    } as Sale;
  }

  async updateSale(id: string, updates: Partial<InsertSale>): Promise<Sale | undefined> {
    const now = Math.floor(Date.now() / 1000);
    const updateData = {
      ...updates,
      fecha: updates.fecha ? this.dateToTimestamp(updates.fecha as Date) : undefined,
      regimenTurismo: updates.regimenTurismo !== undefined ? (updates.regimenTurismo ? 1 : 0) : undefined,
      updatedAt: now
    };
    
    const result = this.drizzleDb.update(sales)
      .set(updateData)
      .where(eq(sales.id, id))
      .returning()
      .get();
    
    if (result) {
      return {
        ...result,
        fecha: this.timestampToDate(result.fecha as number),
        regimenTurismo: Boolean(result.regimenTurismo),
        createdAt: this.timestampToDate(result.createdAt as number),
        updatedAt: this.timestampToDate(result.updatedAt as number)
      } as Sale;
    }
    return undefined;
  }

  async deleteSale(id: string): Promise<boolean> {
    const result = this.drizzleDb.delete(sales).where(eq(sales.id, id)).run();
    return result.changes > 0;
  }

  // Sale Items
  async getSaleItems(saleId: string): Promise<SaleItem[]> {
    const results = this.drizzleDb.select().from(saleItems).where(eq(saleItems.saleId, saleId)).all();
    return results as SaleItem[];
  }

  async createSaleItem(insertItem: InsertSaleItem): Promise<SaleItem> {
    const id = this.generateUUID();
    const item = { ...insertItem, id };
    this.drizzleDb.insert(saleItems).values(item).run();
    return item as SaleItem;
  }

  async deleteSaleItem(id: string): Promise<boolean> {
    const result = this.drizzleDb.delete(saleItems).where(eq(saleItems.id, id)).run();
    return result.changes > 0;
  }

  async deleteSaleItemsBySale(saleId: string): Promise<void> {
    this.drizzleDb.delete(saleItems).where(eq(saleItems.saleId, saleId)).run();
  }
}

// Export the SQLiteStorage instance instead of MemStorage
export const storage = new SQLiteStorage();
