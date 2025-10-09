# HRM Frontend - Project Structure

## Directory Organization

### Core Application (`src/`)
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui base components (Button, Dialog, etc.)
│   ├── agent/           # Agent-specific components
│   ├── calendar/        # Calendar-related components
│   ├── Layout.jsx       # Main application layout
│   ├── LanguageSwitcher.jsx  # Multi-language switcher
│   ├── NoticeWidget.jsx # System notices display
│   └── PermissionGate.jsx    # Role-based access control
├── features/            # Feature-based modules
│   ├── auth/           # Authentication system
│   ├── dashboard/      # Main dashboard
│   ├── brand/          # Brand management
│   ├── user/           # User management
│   ├── monitor/        # Agent monitoring
│   ├── agent/          # Agent interface
│   ├── hrm/            # HRM core functionality
│   │   ├── schedule/   # Schedule management
│   │   ├── leave/      # Leave management
│   │   ├── attendance/ # Smart attendance system
│   │   └── notice/     # Notice management
│   ├── setup/          # Initial system setup
│   └── system/         # System configuration
├── services/           # API service layer
├── store/              # State management (Zustand)
├── hooks/              # Custom React hooks
├── contexts/           # React contexts
├── locales/            # Internationalization
├── config/             # Configuration management
├── utils/              # Utility functions
└── lib/                # Third-party library configurations
```

### Operations & Deployment (`ops/`)
```
ops/
├── deploy/             # Deployment scripts
│   ├── build-and-deploy.sh    # Main deployment script
│   ├── ec2-setup.sh           # EC2 environment setup
│   └── production-deploy.sh   # Production deployment
├── nginx/              # Nginx configuration
├── config/             # Runtime configuration templates
├── server.js           # Node.js server for production
└── supervisord.conf    # Process management
```

### Documentation (`docs/`)
```
docs/
├── API_INTEGRATION.md          # Backend API integration guide
├── DEVELOPMENT_GUIDE.md        # Development standards
├── PROJECT_OVERVIEW.md         # Project architecture overview
├── backend-*.py               # Backend API specifications
├── database-*.sql             # Database schema files
└── *.md                       # Various technical documentation
```

## Architectural Patterns

### Feature-Based Architecture
- **Modular Design**: Each feature (auth, hrm, agent) is self-contained
- **Clear Boundaries**: Features have their own components, services, and state
- **Scalable Structure**: Easy to add new features without affecting existing ones

### Component Hierarchy
- **Base Components** (`components/ui/`): Reusable UI primitives from shadcn/ui
- **Feature Components** (`features/*/`): Business logic components
- **Layout Components** (`components/`): Application structure and navigation
- **Agent Components** (`components/agent/`): Specialized agent interface components

### State Management Strategy
- **Zustand Stores**: Lightweight state management for global state
- **React Query**: Server state management and caching
- **Local State**: Component-level state for UI interactions
- **Context API**: Permission and configuration contexts

### Service Layer Architecture
- **API Service** (`services/api.js`): Centralized HTTP client with interceptors
- **WebSocket Service** (`services/websocket.js`): Real-time communication
- **Storage Utilities** (`utils/storage.js`): Local storage management
- **Configuration Bootstrap** (`config/bootstrap.jsx`): Runtime config loading

## Core Relationships

### Authentication Flow
```
App.jsx → authStore → API Service → Backend Auth
                   ↓
            PermissionContext → PermissionGate → Feature Components
```

### Data Flow Pattern
```
Feature Component → API Service → Backend API
                 ↓
            React Query → Store Update → UI Re-render
```

### Configuration Management
```
Runtime Config (JSON) → bootstrap.jsx → systemStore → App Components
```

### Multi-Language Support
```
translations.json → i18n.jsx → useTranslation Hook → Components
```

## Key Integration Points

### Backend API Integration
- **Centralized API Client**: Single point for all HTTP requests
- **Error Handling**: Consistent error handling across all API calls
- **Authentication**: Automatic token management and refresh
- **Brand Context**: Multi-brand API routing and data isolation

### Real-time Features
- **WebSocket Integration**: Live updates for leave requests and agent status
- **Event-Driven Updates**: Automatic UI refresh on data changes
- **Fallback Mechanisms**: Graceful degradation when WebSocket unavailable

### Deployment Architecture
- **Docker Containerization**: Consistent deployment across environments
- **Nginx Reverse Proxy**: Static file serving and API routing
- **Runtime Configuration**: Dynamic config loading without rebuilds
- **Health Checks**: Automated monitoring and service validation