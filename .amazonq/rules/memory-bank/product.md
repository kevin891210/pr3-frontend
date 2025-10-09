# HRM Frontend - Product Overview

## Project Purpose
A comprehensive Human Resource Management (HRM) frontend platform built for managing workforce operations, scheduling, leave management, payroll, and attendance tracking. The system serves both administrators and agents with role-based access control.

## Core Value Proposition
- **Unified HRM Platform**: Single interface for all HR operations including scheduling, leave management, payroll, and attendance
- **Multi-Brand Support**: Manages multiple brands and workspaces from one platform
- **Real-time Monitoring**: Live agent status monitoring and WebSocket-based notifications
- **Intelligent Attendance**: Automated attendance tracking with API integration and anomaly detection
- **Flexible Deployment**: Docker-based deployment with runtime configuration management

## Key Features & Capabilities

### System Management
- **Runtime Configuration**: Dynamic API endpoint switching without container rebuilds
- **Initial Setup Page**: `/setup` route for backend API configuration and connection validation
- **Dual Authentication**: Separate login systems for system administrators and agents
- **RBAC Permissions**: Owner/Admin/TeamLeader/Agent/Auditor role hierarchy

### HRM Core Modules
- **Brand Management**: Multi-brand support with resource synchronization
- **User Management**: Role-based permissions and account administration
- **Schedule Management**: Visual calendar scheduling with shift templates and drag-drop assignment
- **Leave Management**: Leave applications, approval workflows, and balance tracking
- **Payroll Management**: Salary grades, calculation engine, adjustment records, and statistical reports
- **Smart Attendance System**: Automated attendance monitoring, API integration, anomaly detection, and connection testing
- **Notice Management**: System announcements and notifications
- **Agent Monitor**: Real-time agent status monitoring dashboard

### Agent Interface
- **Agent Dashboard**: Personal schedule calendar and leave balance overview
- **Leave Application**: Streamlined leave request process with automatic day calculation
- **Notice Viewing**: Latest system announcements display

## Target Users

### Primary Users
- **HR Administrators**: Full system access for managing all HR operations
- **Team Leaders**: Department-level management capabilities
- **Agents/Employees**: Self-service portal for schedules, leave requests, and announcements

### Use Cases
- **Workforce Scheduling**: Create and manage shift schedules across multiple brands/locations
- **Leave Management**: Process leave requests with approval workflows and balance tracking
- **Attendance Monitoring**: Track employee attendance with automated systems and reporting
- **Payroll Processing**: Calculate salaries with overtime, deductions, and adjustments
- **Multi-Brand Operations**: Manage HR operations across different business units
- **Real-time Monitoring**: Monitor agent status and system health in real-time

## Technical Highlights
- **Modern Stack**: React 18 + Vite + TypeScript for fast development and performance
- **Enterprise UI**: TailwindCSS + shadcn/ui for consistent, professional interface
- **Advanced Calendar**: FullCalendar with resource views and cross-day scheduling
- **State Management**: Zustand + React Query for efficient data handling
- **Internationalization**: Multi-language support (Chinese, English, Japanese)
- **Production Ready**: Docker + Nginx + AWS EC2 deployment pipeline