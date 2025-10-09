# HRM Frontend - Development Guidelines

## Code Quality Standards

### File Organization & Naming
- **Component Files**: Use PascalCase for React components (e.g., `LeavePage.jsx`, `AgentLoginPage.jsx`)
- **Utility Files**: Use camelCase for utilities and services (e.g., `storage.js`, `api.js`)
- **Feature Structure**: Organize by feature domains under `src/features/` (auth, hrm, agent, etc.)
- **File Extensions**: Use `.jsx` for React components, `.js` for utilities and services

### Import Conventions
- **Absolute Imports**: Use `@/` prefix for src-relative imports: `import { Card } from '@/components/ui/card'`
- **Relative Imports**: Use relative paths for same-directory or parent imports: `import '../../../services/api'`
- **Import Grouping**: Group imports in order: React, external libraries, internal components, utilities
- **Named Imports**: Prefer named imports over default imports for better tree-shaking

### Component Structure Patterns
- **Functional Components**: Use function declarations with hooks: `const ComponentName = () => {}`
- **State Management**: Use `useState` for local state, Zustand stores for global state
- **Effect Hooks**: Use `useEffect` with proper dependency arrays and cleanup functions
- **Custom Hooks**: Extract reusable logic into custom hooks (e.g., `useWebSocket`, `usePermissions`)

## React Development Patterns

### State Management Architecture
```javascript
// Local component state
const [loading, setLoading] = useState(false);
const [data, setData] = useState([]);

// Global state with Zustand
const { user, hasPermission } = useAuthStore();
const { config } = useSystemStore();

// Server state with React Query patterns
const { data: response, error } = useQuery(['key'], fetchFunction);
```

### Event Handling Patterns
```javascript
// Form submission with validation
const handleSubmit = async (e) => {
  e.preventDefault();
  // Validation logic
  // API call with error handling
  // State updates
};

// Async operations with loading states
const handleAction = async (id, action) => {
  try {
    setLoading(true);
    await apiClient.performAction(id, action);
    // Success handling
  } catch (error) {
    // Error handling with user feedback
  } finally {
    setLoading(false);
  }
};
```

### Conditional Rendering Standards
```javascript
// Permission-based rendering
{hasPermission('leave.admin') && (
  <Button onClick={handleAdminAction}>Admin Action</Button>
)}

// Data existence checks
{Array.isArray(data) && data.length > 0 ? (
  data.map(item => <Component key={item.id} {...item} />)
) : (
  <EmptyState type="data" title="No Data" />
)}

// Loading states
{loading ? <LoadingSpinner /> : <Content />}
```

## API Integration Patterns

### API Client Architecture
- **Centralized Client**: Single `ApiClient` class in `services/api.js`
- **Method Naming**: Use descriptive method names: `getLeaveRequests()`, `createScheduleAssignment()`
- **Error Handling**: Consistent error handling with meaningful messages
- **Token Management**: Automatic token injection and refresh handling

### API Call Patterns
```javascript
// Standard API call with error handling
const loadData = async () => {
  try {
    const response = await apiClient.getLeaveRequests(params);
    const data = response.data || response;
    setData(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Failed to load data:', error);
    setData([]);
  }
};

// Parameterized API calls
const response = await apiClient.getScheduleAssignments({
  member_id: memberId,
  start_date: startDate,
  end_date: endDate
});
```

### Caching Strategy
- **Cache Keys**: Use consistent naming in `CACHE_KEYS` constant
- **Cache Expiry**: Different expiry times based on data volatility
- **Cache Invalidation**: Clear cache after mutations to ensure data consistency
- **Fallback Handling**: Graceful degradation when cache is unavailable

## UI/UX Development Standards

### Component Composition
```javascript
// Reusable UI components from shadcn/ui
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';

// Custom components for specific features
import EmptyState from '@/components/ui/empty-state';
import SearchableSelect from '@/components/ui/searchable-select';
```

### Form Handling Patterns
```javascript
// Controlled form inputs
<Input
  value={formData.field}
  onChange={(e) => setFormData(prev => ({ ...prev, field: e.target.value }))}
  required
/>

// Form validation
const isValid = formData.field.trim() && formData.otherField;

// Form submission
<form onSubmit={handleSubmit}>
  {/* Form fields */}
  <Button type="submit" disabled={!isValid}>Submit</Button>
</form>
```

### Modal and Dialog Patterns
```javascript
// Modal state management
const [showModal, setShowModal] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);

// Modal with form data
{showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <Card className="w-full max-w-md mx-4">
      <CardHeader>
        <CardTitle>Modal Title</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Modal content */}
      </CardContent>
    </Card>
  </div>
)}
```

## Data Handling Conventions

### Array and Object Safety
```javascript
// Safe array operations
const items = Array.isArray(data) ? data : [];
items.map(item => ({ ...item, processed: true }));

// Safe object access
const value = response?.data?.field || defaultValue;
const nested = object?.nested?.property ?? fallback;
```

### Date and Time Handling
```javascript
// Date validation
const isValidDate = date && !isNaN(new Date(date));

// Date formatting
const formattedDate = new Date(dateString).toLocaleDateString();
const formattedDateTime = new Date(dateString).toLocaleString();

// Date calculations
const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
```

### Pagination Patterns
```javascript
// Pagination state
const [pagination, setPagination] = useState({
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 0
});

// Pagination controls
<Button
  disabled={pagination.currentPage === 1}
  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
>
  Previous
</Button>
```

## Error Handling & User Feedback

### Error Display Patterns
```javascript
// Alert dialogs for user feedback
const [alertDialog, setAlertDialog] = useState({
  open: false,
  type: 'info',
  title: '',
  message: ''
});

// Toast notifications for real-time updates
const { toast } = useToast();
toast({
  title: 'Success',
  description: 'Operation completed successfully',
  variant: 'success'
});
```

### Loading States
```javascript
// Component-level loading
{loading ? (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
) : (
  <Content />
)}

// Global loading with overlay
{configLoaded ? <App /> : <LoadingScreen />}
```

## Performance Optimization

### React Optimization Patterns
- **Dependency Arrays**: Always include proper dependencies in `useEffect`
- **Callback Optimization**: Use `useCallback` for expensive operations
- **Memoization**: Use `useMemo` for computed values
- **Component Splitting**: Split large components into smaller, focused ones

### API Optimization
- **Batch Operations**: Use batch APIs when available: `batchCreateScheduleAssignments()`
- **Conditional Loading**: Only load data when needed
- **Cache First**: Check cache before making API calls
- **Debouncing**: Debounce search and filter operations

## Security & Authentication

### Token Management
```javascript
// Token storage and retrieval
const token = localStorage.getItem('token');
const thirdPartyToken = localStorage.getItem('third_party_token');

// API calls with authentication
return this.request(endpoint, {
  headers: {
    ...(this.token && { Authorization: `Bearer ${this.token}` }),
    ...(thirdPartyToken && { 'X-Third-Party-Token': thirdPartyToken })
  }
});
```

### Permission Checking
```javascript
// Component-level permission gates
{hasPermission('leave.admin') && <AdminComponent />}

// Route-level protection
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
};
```

## Testing & Debugging

### Console Logging Standards
```javascript
// Structured logging for debugging
console.log('Received leave request update:', data);
console.error('Failed to load leave data:', error);
console.warn('Leave balance API not available, using fallback data:', error.message);
```

### Error Boundaries
- Implement error boundaries for critical components
- Provide fallback UI for error states
- Log errors for debugging and monitoring

## Code Documentation

### Comment Standards
- **Function Comments**: Document complex business logic
- **API Comments**: Document API integration points and expected responses
- **TODO Comments**: Mark incomplete implementations clearly
- **Warning Comments**: Highlight important considerations or limitations

### JSDoc Patterns
```javascript
/**
 * 取得指定 Brand 的 Workspace 列表
 * 使用 Brand ID 作為快取鍵值的一部分
 * @param {string} brandId - Brand ID
 * @param {boolean} useCache - 是否使用快取
 * @returns {Promise<Object>} API response with workspace data
 */
async getBrandWorkspaces(brandId, useCache = true) {
  // Implementation
}
```