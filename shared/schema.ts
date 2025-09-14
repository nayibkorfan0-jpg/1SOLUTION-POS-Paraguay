import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// CompanyConfig - Paraguay specific company configuration
export const companyConfig = sqliteTable("company_config", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
  ruc: text("ruc").notNull().unique(),
  razonSocial: text("razon_social").notNull(),
  nombreFantasia: text("nombre_fantasia"),
  timbradoNumero: text("timbrado_numero").notNull(),
  timbradoDesde: text("timbrado_desde").notNull(),
  timbradoHasta: text("timbrado_hasta").notNull(),
  establecimiento: text("establecimiento").notNull().default("001"),
  puntoExpedicion: text("punto_expedicion").notNull().default("001"),
  direccion: text("direccion").notNull(),
  ciudad: text("ciudad").notNull().default("Asunción"),
  telefono: text("telefono"),
  email: text("email"),
  logoPath: text("logo_path"),
  moneda: text("moneda").notNull().default("PYG"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Customers with tourism regime support
export const customers = sqliteTable("customers", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
  nombre: text("nombre").notNull(),
  docTipo: text("doc_tipo").notNull().default("CI"), // CI, RUC, PASS
  docNumero: text("doc_numero").notNull(),
  email: text("email"),
  telefono: text("telefono"),
  direccion: text("direccion"),
  // Tourism regime fields
  regimenTurismo: integer("regimen_turismo", { mode: 'boolean' }).notNull().default(false),
  pais: text("pais"), // ISO country code when tourism regime
  pasaporte: text("pasaporte"), // Foreign document/passport
  fechaIngreso: text("fecha_ingreso"), // Entry date for tourism
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Vehicles linked to customers
export const vehicles = sqliteTable("vehicles", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
  customerId: text("customer_id").notNull().references(() => customers.id),
  placa: text("placa").notNull(),
  marca: text("marca").notNull(),
  modelo: text("modelo").notNull(),
  color: text("color").notNull(),
  observaciones: text("observaciones"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Services catalog
export const services = sqliteTable("services", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  precio: text("precio").notNull(), // Store as text for precision
  duracionMin: integer("duracion_min").notNull().default(30),
  categoria: text("categoria").notNull(), // basico, premium, motor, tapizado, encerado, ozono
  activo: integer("activo", { mode: 'boolean' }).notNull().default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Service combos/packages
export const serviceCombos = sqliteTable("service_combos", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  precioTotal: text("precio_total").notNull(),
  activo: integer("activo", { mode: 'boolean' }).notNull().default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Service combo items (many-to-many relationship)
export const serviceComboItems = sqliteTable("service_combo_items", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
  comboId: text("combo_id").notNull().references(() => serviceCombos.id),
  serviceId: text("service_id").notNull().references(() => services.id),
});

// Work orders for service tracking
export const workOrders = sqliteTable("work_orders", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
  numero: integer("numero").notNull().unique(), // Sequential number
  customerId: text("customer_id").notNull().references(() => customers.id),
  vehicleId: text("vehicle_id").notNull().references(() => vehicles.id),
  estado: text("estado").notNull().default("recibido"), // recibido, en-proceso, listo, entregado
  fechaEntrada: integer("fecha_entrada", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  fechaInicio: integer("fecha_inicio", { mode: 'timestamp' }),
  fechaFin: integer("fecha_fin", { mode: 'timestamp' }),
  fechaEntrega: integer("fecha_entrega", { mode: 'timestamp' }),
  observaciones: text("observaciones"),
  total: text("total").notNull().default("0"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Work order items (services contracted)
export const workOrderItems = sqliteTable("work_order_items", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
  workOrderId: text("work_order_id").notNull().references(() => workOrders.id),
  serviceId: text("service_id").references(() => services.id),
  comboId: text("combo_id").references(() => serviceCombos.id),
  nombre: text("nombre").notNull(), // Store name for historical purposes
  precio: text("precio").notNull(),
  cantidad: integer("cantidad").notNull().default(1),
});

// Inventory management
export const inventoryItems = sqliteTable("inventory_items", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  stockActual: integer("stock_actual").notNull().default(0),
  stockMinimo: integer("stock_minimo").notNull().default(0),
  unidadMedida: text("unidad_medida").notNull().default("UN"), // UN, LT, KG
  proveedor: text("proveedor"),
  ultimoPedido: text("ultimo_pedido"),
  estadoAlerta: text("estado_alerta").notNull().default("normal"), // normal, bajo, critico
  activo: integer("activo", { mode: 'boolean' }).notNull().default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Sales records
export const sales = sqliteTable("sales", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
  numeroFactura: text("numero_factura").notNull().unique(),
  customerId: text("customer_id").references(() => customers.id),
  workOrderId: text("work_order_id").references(() => workOrders.id),
  fecha: integer("fecha", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  subtotal: text("subtotal").notNull(),
  impuestos: text("impuestos").notNull().default("0"),
  total: text("total").notNull(),
  medioPago: text("medio_pago").notNull(), // efectivo, tarjeta, transferencia, cuenta
  regimenTurismo: integer("regimen_turismo", { mode: 'boolean' }).notNull().default(false),
  timbradoUsado: text("timbrado_usado").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Sale items
export const saleItems = sqliteTable("sale_items", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
  saleId: text("sale_id").notNull().references(() => sales.id),
  serviceId: text("service_id").references(() => services.id),
  inventoryItemId: text("inventory_item_id").references(() => inventoryItems.id),
  nombre: text("nombre").notNull(),
  cantidad: integer("cantidad").notNull(),
  precioUnitario: text("precio_unitario").notNull(),
  subtotal: text("subtotal").notNull(),
});

// Insert schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCompanyConfigSchema = createInsertSchema(companyConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  precio: z.coerce.number().int().min(0, "El precio debe ser mayor o igual a 0"),
  duracionMin: z.coerce.number().int().min(5, "La duración mínima es 5 minutos").max(480, "La duración máxima es 480 minutos"),
});

export const insertServiceComboSchema = createInsertSchema(serviceCombos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  precioTotal: z.coerce.number().int().min(0, "El precio total debe ser mayor o igual a 0"),
});

export const insertServiceComboItemSchema = createInsertSchema(serviceComboItems).omit({
  id: true,
});

export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({
  id: true,
  numero: true, // Auto-generated sequential
  createdAt: true,
  updatedAt: true,
});

export const insertWorkOrderItemSchema = createInsertSchema(workOrderItems).omit({
  id: true,
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSaleItemSchema = createInsertSchema(saleItems).omit({
  id: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCompanyConfig = z.infer<typeof insertCompanyConfigSchema>;
export type CompanyConfig = typeof companyConfig.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export type InsertServiceCombo = z.infer<typeof insertServiceComboSchema>;
export type ServiceCombo = typeof serviceCombos.$inferSelect;

export type InsertServiceComboItem = z.infer<typeof insertServiceComboItemSchema>;
export type ServiceComboItem = typeof serviceComboItems.$inferSelect;

export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
export type WorkOrder = typeof workOrders.$inferSelect;

export type InsertWorkOrderItem = z.infer<typeof insertWorkOrderItemSchema>;
export type WorkOrderItem = typeof workOrderItems.$inferSelect;

export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;

export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof sales.$inferSelect;

export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type SaleItem = typeof saleItems.$inferSelect;
