import React, { useState, useEffect } from 'react';
import SimpleCalendar from '../../../components/calendar/SimpleCalendar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Clock, Users, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import apiClient from '../../../services/api';
import { ConfirmDialog, AlertDialog } from '../../../components/ui/dialog';
import EmptyState from '../../../components/ui/empty-state';

const SchedulePage = () => {
  const [events, setEvents] = useState([]);
  const [shiftTemplates, setShiftTemplates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [alertDialog, setAlertDialog] = useState({ open: false, type: 'info', title: '', message: '' });
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [shiftFormData, setShiftFormData] = useState({
    name: '',
    category: '',
    start_time: '',
    end_time: '',
    is_cross_day: false,
    timezone: 'Asia/Taipei',
    total_break_minutes: 60,
    break_periods: [{ start_time: '12:00', end_time: '13:00' }]
  });
  const [assignmentFormData, setAssignmentFormData] = useState({
    brand_id: '',
    workspace_id: '',
    member_id: '',
    template_id: '',
    date: '',
    break_schedule: []
  });
  const [brands, setBrands] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [shiftCategories, setShiftCategories] = useState([
    { id: 'full_day', name: 'Full Day Shift' },
    { id: 'rotating', name: 'Rotating Shift' },
    { id: 'split', name: 'Split Shift' },
    { id: 'flexible', name: 'Flexible Shift' }
  ]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '' });
  const [deleteCategoryDialog, setDeleteCategoryDialog] = useState({ open: false, categoryId: null, categoryName: '' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, shiftId: null, shiftName: '' });
  const [activeTab, setActiveTab] = useState('templates'); // 'templates', 'categories', or 'assignments'
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  useEffect(() => {
    loadScheduleData();
    loadBrands();
  }, []);

  const loadScheduleData = async () => {
    try {
      const response = await apiClient.getShiftTemplates();
      const templatesData = response.data || response;
      setShiftTemplates(Array.isArray(templatesData) ? templatesData : []);

      const scheduleResponse = await apiClient.getScheduleAssignments();
      const scheduleData = scheduleResponse.data || scheduleResponse;
      const eventsArray = Array.isArray(scheduleData) ? scheduleData : [];
      
      console.log('Loaded schedule assignments:', eventsArray);
      setEvents(eventsArray);

      checkConflicts(eventsArray);
    } catch (error) {
      console.error('Failed to load schedule data:', error);
      // Fallback data with test event
      setShiftTemplates([
        { id: 1, name: 'Morning Shift', category: 'full_day', start_time: '08:00', end_time: '16:00', is_cross_day: false, timezone: 'Asia/Taipei', total_break_minutes: 60, break_periods: [{ start_time: '12:00', end_time: '13:00' }], min_staff: 2, max_staff: 5 },
        { id: 2, name: 'Night Shift', category: 'rotating', start_time: '22:00', end_time: '06:00', is_cross_day: true, timezone: 'Asia/Taipei', total_break_minutes: 30, break_periods: [{ start_time: '02:00', end_time: '02:30' }], min_staff: 1, max_staff: 3 }
      ]);
      
      // Add test event to verify calendar display
      const testEvent = {
        id: 'test-1',
        title: 'Test Shift - John Doe',
        start: new Date().toISOString(),
        end: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
      };
      setEvents([testEvent]);
    }
  };

  const loadBrands = async () => {
    try {
      const response = await apiClient.getBrands();
      const brandsData = response.data || response;
      setBrands(Array.isArray(brandsData) ? brandsData : []);
    } catch (error) {
      console.error('Failed to load brands:', error);
      // Fallback data
      setBrands([
        { id: '9317607e-6656-409f-89e1-bb50b64901ed', name: 'New Test Brand', is_active: true },
        { id: 'brand_2', name: 'Demo Brand', is_active: true }
      ]);
    }
  };

  const loadBrandWorkspaces = async (brandId) => {
    if (!brandId) {
      setWorkspaces([]);
      return;
    }
    try {
      const response = await apiClient.getBrandWorkspaces(brandId);
      const workspacesData = response.data || response;
      setWorkspaces(Array.isArray(workspacesData) ? workspacesData : []);
    } catch (error) {
      console.error('Failed to load brand workspaces:', error);
      // Fallback data
      setWorkspaces([
        { id: 'workspace_1', name: 'Customer Service', description: 'Main customer service team' },
        { id: 'workspace_2', name: 'Technical Support', description: 'Technical support team' }
      ]);
    }
  };

  const loadWorkspaceMembers = async (workspaceId) => {
    if (!workspaceId) {
      setWorkspaceMembers([]);
      return;
    }
    try {
      const response = await apiClient.getWorkspaceMembers(workspaceId);
      const membersData = response.data || response;
      setWorkspaceMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error('Failed to load workspace members:', error);
      // Fallback data
      setWorkspaceMembers([
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Agent' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Agent' },
        { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'TeamLeader' }
      ]);
    }
  };

  const checkConflicts = (scheduleEvents) => {
    const conflicts = [];
    
    for (let i = 0; i < scheduleEvents.length; i++) {
      for (let j = i + 1; j < scheduleEvents.length; j++) {
        const event1 = scheduleEvents[i];
        const event2 = scheduleEvents[j];
        
        // 安全檢查 extendedProps 和 userId
        const userId1 = event1.extendedProps?.userId;
        const userId2 = event2.extendedProps?.userId;
        
        // 檢查同一使用者的時間重疊
        if (userId1 && userId2 && userId1 === userId2) {
          const start1 = new Date(event1.start);
          const end1 = new Date(event1.end);
          const start2 = new Date(event2.start);
          const end2 = new Date(event2.end);
          
          if (start1 < end2 && start2 < end1) {
            conflicts.push({
              id: `conflict-${i}-${j}`,
              message: `時間衝突: ${event1.title} 與 ${event2.title}`,
              events: [event1.id, event2.id]
            });
          }
        }
      }
    }
    
    setConflicts(conflicts);
  };

  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr);
    setShowAssignDialog(true);
  };

  const handleEventClick = (info) => {
    const event = info.event;
    
    alert(`Shift Details:
Title: ${event.title}
Start: ${new Date(event.start).toLocaleString()}
End: ${new Date(event.end).toLocaleString()}`);
  };

  const handleEditShift = (template) => {
    setEditingShift(template);
    setShiftFormData({
      name: template.name,
      category: template.category || '',
      start_time: template.start_time,
      end_time: template.end_time,
      is_cross_day: template.is_cross_day,
      timezone: template.timezone || 'Asia/Taipei',
      total_break_minutes: template.total_break_minutes || 60,
      break_periods: template.break_periods || [{ start_time: '12:00', end_time: '13:00' }]
    });
    setShowShiftModal(true);
  };

  const handleDeleteShift = (template) => {
    setDeleteDialog({
      open: true,
      shiftId: template.id,
      shiftName: template.name
    });
  };

  const handleShiftSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!shiftFormData.name || !shiftFormData.start_time || !shiftFormData.end_time) {
      setAlertDialog({
        open: true,
        type: 'warning',
        title: 'Validation Error',
        message: 'Please fill in all required fields.'
      });
      return;
    }
    
    try {
      if (editingShift) {
        const response = await apiClient.updateShiftTemplate(editingShift.id, shiftFormData);
        const updatedShift = response.data || response;
        setShiftTemplates(prev => prev.map(shift => 
          shift.id === editingShift.id ? updatedShift : shift
        ));
        setAlertDialog({
          open: true,
          type: 'success',
          title: 'Update Success',
          message: 'Shift template updated and saved to database successfully'
        });
      } else {
        const response = await apiClient.createShiftTemplate(shiftFormData);
        const newShift = response.data || response;
        setShiftTemplates(prev => [...prev, newShift]);
        setAlertDialog({
          open: true,
          type: 'success',
          title: 'Create Success',
          message: 'Shift template created and saved to database successfully'
        });
      }
      setShowShiftModal(false);
      setEditingShift(null);
      setShiftFormData({ name: '', category: '', start_time: '', end_time: '', is_cross_day: false, timezone: 'Asia/Taipei', total_break_minutes: 60, break_periods: [{ start_time: '12:00', end_time: '13:00' }] });
    } catch (error) {
      setAlertDialog({
        open: true,
        type: 'danger',
        title: 'Save Failed',
        message: `Failed to save to database: ${error.message}`
      });
    }
  };

  const confirmDeleteShift = async () => {
    try {
      await apiClient.deleteShiftTemplate(deleteDialog.shiftId);
      setShiftTemplates(prev => prev.filter(shift => shift.id !== deleteDialog.shiftId));
      setAlertDialog({
        open: true,
        type: 'success',
        title: 'Delete Success',
        message: 'Shift template deleted from database successfully'
      });
    } catch (error) {
      setAlertDialog({
        open: true,
        type: 'danger',
        title: 'Delete Failed',
        message: `Failed to delete from database: ${error.message}`
      });
    }
    setDeleteDialog({ open: false, shiftId: null, shiftName: '' });
  };

  // Handle category selection to auto-fill shift times
  const handleCategoryChange = (categoryId) => {
    setShiftFormData(prev => ({ ...prev, category: categoryId }));
    
    // Auto-fill times based on category
    const categoryDefaults = {
      'full_day': { start_time: '09:00', end_time: '18:00', is_cross_day: false, total_break_minutes: 60 },
      'rotating': { start_time: '22:00', end_time: '06:00', is_cross_day: true, total_break_minutes: 30 },
      'split': { start_time: '09:00', end_time: '13:00', is_cross_day: false, total_break_minutes: 0 },
      'flexible': { start_time: '10:00', end_time: '19:00', is_cross_day: false, total_break_minutes: 60 }
    };
    
    const defaults = categoryDefaults[categoryId];
    if (defaults) {
      setShiftFormData(prev => ({
        ...prev,
        start_time: defaults.start_time,
        end_time: defaults.end_time,
        is_cross_day: defaults.is_cross_day,
        total_break_minutes: defaults.total_break_minutes
      }));
    }
  };

  // Handle brand selection to load workspaces
  const handleBrandChange = (brandId) => {
    setAssignmentFormData(prev => ({ ...prev, brand_id: brandId, workspace_id: '', member_id: '' }));
    setWorkspaceMembers([]);
    loadBrandWorkspaces(brandId);
  };

  // Handle workspace selection to load members
  const handleWorkspaceChange = (workspaceId) => {
    setAssignmentFormData(prev => ({ ...prev, workspace_id: workspaceId, member_id: '' }));
    loadWorkspaceMembers(workspaceId);
  };

  // Handle shift assignment submission
  const handleAssignmentSubmit = async () => {
    // Validate required fields
    if (!assignmentFormData.brand_id || !assignmentFormData.workspace_id || !assignmentFormData.member_id || !assignmentFormData.template_id || !assignmentFormData.date) {
      setAlertDialog({
        open: true,
        type: 'warning',
        title: 'Validation Error',
        message: 'Please fill in all required fields.'
      });
      return;
    }

    try {
      const response = await apiClient.createScheduleAssignment(assignmentFormData);
      const newAssignment = response.data || response;
      
      setAlertDialog({
        open: true,
        type: 'success',
        title: 'Assignment Success',
        message: 'Shift assigned successfully'
      });
      
      setShowAssignmentModal(false);
      setAssignmentFormData({ brand_id: '', workspace_id: '', member_id: '', template_id: '', date: '', break_schedule: [] });
      setWorkspaces([]);
      setWorkspaceMembers([]);
      
      // Reload schedule data to show new assignment
      await loadScheduleData();
    } catch (error) {
      setAlertDialog({
        open: true,
        type: 'danger',
        title: 'Assignment Failed',
        message: `Failed to assign shift: ${error.message}`
      });
    }
  };

  // Category CRUD methods
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({ name: category.name });
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = (category) => {
    setDeleteCategoryDialog({
      open: true,
      categoryId: category.id,
      categoryName: category.name
    });
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        setShiftCategories(prev => prev.map(cat => 
          cat.id === editingCategory.id ? { ...cat, name: categoryFormData.name } : cat
        ));
        setAlertDialog({
          open: true,
          type: 'success',
          title: 'Update Success',
          message: 'Category updated successfully'
        });
      } else {
        const newCategory = {
          id: `category_${Date.now()}`,
          name: categoryFormData.name
        };
        setShiftCategories(prev => [...prev, newCategory]);
        setAlertDialog({
          open: true,
          type: 'success',
          title: 'Create Success',
          message: 'Category created successfully'
        });
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryFormData({ name: '' });
    } catch (error) {
      setAlertDialog({
        open: true,
        type: 'danger',
        title: 'Save Failed',
        message: error.message
      });
    }
  };

  const confirmDeleteCategory = () => {
    setShiftCategories(prev => prev.filter(cat => cat.id !== deleteCategoryDialog.categoryId));
    setAlertDialog({
      open: true,
      type: 'success',
      title: 'Delete Success',
      message: 'Category deleted successfully'
    });
    setDeleteCategoryDialog({ open: false, categoryId: null, categoryName: '' });
  };

  const addBreakPeriod = () => {
    setShiftFormData(prev => ({
      ...prev,
      break_periods: [...prev.break_periods, { start_time: '', end_time: '' }]
    }));
  };

  const removeBreakPeriod = (index) => {
    setShiftFormData(prev => ({
      ...prev,
      break_periods: prev.break_periods.filter((_, i) => i !== index)
    }));
  };

  const updateBreakPeriod = (index, field, value) => {
    setShiftFormData(prev => ({
      ...prev,
      break_periods: prev.break_periods.map((period, i) => 
        i === index ? { ...period, [field]: value } : period
      )
    }));
  };

  const ShiftTemplateCard = ({ template }) => {
    const categoryName = shiftCategories.find(cat => cat.id === template.category)?.name || template.category;
    
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-medium">{template.name}</h3>
              {template.category && (
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded mt-1 inline-block">
                  {categoryName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => handleEditShift(template)}>
                <Edit className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDeleteShift(template)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {template.start_time} - {template.end_time}
              {template.is_cross_day && <span className="text-orange-600">(Cross Day)</span>}
            </div>
            <div className="flex items-center gap-4">
              {template.timezone && (
                <div>TZ: {template.timezone}</div>
              )}
            </div>
            {template.total_break_minutes && (
              <div>Break: {template.total_break_minutes} min</div>
            )}
            {template.break_periods && template.break_periods.length > 0 && (
              <div>
                Periods: {template.break_periods.map(b => `${b.start_time}-${b.end_time}`).join(', ')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Schedule Management</h1>
        <div className="flex gap-2">
          {activeTab === 'assignments' && (
            <Button 
              className="flex items-center gap-2"
              onClick={() => {
                setAssignmentFormData({ brand_id: '', workspace_id: '', member_id: '', template_id: '', date: '', break_schedule: [] });
                setWorkspaces([]);
                setWorkspaceMembers([]);
                setShowAssignmentModal(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Assign Shift
            </Button>
          )}
        </div>
      </div>

      {/* 衝突警告 */}
      {conflicts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">發現排班衝突</span>
            </div>
            <ul className="text-sm text-red-600 space-y-1">
              {conflicts.map(conflict => (
                <li key={conflict.id}>• {conflict.message}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 班別模板 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex border-b">
                <button
                  className={`px-4 py-2 text-sm font-medium ${activeTab === 'templates' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('templates')}
                >
                  Shift Templates
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${activeTab === 'categories' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('categories')}
                >
                  Categories
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${activeTab === 'assignments' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('assignments')}
                >
                  Shift Management
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === 'templates' ? (
                <div>
                  <Button 
                    className="w-full flex items-center gap-2 mb-4"
                    onClick={() => {
                      setEditingShift(null);
                      setShiftFormData({ name: '', category: '', start_time: '', end_time: '', is_cross_day: false, timezone: 'Asia/Taipei', total_break_minutes: 60, break_periods: [{ start_time: '12:00', end_time: '13:00' }] });
                      setShowShiftModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Shift Template
                  </Button>
                  {Array.isArray(shiftTemplates) && shiftTemplates.length > 0 ? (
                    shiftTemplates.map(template => (
                      <ShiftTemplateCard key={template.id} template={template} />
                    ))
                  ) : (
                    <EmptyState 
                      type="schedule" 
                      title="No Shift Templates" 
                      description="Click 'Add Shift Template' to create your first shift." 
                    />
                  )}
                </div>
              ) : activeTab === 'categories' ? (
                <div className="space-y-3">
                  <Button 
                    className="w-full flex items-center gap-2 mb-4"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryFormData({ name: '' });
                      setShowCategoryModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Category
                  </Button>
                  {shiftCategories.map(category => (
                    <Card key={category.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{category.name}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditCategory(category)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteCategory(category)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {shiftCategories.length === 0 && (
                    <EmptyState 
                      type="schedule" 
                      title="No Categories" 
                      description="Click 'Add Category' to create your first category." 
                    />
                  )}
                </div>
              ) : (
                <div>
                  <Button 
                    className="w-full flex items-center gap-2 mb-4"
                    onClick={() => {
                      setAssignmentFormData({ brand_id: '', workspace_id: '', member_id: '', template_id: '', date: '', break_schedule: [] });
                      setWorkspaces([]);
                      setWorkspaceMembers([]);
                      setShowAssignmentModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Assign Shift
                  </Button>
                  
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">Recent Assignments</h3>
                    {Array.isArray(events) && events.length > 0 ? (
                      events.slice(0, 5).map(event => (
                        <Card key={event.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{event.title}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(event.start).toLocaleDateString()} - {new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(event.start).toLocaleDateString() === new Date().toLocaleDateString() ? 'Today' : ''}
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <EmptyState 
                        type="schedule" 
                        title="No Assignments" 
                        description="No shift assignments found. Click 'Assign Shift' to create one." 
                      />
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 排班日曆 */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <SimpleCalendar
                events={events}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Shift Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Assign Shift</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Brand *</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={assignmentFormData.brand_id}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  required
                >
                  <option value="">Select Brand</option>
                  {brands.filter(brand => brand.is_active).map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Workspace *</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={assignmentFormData.workspace_id}
                  onChange={(e) => handleWorkspaceChange(e.target.value)}
                  required
                  disabled={!assignmentFormData.brand_id}
                >
                  <option value="">Select Workspace</option>
                  {workspaces.map(workspace => (
                    <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Member *</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={assignmentFormData.member_id}
                  onChange={(e) => setAssignmentFormData(prev => ({ ...prev, member_id: e.target.value }))}
                  required
                  disabled={!assignmentFormData.workspace_id}
                >
                  <option value="">Select Member</option>
                  {workspaceMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.name} ({member.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Shift Template *</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={assignmentFormData.template_id}
                  onChange={(e) => setAssignmentFormData(prev => ({ ...prev, template_id: e.target.value }))}
                  required
                >
                  <option value="">Select Template</option>
                  {shiftTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.start_time}-{template.end_time})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date *</label>
                <Input
                  type="date"
                  value={assignmentFormData.date}
                  onChange={(e) => setAssignmentFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAssignmentModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleAssignmentSubmit}
                >
                  Assign Shift
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Shift Template Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">
                {editingShift ? 'Edit Shift Template' : 'Add Shift Template'}
              </h3>
              <Button variant="outline" size="sm" onClick={() => setShowShiftModal(false)}>
                ×
              </Button>
            </div>
            <form onSubmit={handleShiftSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <Input
                  value={shiftFormData.name}
                  onChange={(e) => setShiftFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter shift name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={shiftFormData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  <option value="">Select Category</option>
                  {shiftCategories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Time *</label>
                  <Input
                    type="time"
                    value={shiftFormData.start_time}
                    onChange={(e) => setShiftFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    required
                    readOnly={!!shiftFormData.category}
                    className={shiftFormData.category ? 'bg-gray-100' : ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Time *</label>
                  <Input
                    type="time"
                    value={shiftFormData.end_time}
                    onChange={(e) => setShiftFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    required
                    readOnly={!!shiftFormData.category}
                    className={shiftFormData.category ? 'bg-gray-100' : ''}
                  />
                </div>
              </div>
              
              {shiftFormData.category && (
                <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                  ℹ️ Times are automatically set based on the selected category
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Timezone</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={shiftFormData.timezone}
                  onChange={(e) => setShiftFormData(prev => ({ ...prev, timezone: e.target.value }))}
                >
                  <option value="Asia/Taipei">Asia/Taipei (UTC+8)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                  <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
                  <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                  <option value="UTC">UTC (UTC+0)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Total Break Time (minutes)</label>
                <Input
                  type="number"
                  min="0"
                  value={shiftFormData.total_break_minutes}
                  onChange={(e) => setShiftFormData(prev => ({ ...prev, total_break_minutes: parseInt(e.target.value) || 0 }))}
                  readOnly={!!shiftFormData.category}
                  className={shiftFormData.category ? 'bg-gray-100' : ''}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Break Periods</label>
                  <Button type="button" size="sm" onClick={addBreakPeriod}>
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </div>
                {shiftFormData.break_periods.map((period, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <Input
                      type="time"
                      value={period.start_time}
                      onChange={(e) => updateBreakPeriod(index, 'start_time', e.target.value)}
                      placeholder="Start"
                    />
                    <span>-</span>
                    <Input
                      type="time"
                      value={period.end_time}
                      onChange={(e) => updateBreakPeriod(index, 'end_time', e.target.value)}
                      placeholder="End"
                    />
                    {shiftFormData.break_periods.length > 1 && (
                      <Button type="button" size="sm" variant="destructive" onClick={() => removeBreakPeriod(index)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Min Staff</label>
                  <Input
                    type="number"
                    min="1"
                    value={shiftFormData.min_staff}
                    onChange={(e) => setShiftFormData(prev => ({ ...prev, min_staff: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Staff</label>
                  <Input
                    type="number"
                    min="1"
                    value={shiftFormData.max_staff}
                    onChange={(e) => setShiftFormData(prev => ({ ...prev, max_staff: parseInt(e.target.value) || 5 }))}
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={shiftFormData.is_cross_day}
                    onChange={(e) => setShiftFormData(prev => ({ ...prev, is_cross_day: e.target.checked }))}
                    disabled={!!shiftFormData.category}
                  />
                  <span className={`text-sm ${shiftFormData.category ? 'text-gray-400' : ''}`}>Cross Day Shift</span>
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowShiftModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingShift ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h3>
              <Button variant="outline" size="sm" onClick={() => setShowCategoryModal(false)}>
                ×
              </Button>
            </div>
            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category Name *</label>
                <Input
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter category name"
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCategoryModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingCategory ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, shiftId: null, shiftName: '' })}
        onConfirm={confirmDeleteShift}
        type="danger"
        title="Delete Shift Template"
        message={`Are you sure you want to delete "${deleteDialog.shiftName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Delete Category Confirmation Dialog */}
      <ConfirmDialog
        open={deleteCategoryDialog.open}
        onClose={() => setDeleteCategoryDialog({ open: false, categoryId: null, categoryName: '' })}
        onConfirm={confirmDeleteCategory}
        type="danger"
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteCategoryDialog.categoryName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <AlertDialog
        open={alertDialog.open}
        onClose={() => setAlertDialog({ open: false, type: 'info', title: '', message: '' })}
        type={alertDialog.type}
        title={alertDialog.title}
        message={alertDialog.message}
      />
    </div>
  );
};

export default SchedulePage;