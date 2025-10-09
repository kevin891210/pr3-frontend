# HRM Frontend - Technology Stack

## Programming Languages & Frameworks

### Core Technologies
- **JavaScript/JSX**: Primary development language with ES6+ features
- **React 18.2.0**: Modern React with hooks, concurrent features, and automatic batching
- **Vite 5.0.0**: Fast build tool and development server with HMR
- **Node.js**: Runtime environment for build tools and development server

### UI & Styling
- **TailwindCSS 3.3.0**: Utility-first CSS framework for rapid UI development
- **shadcn/ui**: High-quality React components built on Radix UI primitives
- **Radix UI**: Unstyled, accessible UI primitives
  - `@radix-ui/react-dialog`: Modal dialogs and overlays
  - `@radix-ui/react-select`: Dropdown select components
  - `@radix-ui/react-tabs`: Tab navigation components
  - `@radix-ui/react-toast`: Toast notifications
- **Lucide React 0.294.0**: Beautiful, customizable SVG icons
- **CSS Modules**: Component-scoped styling with PostCSS

## State Management & Data Fetching

### State Management
- **Zustand 4.5.7**: Lightweight state management with minimal boilerplate
- **React Query (@tanstack/react-query 5.8.0)**: Server state management, caching, and synchronization
- **React Context**: Built-in context for permissions and configuration

### HTTP Client & API
- **Axios 1.12.1**: Promise-based HTTP client with interceptors and request/response transformation
- **WebSocket**: Native WebSocket API for real-time communication

## Specialized Libraries

### Calendar & Scheduling
- **FullCalendar 6.1.0**: Feature-rich calendar component
  - `@fullcalendar/react`: React integration
  - `@fullcalendar/daygrid`: Month view
  - `@fullcalendar/timegrid`: Week/day views
  - `@fullcalendar/resource`: Resource scheduling
  - `@fullcalendar/interaction`: Drag & drop functionality

### Charts & Visualization
- **Recharts 2.8.0**: Composable charting library built on React components and D3

### Date & Time
- **Day.js 1.11.0**: Lightweight date manipulation library (Moment.js alternative)

### Internationalization
- **i18next 23.7.0**: Internationalization framework
- **react-i18next 13.5.0**: React bindings for i18next
- **Supported Languages**: Chinese (Traditional), English, Japanese

### Routing
- **React Router DOM 6.8.0**: Declarative routing for React applications

## Development Tools & Build System

### Build & Development
- **Vite 5.0.0**: Fast build tool with features:
  - Hot Module Replacement (HMR)
  - ES modules support
  - TypeScript support
  - Optimized production builds
- **PostCSS 8.4.0**: CSS processing with plugins
- **Autoprefixer 10.4.0**: Automatic vendor prefixing

### Code Quality
- **ESLint 8.45.0**: JavaScript/JSX linting with rules:
  - `eslint-plugin-react`: React-specific linting
  - `eslint-plugin-react-hooks`: React Hooks linting
  - `eslint-plugin-react-refresh`: React Fast Refresh compatibility

### Utility Libraries
- **clsx 2.0.0**: Conditional className utility
- **tailwind-merge 2.0.0**: Merge Tailwind CSS classes without conflicts
- **tailwindcss-animate 1.0.7**: Animation utilities for Tailwind
- **class-variance-authority 0.7.0**: Type-safe component variants

## Development Commands

### Local Development
```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev
# or
npm start

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

### Docker Development
```bash
# Local development with Docker
docker compose up -d

# Production build
docker compose -f docker-compose.prod.yml up -d
```

## Deployment Technologies

### Containerization
- **Docker**: Application containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Reverse proxy and static file serving

### Cloud Infrastructure
- **AWS EC2**: Production hosting
- **Ubuntu 22.04**: Server operating system
- **Supervisor**: Process management in production

### Configuration Management
- **Runtime Config**: JSON-based configuration loading
- **Environment Variables**: Development/production environment separation
- **Health Checks**: Automated service monitoring

## Browser Support
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **ES6+ Features**: Native support for modern JavaScript
- **CSS Grid & Flexbox**: Modern layout techniques
- **WebSocket Support**: Real-time communication capabilities

## Performance Optimizations
- **Code Splitting**: Automatic route-based code splitting
- **Tree Shaking**: Dead code elimination in production builds
- **Asset Optimization**: Image and CSS optimization
- **Caching**: Aggressive caching for static assets
- **Lazy Loading**: Component-level lazy loading for better performance