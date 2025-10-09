# HRM Frontend - UI Design Specification

## 📋 Overview
This document provides comprehensive UI/UX design specifications for the HRM (Human Resource Management) frontend platform. It includes system architecture, API endpoints, user flows, and design requirements for professional UI teams.

## 🎯 Target Users & Personas

### Primary Users
1. **HRM Administrators** - Full system access, manage all HR operations
2. **Team Leaders** - Department-level management, approve leave requests
3. **Agents/Employees** - Self-service portal for schedules and leave requests
4. **System Owners** - Platform configuration and brand management

### User Roles & Permissions
- **Owner**: Full system access (`*` permissions)
- **Admin**: System, brand, schedule, leave, notice, user management
- **TeamLeader**: Schedule read/write, leave approval, notice read, agent read
- **Agent**: Schedule read, leave create/read, notice read, agent read
- **Auditor**: Read-only access to all modules

## 🏗️ System Architecture

### Frontend Stack
- **Framework**: React 18 + Vite + TypeScript
- **UI Library**: TailwindCSS + shadcn/ui + Lucide React icons
- **Calendar**: FullCalendar with resource views and drag-drop
- **Charts**: Recharts for data visualization
- **State Management**: Zustand + React Query
- **Internationalization**: react-i18next (Chinese, English, Japanese)

### API Base URL
- **Development**: `http://127.0.0.1:8000`
- **Production**: Configurable via runtime config

## 🔐 Authentication & Authorization

### Login Systems
1. **Admin Login** - `/login`
   - API: `POST /api/v1/auth/sign-in`
   - Fields: email, password
   - Response: `{ success, data: { token, user_info } }`

2. **Agent Login** - `/agent-login`
   - API: `POST /api/v1/agent/auth/agent-sign-in`
   - Fields: brand_id, email, password
   - Response: `{ success, data: { token, brand_id, member_id, member_name, third_party_token } }`

### Token Management
- **Storage**: localStorage with key `token`
- **Header**: `Authorization: Bearer {token}`
- **Third-party Token**: `X-Third-Party-Token: {third_party_token}` (for Agent APIs)

## 📱 Page Structure & Navigation

### Admin Interface
```
/dashboard - Main dashboard with statistics
/brands - Brand management
/users - User management  
/hrm/schedule - Schedule management with calendar
/hrm/leave - Leave management (requests, types, agent config)
/hrm/attendance - Smart attendance system
/hrm/notice - Notice management
/hrm/salary - Salary management
/monitor - Agent monitoring dashboard
/system - System settings
```

### Agent Interface
```
/agent-dashboard - Personal dashboard
/agent-login - Agent login page
```

## 🎨 UI Components & Design System

### Core Components (shadcn/ui)
- **Button**: Primary, secondary, destructive variants
- **Card**: Content containers with header/content sections
- **Dialog**: Modal dialogs for forms and confirmations
- **Input**: Text inputs, date pickers, number inputs
- **Select**: Dropdown selections with search capability
- **Badge**: Status indicators with color coding
- **Tabs**: Navigation between different views
- **Toast**: Notification system

### Custom Components
- **EmptyState**: No data placeholders
- **SearchableSelect**: Searchable dropdown with filtering
- **PermissionGate**: Role-based component rendering
- **LanguageSwitcher**: Multi-language toggle
- **StatusBadge**: Colored status indicators

### Color Scheme
- **Primary**: Blue (#3b82f6, #1d4ed8)
- **Success**: Green (#10b981, #059669)
- **Warning**: Yellow/Orange (#f59e0b, #d97706)
- **Danger**: Red (#ef4444, #dc2626)
- **Gray Scale**: (#f9fafb, #f3f4f6, #e5e7eb, #d1d5db, #9ca3af, #6b7280, #374151, #1f2937)

## 📊 Dashboard Design Requirements

### Admin Dashboard
- **Statistics Cards**: Total users, active agents, pending requests, system health
- **Charts**: Monthly trends, department breakdown, leave statistics
- **Quick Actions**: Create user, approve requests, system alerts
- **Recent Activity**: Latest system events and notifications

### Agent Dashboard
- **Personal Info**: Name, role, current status
- **Schedule Calendar**: Personal schedule view (mobile-responsive)
- **Leave Balance**: Available days by leave type with progress bars
- **Recent Requests**: Latest leave applications with status
- **Notices**: System announcements

## 🗓️ Schedule Management

### Calendar Interface
- **Views**: Month, week, day views with resource scheduling
- **Features**: Drag-drop assignment, cross-day shifts, timezone support
- **Scalability**: Optimized for 30+ employees per day with compact event display
- **Event Display**: Compact layout with 11px font, 18px min-height, ellipsis overflow
- **Performance**: No dayMaxEvents limit, 10 max rows with "more" link popover
- **API Endpoints**:
  - `GET /api/v1/shift-categories` - Shift categories
  - `GET /api/v1/shift-templates` - Shift templates
  - `GET /api/v1/schedule-assignments` - Schedule assignments
  - `POST /api/v1/schedule-assignments/batch` - Batch create assignments

### Shift Management
- **Categories**: Full day, rotating, custom shifts
- **Templates**: Reusable shift patterns with break periods
- **Assignment**: Member-to-shift assignment with validation

## 📝 Leave Management System

### Leave Requests Interface
- **Tabs**: Pending requests, review history
- **Filters**: Status, date range, member, leave type
- **Actions**: View details, approve/reject with reasons
- **API Endpoints**:
  - `GET /api/v1/leave-requests` - List requests (with pagination)
  - `POST /api/v1/leave-requests` - Create request
  - `POST /api/v1/leave-requests/{id}/approve` - Approve request
  - `POST /api/v1/leave-requests/{id}/reject` - Reject request

### Leave Types Management
- **CRUD Operations**: Create, read, update, delete leave types
- **Fields**: Name, code, annual quota, half-day allowed, attachment required
- **New Feature**: Handover required days threshold
- **API Endpoints**:
  - `GET /api/v1/leave-types` - List leave types
  - `POST /api/v1/leave-types` - Create leave type
  - `PUT /api/v1/leave-types/{id}` - Update leave type
  - `DELETE /api/v1/leave-types/{id}` - Delete leave type

### Agent Configuration
- **Individual Allowances**: Set custom leave days per agent per leave type
- **Zero-day Filtering**: Hide leave types with 0 days allowance from agent view
- **API Endpoints**:
  - `GET /api/v1/agent-leave-allowances/{member_id}` - Get allowances
  - `PUT /api/v1/agent-leave-allowances/{member_id}` - Update allowances

### Leave Balance Display
- **Progress Bars**: Visual representation of used vs remaining days
- **Multi-type Support**: Different leave types with individual balances
- **API Endpoints**:
  - `GET /api/v1/leave-balance/{member_id}` - Individual balance
  - `GET /api/v1/leave-balances` - All employee balances

### Handover List Feature
- **Dynamic Form**: Show handover field when days exceed threshold
- **Validation**: Required field for long-term leave requests
- **Display**: Show handover content in request details

## 💰 Salary Management

### Salary Grades
- **CRUD Interface**: Manage salary grade levels
- **API Endpoints**:
  - `GET /api/v1/salary/grades` - List grades
  - `POST /api/v1/salary/grades` - Create grade
  - `PUT /api/v1/salary/grades/{id}` - Update grade
  - `DELETE /api/v1/salary/grades/{id}` - Delete grade

### Salary Calculations
- **Form Interface**: Period selection, overtime inputs, absence days
- **Results Display**: Detailed breakdown with non-zero values only
- **API Endpoints**:
  - `POST /api/v1/salary/calculations` - Create calculation
  - `GET /api/v1/salary/calculations/{id}` - Get calculation details
  - `PUT /api/v1/salary/calculations/{id}/confirm` - Confirm calculation

### Reports & Statistics
- **Charts**: Monthly trends, department comparisons
- **Filters**: Date range, department, employee
- **Export**: PDF/Excel export functionality

## 🕐 Attendance Management

### Smart Attendance System
- **Monitoring Dashboard**: Real-time attendance status
- **API Integration**: Third-party attendance system connection
- **Test Connection**: Validate API connectivity
- **API Endpoints**:
  - `GET /api/v1/attendance/monitoring/{workspace_id}` - Monitor status
  - `POST /api/v1/attendance/test-connection/{workspace_id}` - Test connection
  - `POST /api/v1/attendance/sync/{workspace_id}` - Manual sync

### Attendance Records
- **Data Table**: Filterable attendance records
- **Statistics**: Attendance rates, anomaly detection
- **API Logs**: Integration logs with status tracking

## 👥 User & Brand Management

### Brand Management
- **Multi-brand Support**: Switch between different brands
- **Resource Sync**: Synchronize workspaces, members, bots
- **API Endpoints**:
  - `GET /api/v1/brands` - List brands
  - `POST /api/v1/brands` - Create brand
  - `GET /api/v1/workspaces-by-brand/{brand_id}` - Brand workspaces
  - `GET /api/v1/brands/{brand_id}/members` - Brand members

### User Management
- **CRUD Operations**: Create, read, update, delete users
- **Role Assignment**: Assign roles and permissions
- **Password Management**: Secure password updates
- **API Endpoints**:
  - `GET /api/v1/users` - List users
  - `POST /api/v1/users` - Create user
  - `PUT /api/v1/users/{id}` - Update user
  - `PUT /api/v1/users/{id}/password` - Update password

## 📱 Mobile Responsiveness

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile-Specific Components
- **MobileScheduleView**: Simplified schedule display for mobile
- **MobileTable**: Responsive table with horizontal scroll
- **Touch-friendly**: Larger touch targets, swipe gestures

## 🌐 Internationalization

### Supported Languages
- **Chinese (Traditional)**: zh-TW
- **English**: en
- **Japanese**: ja

### Translation Keys
- Organized by feature modules
- Consistent naming convention
- Context-aware translations

## 🔄 Real-time Features

### WebSocket Integration
- **Leave Request Updates**: Real-time status changes
- **Agent Status Monitoring**: Live agent status updates
- **Connection**: `ws://domain/ws?channel=leave_requests`
- **Enable**: `localStorage.setItem('enableWebSocket', 'true')`

### Notification System
- **Toast Notifications**: Success, error, warning messages
- **Real-time Updates**: Automatic data refresh on WebSocket events

## 📊 Data Visualization

### Charts & Graphs
- **Library**: Recharts
- **Types**: Line charts, bar charts, pie charts, area charts
- **Responsive**: Mobile-friendly chart sizing
- **Interactive**: Hover effects, click events

### Statistics Display
- **KPI Cards**: Key performance indicators
- **Progress Bars**: Visual progress representation
- **Trend Indicators**: Up/down arrows with percentages

## 🎛️ System Configuration

### Runtime Configuration
- **Dynamic API URLs**: Change backend without rebuild
- **Feature Toggles**: Enable/disable modules
- **Environment Settings**: Development, staging, production

### Setup Page
- **Initial Configuration**: `/setup` route for first-time setup
- **API Validation**: Test backend connectivity
- **Health Checks**: Verify all required endpoints

## 🔍 Search & Filtering

### Search Components
- **Global Search**: Cross-module search functionality
- **Filtered Lists**: Department, status, date range filters
- **Searchable Selects**: Dropdown with search capability

### Pagination
- **Page Size Options**: 5, 10, 20, 50 items per page
- **Navigation**: Previous, next, page numbers
- **Total Count**: Display total items and current range

## 🚨 Error Handling

### Error States
- **API Errors**: Network failures, server errors
- **Validation Errors**: Form validation feedback
- **Empty States**: No data placeholders
- **Loading States**: Skeleton screens, spinners

### User Feedback
- **Success Messages**: Confirmation of actions
- **Error Messages**: Clear error descriptions
- **Warning Messages**: Important notices
- **Info Messages**: General information

## 📋 Form Design

### Form Components
- **Validation**: Real-time validation with error messages
- **Required Fields**: Clear indication of mandatory fields
- **Date Pickers**: Consistent date selection interface
- **File Uploads**: Drag-drop file upload areas

### Form Patterns
- **Multi-step Forms**: Wizard-style forms for complex processes
- **Modal Forms**: Overlay forms for quick actions
- **Inline Editing**: Edit-in-place functionality

## 🎨 Design Tokens

### Typography
- **Font Family**: System fonts (Inter, SF Pro, Segoe UI)
- **Font Sizes**: 12px, 14px, 16px, 18px, 20px, 24px, 32px
- **Font Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Spacing
- **Scale**: 4px base unit (4, 8, 12, 16, 20, 24, 32, 40, 48, 64px)
- **Component Padding**: Consistent internal spacing
- **Layout Margins**: Consistent external spacing

### Shadows
- **Elevation Levels**: Card shadows, modal shadows, dropdown shadows
- **Hover States**: Interactive element feedback

## 🔧 Development Guidelines

### Component Structure
- **Atomic Design**: Atoms, molecules, organisms, templates, pages
- **Reusability**: Shared components across modules
- **Props Interface**: Clear prop definitions and defaults

### State Management
- **Zustand Stores**: Global state management
- **React Query**: Server state and caching
- **Local State**: Component-level state for UI interactions

### Performance
- **Code Splitting**: Route-based lazy loading
- **Caching**: API response caching with expiration
- **Optimization**: Image optimization, bundle size monitoring

## 📱 Accessibility

### WCAG Compliance
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Proper ARIA labels and roles
- **Color Contrast**: Minimum 4.5:1 contrast ratio
- **Focus Management**: Clear focus indicators

### Inclusive Design
- **Language Support**: Multi-language interface
- **Timezone Support**: Global timezone handling
- **Device Support**: Cross-device compatibility

## 🚀 Deployment & Configuration

### Environment Setup
- **Development**: Local development with hot reload
- **Staging**: Pre-production testing environment
- **Production**: Optimized production build

### Configuration Management
- **Runtime Config**: JSON-based configuration
- **Environment Variables**: Secure credential management
- **Feature Flags**: Toggle features without deployment

---

## 📞 Contact & Support

For UI/UX design questions or clarifications, please contact the development team with specific module or API endpoint references from this document.

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: March 2025