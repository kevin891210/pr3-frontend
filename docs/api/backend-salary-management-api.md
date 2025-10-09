# Salary Management Backend API Specification

## Overview
This document outlines the backend API requirements for the Salary Management system, including database schema, API endpoints, and implementation guidelines.

## Database Schema

### 1. salary_settings
```sql
CREATE TABLE salary_settings (
    id VARCHAR(36) PRIMARY KEY,
    workspace_id VARCHAR(36) NOT NULL,
    has_fixed_tax BOOLEAN DEFAULT true,
    fixed_tax_rate DECIMAL(5,4) DEFAULT 0.05,
    transfer_fee DECIMAL(10,2) DEFAULT 15.00,
    payroll_cycle ENUM('weekly', 'biweekly', 'monthly', 'quarterly') DEFAULT 'monthly',
    payroll_day INT DEFAULT 25,
    cutoff_day INT DEFAULT 20,
    auto_generate_days INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace_id (workspace_id)
);
```

### 2. salary_grades
```sql
CREATE TABLE salary_grades (
    id VARCHAR(36) PRIMARY KEY,
    grade_name VARCHAR(100) NOT NULL,
    base_salary DECIMAL(12,2) NOT NULL,
    hourly_rate DECIMAL(8,2) GENERATED ALWAYS AS (base_salary / 240) STORED,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_grade_name (grade_name),
    INDEX idx_is_active (is_active)
);
```

### 3. employee_salaries
```sql
CREATE TABLE employee_salaries (
    id VARCHAR(36) PRIMARY KEY,
    member_id VARCHAR(100) NOT NULL,
    member_name VARCHAR(100) NOT NULL,
    member_email VARCHAR(255) NOT NULL,
    salary_grade_id VARCHAR(36) NOT NULL,
    effective_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (salary_grade_id) REFERENCES salary_grades(id),
    INDEX idx_member_id (member_id),
    INDEX idx_effective_date (effective_date),
    INDEX idx_is_active (is_active)
);
```

### 4. salary_adjustment_types
```sql
CREATE TABLE salary_adjustment_types (
    id VARCHAR(36) PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL,
    adjustment_type ENUM('bonus', 'deduction', 'allowance') NOT NULL,
    is_percentage BOOLEAN DEFAULT false,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type_name (type_name),
    INDEX idx_adjustment_type (adjustment_type)
);
```

### 5. salary_adjustments
```sql
CREATE TABLE salary_adjustments (
    id VARCHAR(36) PRIMARY KEY,
    member_id VARCHAR(100) NOT NULL,
    adjustment_type_id VARCHAR(36) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    reason TEXT,
    adjustment_date DATE NOT NULL,
    status ENUM('pending', 'processed', 'cancelled') DEFAULT 'pending',
    processed_at TIMESTAMP NULL,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (adjustment_type_id) REFERENCES salary_adjustment_types(id),
    INDEX idx_member_id (member_id),
    INDEX idx_adjustment_date (adjustment_date),
    INDEX idx_status (status)
);
```

### 6. salary_calculations
```sql
CREATE TABLE salary_calculations (
    id VARCHAR(36) PRIMARY KEY,
    member_id VARCHAR(100) NOT NULL,
    calculation_period VARCHAR(7) NOT NULL, -- YYYY-MM format
    base_salary DECIMAL(12,2) NOT NULL,
    overtime_hours DECIMAL(8,2) DEFAULT 0,
    overtime_amount DECIMAL(12,2) DEFAULT 0,
    bonus_amount DECIMAL(12,2) DEFAULT 0,
    deduction_amount DECIMAL(12,2) DEFAULT 0,
    gross_salary DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    transfer_fee DECIMAL(10,2) DEFAULT 0,
    net_salary DECIMAL(12,2) NOT NULL,
    status ENUM('draft', 'confirmed', 'paid') DEFAULT 'draft',
    confirmed_at TIMESTAMP NULL,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_member_id (member_id),
    INDEX idx_calculation_period (calculation_period),
    INDEX idx_status (status),
    UNIQUE KEY unique_member_period (member_id, calculation_period)
);
```

## API Endpoints

### 1. Salary Settings APIs

#### GET /api/v1/salary/settings/{workspace_id}
Get salary settings for a workspace
```json
Response:
{
  "success": true,
  "data": {
    "id": "setting_id",
    "workspace_id": "workspace_id",
    "has_fixed_tax": true,
    "fixed_tax_rate": 0.05,
    "transfer_fee": 15.00,
    "payroll_cycle": "monthly",
    "payroll_day": 25,
    "cutoff_day": 20,
    "auto_generate_days": 3
  }
}
```

#### POST /api/v1/salary/settings/{workspace_id}
Create or update salary settings
```json
Request:
{
  "has_fixed_tax": true,
  "fixed_tax_rate": 0.05,
  "transfer_fee": 15.00,
  "payroll_cycle": "monthly",
  "payroll_day": 25,
  "cutoff_day": 20,
  "auto_generate_days": 3
}

Response:
{
  "success": true,
  "message": "Salary settings saved successfully"
}
```

### 2. Salary Grades APIs

#### GET /api/v1/salary/grades
Get all salary grades
```json
Response:
{
  "success": true,
  "data": [
    {
      "id": "grade_id",
      "grade_name": "Junior Employee",
      "base_salary": 30000.00,
      "hourly_rate": 125.00,
      "description": "Entry level position",
      "is_active": true
    }
  ]
}
```

#### POST /api/v1/salary/grades
Create new salary grade
```json
Request:
{
  "grade_name": "Senior Employee",
  "base_salary": 45000.00,
  "description": "Experienced employee"
}

Response:
{
  "success": true,
  "data": {
    "id": "new_grade_id",
    "grade_name": "Senior Employee",
    "base_salary": 45000.00,
    "hourly_rate": 187.50
  }
}
```

#### PUT /api/v1/salary/grades/{grade_id}
Update salary grade
```json
Request:
{
  "grade_name": "Senior Employee Updated",
  "base_salary": 50000.00,
  "description": "Updated description"
}
```

#### DELETE /api/v1/salary/grades/{grade_id}
Delete salary grade (soft delete - set is_active = false)

### 3. Employee Salary APIs

#### GET /api/v1/salary/employees
Get all employee salary assignments
```json
Response:
{
  "success": true,
  "data": [
    {
      "id": "employee_salary_id",
      "member_id": "emp001",
      "member_name": "John Doe",
      "member_email": "john@example.com",
      "salary_grade": {
        "id": "grade_id",
        "grade_name": "Senior Employee",
        "base_salary": 45000.00,
        "hourly_rate": 187.50
      },
      "effective_date": "2024-01-01",
      "is_active": true
    }
  ]
}
```

#### POST /api/v1/salary/employees/{employee_id}
Set employee salary
```json
Request:
{
  "member_name": "John Doe",
  "member_email": "john@example.com",
  "salary_grade_id": "grade_id",
  "effective_date": "2024-01-01"
}
```

#### GET /api/v1/salary/employees/{employee_id}/history
Get employee salary history
```json
Response:
{
  "success": true,
  "data": [
    {
      "id": "history_id",
      "change_date": "2024-01-01",
      "from_grade": null,
      "to_grade": "Junior Employee",
      "from_salary": null,
      "to_salary": 30000.00,
      "reason": "Initial assignment",
      "changed_by": "HR Admin"
    }
  ]
}
```

### 4. Salary Adjustment APIs

#### GET /api/v1/salary/adjustment-types
Get all adjustment types
```json
Response:
{
  "success": true,
  "data": [
    {
      "id": "type_id",
      "type_name": "Performance Bonus",
      "adjustment_type": "bonus",
      "is_percentage": false,
      "description": "Monthly performance bonus"
    }
  ]
}
```

#### POST /api/v1/salary/adjustment-types
Create adjustment type
```json
Request:
{
  "type_name": "Overtime Allowance",
  "adjustment_type": "allowance",
  "is_percentage": false,
  "description": "Additional payment for overtime work"
}
```

#### GET /api/v1/salary/adjustments
Get salary adjustments
```json
Query Parameters:
- member_id (optional)
- status (optional): pending, processed, cancelled
- date_from (optional): YYYY-MM-DD
- date_to (optional): YYYY-MM-DD

Response:
{
  "success": true,
  "data": [
    {
      "id": "adjustment_id",
      "member_id": "emp001",
      "member_name": "John Doe",
      "adjustment_type": {
        "id": "type_id",
        "type_name": "Performance Bonus",
        "adjustment_type": "bonus"
      },
      "amount": 5000.00,
      "reason": "Excellent performance in Q1",
      "adjustment_date": "2024-03-31",
      "status": "processed"
    }
  ]
}
```

#### POST /api/v1/salary/adjustments
Create salary adjustment
```json
Request:
{
  "member_id": "emp001",
  "adjustment_type_id": "type_id",
  "amount": 5000.00,
  "reason": "Performance bonus",
  "adjustment_date": "2024-03-31"
}
```

### 5. Salary Calculation APIs

#### GET /api/v1/salary/calculations
Get salary calculations
```json
Query Parameters:
- member_id (optional)
- period (optional): YYYY-MM
- status (optional): draft, confirmed, paid

Response:
{
  "success": true,
  "data": [
    {
      "id": "calculation_id",
      "member_id": "emp001",
      "member_name": "John Doe",
      "calculation_period": "2024-03",
      "base_salary": 45000.00,
      "overtime_hours": 10.5,
      "overtime_amount": 1968.75,
      "bonus_amount": 5000.00,
      "deduction_amount": 0.00,
      "gross_salary": 51968.75,
      "tax_amount": 2598.44,
      "transfer_fee": 15.00,
      "net_salary": 49355.31,
      "status": "confirmed"
    }
  ]
}
```

#### POST /api/v1/salary/calculations
Create salary calculation
```json
Request:
{
  "member_id": "emp001",
  "calculation_period": "2024-03",
  "overtime_hours": 10.5,
  "adjustments": [
    {
      "adjustment_id": "adj_id_1",
      "amount": 5000.00
    }
  ]
}

Response:
{
  "success": true,
  "data": {
    "id": "calculation_id",
    "gross_salary": 51968.75,
    "tax_amount": 2598.44,
    "net_salary": 49355.31
  }
}
```

#### PUT /api/v1/salary/calculations/{calculation_id}/confirm
Confirm salary calculation
```json
Response:
{
  "success": true,
  "message": "Salary calculation confirmed"
}
```

#### PUT /api/v1/salary/calculations/{calculation_id}/pay
Mark salary as paid
```json
Response:
{
  "success": true,
  "message": "Salary marked as paid"
}
```

### 6. Salary Reports APIs

#### GET /api/v1/salary/reports
Get salary reports
```json
Query Parameters:
- period_from: YYYY-MM
- period_to: YYYY-MM
- member_id (optional)
- department (optional)

Response:
{
  "success": true,
  "data": {
    "summary": {
      "total_employees": 150,
      "total_gross_salary": 6750000.00,
      "total_tax": 337500.00,
      "total_net_salary": 6412500.00,
      "average_salary": 45000.00
    },
    "by_grade": [
      {
        "grade_name": "Senior Employee",
        "employee_count": 50,
        "total_salary": 2250000.00,
        "average_salary": 45000.00
      }
    ]
  }
}
```

#### GET /api/v1/salary/statistics
Get salary statistics
```json
Query Parameters:
- period: YYYY-MM (default: current month)

Response:
{
  "success": true,
  "data": {
    "monthly_trend": [
      {
        "period": "2024-01",
        "total_salary": 6500000.00,
        "employee_count": 145
      }
    ],
    "grade_distribution": [
      {
        "grade_name": "Junior Employee",
        "count": 60,
        "percentage": 40.0
      }
    ],
    "adjustment_summary": {
      "total_bonus": 150000.00,
      "total_deduction": 25000.00,
      "total_allowance": 75000.00
    }
  }
}
```

## Implementation Guidelines

### 1. Authentication & Authorization
- All endpoints require valid JWT token
- Implement role-based access control:
  - `salary.read`: View salary data
  - `salary.write`: Create/update salary data
  - `salary.admin`: Full salary management access

### 2. Data Validation
- Validate salary amounts (positive numbers, reasonable ranges)
- Validate dates (effective dates, calculation periods)
- Validate tax rates (0-1 range for percentages)
- Validate employee IDs against existing members

### 3. Business Logic
- **Hourly Rate Calculation**: `hourly_rate = base_salary / 240` (assuming 8 hours/day, 30 days/month)
- **Overtime Calculation**: `overtime_amount = overtime_hours * hourly_rate * 1.5`
- **Tax Calculation**: `tax_amount = gross_salary * tax_rate` (if fixed tax enabled)
- **Net Salary**: `net_salary = gross_salary - tax_amount - transfer_fee`

### 4. Error Handling
```json
Error Response Format:
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid salary amount",
    "details": {
      "field": "base_salary",
      "value": -1000,
      "constraint": "must be positive"
    }
  }
}
```

### 5. Performance Considerations
- Index frequently queried fields (member_id, dates, status)
- Implement pagination for large datasets
- Cache salary settings and grades
- Use database transactions for salary calculations

### 6. Audit Trail
- Log all salary changes with user information
- Track calculation history and modifications
- Maintain salary change reasons and approval workflow

### 7. Integration Points
- **Brand/Workspace API**: Validate workspace access
- **Member API**: Fetch employee information
- **Notification API**: Send salary calculation notifications
- **Report API**: Generate PDF/Excel salary reports

This specification provides a comprehensive foundation for implementing the salary management backend system with proper data modeling, API design, and business logic handling.