# HRM Frontend - Project Structure

## 📁 Directory Organization

```
pr3-frontend/
├── 📂 src/                          # Source code
│   ├── 📂 components/               # Reusable UI components
│   │   ├── 📂 ui/                  # shadcn/ui base components
│   │   ├── 📂 agent/               # Agent-specific components
│   │   ├── 📂 calendar/            # Calendar components
│   │   ├── Layout.jsx              # Main layout
│   │   ├── LanguageSwitcher.jsx    # Language switcher
│   │   ├── NoticeWidget.jsx        # Notice display
│   │   └── PermissionGate.jsx      # Permission control
│   ├── 📂 features/                # Feature modules
│   │   ├── 📂 auth/               # Authentication
│   │   ├── 📂 dashboard/          # Dashboard
│   │   ├── 📂 brand/              # Brand management
│   │   ├── 📂 user/               # User management
│   │   ├── 📂 monitor/            # Agent monitoring
│   │   ├── 📂 agent/              # Agent interface
│   │   ├── 📂 hrm/                # HRM modules
│   │   │   ├── 📂 schedule/       # Schedule management
│   │   │   ├── 📂 leave/          # Leave management
│   │   │   ├── 📂 attendance/     # Attendance system
│   │   │   ├── 📂 notice/         # Notice management
│   │   │   └── 📂 salary/         # Salary management
│   │   ├── 📂 setup/              # System setup
│   │   └── 📂 system/             # System settings
│   ├── 📂 services/               # API services
│   │   ├── api.js                 # Main API client
│   │   └── websocket.js           # WebSocket service
│   ├── 📂 store/                  # State management
│   │   ├── authStore.jsx          # Authentication store
│   │   └── systemStore.jsx        # System configuration store
│   ├── 📂 hooks/                  # Custom React hooks
│   ├── 📂 contexts/               # React contexts
│   ├── 📂 locales/                # Internationalization
│   ├── 📂 config/                 # Configuration
│   ├── 📂 utils/                  # Utility functions
│   └── 📂 lib/                    # Third-party integrations
├── 📂 public/                       # Static assets
│   └── 📂 config/                  # Runtime configuration
├── 📂 docs/                        # Documentation
│   ├── 📂 api/                    # API documentation
│   ├── 📂 backend/                # Backend specifications
│   ├── 📂 database/               # Database schemas
│   ├── 📂 deployment/             # Deployment guides
│   ├── 📂 frontend/               # Frontend documentation
│   └── 📂 guides/                 # Development guides
├── 📂 ops/                         # Operations & deployment
│   ├── 📂 deploy/                 # Deployment scripts
│   ├── 📂 nginx/                  # Nginx configuration
│   └── 📂 config/                 # Runtime config templates
├── 📂 docker/                      # Docker configurations
│   ├── docker-compose.yml         # Development compose
│   ├── docker-compose.prod.yml    # Production compose
│   └── Dockerfile.standard        # Alternative Dockerfile
└── 📂 .amazonq/                    # Amazon Q configuration
    └── 📂 rules/                   # Development rules
```

## 📋 Key Files

### Configuration Files
- `package.json` - Dependencies and scripts
- `vite.config.js` - Vite build configuration
- `tailwind.config.js` - TailwindCSS configuration
- `postcss.config.js` - PostCSS configuration
- `.env.example` - Environment variables template
- `.env.production` - Production environment

### Docker & Deployment
- `Dockerfile` - Main Docker image
- `docker/docker-compose.yml` - Development environment
- `docker/docker-compose.prod.yml` - Production environment
- `ops/deploy/build-and-deploy.sh` - Deployment script

### Documentation
- `README.md` - Main project documentation
- `PROJECT_STRUCTURE.md` - This file
- `docs/guides/PROJECT_OVERVIEW.md` - Architecture overview
- `docs/guides/DEVELOPMENT_GUIDE.md` - Development standards
- `docs/frontend/UI_DESIGN_SPECIFICATION.md` - UI specifications

## 🎯 Feature Organization

### Core Features
- **Authentication** (`src/features/auth/`) - Login systems
- **Dashboard** (`src/features/dashboard/`) - Main dashboard
- **Brand Management** (`src/features/brand/`) - Multi-brand support
- **User Management** (`src/features/user/`) - User CRUD operations

### HRM Modules
- **Schedule Management** (`src/features/hrm/schedule/`) - Shift scheduling
- **Leave Management** (`src/features/hrm/leave/`) - Leave requests & types
- **Attendance System** (`src/features/hrm/attendance/`) - Smart attendance
- **Notice Management** (`src/features/hrm/notice/`) - System announcements
- **Salary Management** (`src/features/hrm/salary/`) - Payroll system

### Agent Interface
- **Agent Dashboard** (`src/features/agent/`) - Employee self-service
- **Agent Monitor** (`src/features/monitor/`) - Real-time monitoring

### System Features
- **Setup** (`src/features/setup/`) - Initial configuration
- **System Settings** (`src/features/system/`) - System management

## 🔧 Development Workflow

### Local Development
```bash
npm install          # Install dependencies
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
```

### Docker Development
```bash
docker-compose up -d                    # Development environment
docker-compose -f docker/docker-compose.prod.yml up -d  # Production environment
```

### Deployment
```bash
./ops/deploy/build-and-deploy.sh <EC2_IP> ubuntu  # Deploy to EC2
```

## 📚 Documentation Structure

### API Documentation (`docs/api/`)
- API integration guides
- Backend API specifications
- Salary management API checklist

### Backend Documentation (`docs/backend/`)
- Backend implementation guides
- Python code examples
- Requirements and dependencies

### Database Documentation (`docs/database/`)
- Database schema files
- Migration scripts
- System settings schemas

### Deployment Documentation (`docs/deployment/`)
- Deployment guides
- Docker configurations
- Production setup instructions

### Frontend Documentation (`docs/frontend/`)
- UI design specifications
- Mobile optimization guides
- Frontend issue analysis

### Development Guides (`docs/guides/`)
- Development standards
- Project overview
- Integration guides
- System architecture

## 🎨 Component Architecture

### UI Components (`src/components/ui/`)
- shadcn/ui base components
- Reusable form elements
- Layout components

### Feature Components (`src/features/*/`)
- Business logic components
- Feature-specific UI
- Page components

### Shared Components (`src/components/`)
- Cross-feature components
- Layout and navigation
- Permission gates

## 🔄 State Management

### Stores (`src/store/`)
- `authStore.jsx` - Authentication state
- `systemStore.jsx` - System configuration

### Contexts (`src/contexts/`)
- Permission context
- Theme context (if applicable)

### Hooks (`src/hooks/`)
- Custom React hooks
- API integration hooks
- Permission checking hooks

## 🌐 Internationalization

### Locales (`src/locales/`)
- `translations.json` - Translation strings
- `i18n.jsx` - i18next configuration
- Supported languages: Chinese, English, Japanese

## 🚀 Build & Deployment

### Build Process
1. Vite builds the application
2. Docker creates production image
3. Nginx serves static files
4. Runtime configuration loaded

### Environment Configuration
- Development: `http://localhost:3000`
- Production: Configurable via runtime config
- API endpoints: Dynamic configuration

This structure provides clear separation of concerns, making the codebase maintainable and scalable.