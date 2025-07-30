# Trading Signal Scanner Application

## Overview

This is a full-stack trading signal scanner application focused on XAU/USD and Bitcoin analysis. The system uses advanced trading strategies (ICT, SMC, Fusion) to detect high-probability trading setups and can send notifications via Telegram. The application features a real-time dashboard with WebSocket connections for live price updates and strategy detections.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom trading color palette (bullish green, bearish red, dark theme)
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket hooks for live data

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with middleware for logging and error handling
- **Real-time**: WebSocket Server for live price feeds and strategy notifications
- **Build System**: Vite for frontend, esbuild for backend bundling
- **Development**: Hot reload with Vite middleware integration

### Data Storage Solutions
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (via Neon serverless) configured for trading data
- **Fallback**: In-memory storage implementation for development/testing
- **Schema**: Structured tables for users, settings, signals, and price data

### Key Components

#### Trading Strategy Engine
- **ICT (Inner Circle Trader)**: Liquidity sweep detection and order flow analysis
- **SMC (Smart Money Concepts)**: Order block and market structure analysis  
- **Fusion LVS**: Liquidity void snapback and advanced confluence detection
- **Additional Patterns**: BOS, FVG, CHOCH, and custom reversal patterns

#### Price Service
- **Data Provider**: TwelveData API for real-time forex and crypto prices
- **Caching**: Local storage with timestamps for efficient data retrieval
- **Multiple Timeframes**: M1, M5, M15, M30, H1, H4, D1 support
- **Real-time Updates**: WebSocket broadcasting for live price feeds

#### Session Management
- **Trading Sessions**: London (08:00-17:00 UTC), New York (13:00-22:00 UTC), Asia (23:00-08:00 UTC)
- **Session Overlap**: Automatic detection of high-volatility periods
- **Status Tracking**: Real-time session indicators in the dashboard

#### Telegram Integration
- **Bot Notifications**: Automated signal delivery with formatted messages
- **Rich Formatting**: HTML-formatted messages with probabilities and confluences
- **Configurable**: User-defined chat IDs and notification preferences

## Recent Updates

**January 29, 2025**
- Fixed API symbol format from XAUUSD/BTCUSD to XAU/USD/BTC/USD for Twelve Data compatibility
- Added URL encoding for symbols with slash characters in API requests
- Resolved mobile dashboard rendering issues with proper symbol mapping
- Implemented fallback demo pricing system for API failures
- Successfully tested and verified real-time price data retrieval from Twelve Data API
- Application now ready for deployment with functional real-time price feeds

## Data Flow

1. **Price Collection**: TwelveData API → Price Service → WebSocket broadcast
2. **Strategy Analysis**: Price history → Strategy Service → Signal detection
3. **Signal Generation**: High-probability setups → Database storage → Telegram notification
4. **Real-time Updates**: WebSocket → React hooks → UI updates
5. **User Configuration**: Settings modal → Backend validation → Database persistence

## External Dependencies

### APIs and Services
- **TwelveData**: Real-time and historical financial market data
- **Telegram Bot API**: Message delivery for trading signals
- **Neon Database**: Serverless PostgreSQL hosting

### Frontend Libraries
- **Radix UI**: Accessible component primitives
- **TanStack Query**: Server state management and caching
- **Lucide React**: Icon library optimized for React
- **React Hook Form**: Form validation with Zod schema validation
- **Date-fns**: Date manipulation and formatting

### Backend Libraries
- **Drizzle ORM**: Type-safe database toolkit
- **WebSocket (ws)**: Real-time bidirectional communication
- **Zod**: Runtime type validation and schema definition
- **Connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express middleware
- **Hot Reload**: Full-stack hot reload with Vite HMR
- **Environment Variables**: DATABASE_URL for database connection
- **Replit Integration**: Custom Replit development banner and error handling

### Production Build
- **Frontend**: Vite production build to `dist/public`
- **Backend**: esbuild bundling to `dist/index.js`
- **Static Serving**: Express serves built frontend assets
- **Database**: Drizzle migrations with `db:push` command

### Configuration Management
- **Database**: Drizzle config pointing to `shared/schema.ts`
- **Build Scripts**: Separate dev/build/start commands for different environments
- **Type Safety**: Shared types between frontend and backend via `@shared` alias
- **Path Aliases**: Configured for clean imports across the application

The application is designed as a monorepo with clear separation between client, server, and shared code, enabling efficient development and deployment while maintaining type safety throughout the stack.