# Overview

1SOLUTION is a comprehensive car wash point-of-sale (POS) system specifically designed for Paraguay market. It provides complete business management capabilities including service management, inventory tracking, customer management, fiscal billing compliance, and dashboard analytics. The system includes specialized support for Paraguayan tax requirements (RUC, Timbrado) and tourism regime features.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React with Vite**: Modern React application using Vite for development and build tooling
- **TypeScript**: Full TypeScript implementation for type safety across the entire codebase
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **Forms**: React Hook Form with Zod validation for robust form handling
- **Styling**: Tailwind CSS with custom design system following Material Design principles

## Backend Architecture
- **Node.js with Express**: RESTful API server using Express framework
- **TypeScript**: Full TypeScript implementation for type safety
- **Database ORM**: Drizzle ORM for type-safe database interactions
- **Schema Validation**: Shared Zod schemas between frontend and backend for consistent validation
- **Session Management**: Express sessions with PostgreSQL session store
- **Middleware**: Custom middleware for Paraguayan fiscal compliance (timbrado validation)

## Data Storage
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle migrations for database schema versioning
- **Shared Types**: Common TypeScript types and Zod schemas in `/shared` directory
- **File Storage**: Local file system for uploaded images (logos, etc.)

## Authentication & Authorization
- **Session-based Authentication**: Express sessions with secure cookie handling
- **User Management**: Basic user account system with username/password authentication
- **Role-based Access**: Foundation for role-based permissions (currently single-user)

## Fiscal Compliance System
- **Paraguayan RUC Validation**: Custom checksum validation for Paraguayan tax ID numbers
- **Timbrado Management**: Automatic validation of fiscal stamp expiration dates
- **Billing Compliance**: Middleware that blocks billing operations when timbrado is expired
- **Tourism Regime Support**: Special customer classification for foreign tourists with different tax rules

## Business Logic Modules
- **Company Configuration**: Centralized business settings including fiscal data
- **Service Management**: Car wash service catalog with pricing and duration tracking
- **Customer Management**: Customer database with tourism regime support
- **Vehicle Tracking**: Vehicle registration and service history
- **Inventory Management**: Stock tracking with low-stock alerts
- **Work Orders**: Service order workflow from reception to completion
- **Sales & Billing**: Transaction processing with fiscal compliance

## Design System
- **Color Palette**: Brand-focused blue palette with semantic colors for status indicators
- **Typography**: Inter font family with consistent sizing scale
- **Component Library**: Comprehensive UI component set following design guidelines
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Theme Support**: Light/dark mode toggle capability

# External Dependencies

## Core Framework Dependencies
- **React & Vite**: Frontend framework and build tooling
- **Express.js**: Backend web server framework
- **TypeScript**: Type system for both frontend and backend

## Database & ORM
- **@neondatabase/serverless**: Neon PostgreSQL serverless client
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-kit**: CLI tools for database migrations and schema management

## UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI component primitives (@radix-ui/react-*)
- **Shadcn/ui**: Pre-built component library built on Radix
- **Lucide React**: Icon library for consistent iconography
- **class-variance-authority**: Utility for building component variants

## Form & Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **@hookform/resolvers**: Validation resolvers for React Hook Form
- **Zod**: Schema validation library for runtime type checking
- **drizzle-zod**: Integration between Drizzle ORM and Zod schemas

## State Management & Data Fetching
- **@tanstack/react-query**: Server state management and caching
- **Wouter**: Lightweight client-side routing

## Utilities & Helpers
- **clsx & tailwind-merge**: Utility for conditional CSS classes
- **date-fns**: Date manipulation and formatting library
- **cmdk**: Command palette component for search functionality

## Development Tools
- **Vite Plugins**: Development server enhancements and error overlays
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS & Autoprefixer**: CSS processing and vendor prefixing

## Session & Security
- **connect-pg-simple**: PostgreSQL session store for Express
- **Express Session**: Server-side session management