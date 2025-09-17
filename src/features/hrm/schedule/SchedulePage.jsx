import React, { useState, useEffect } from 'react';
import FullCalendarComponent from '../../../components/calendar/FullCalendarComponent';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [mainTab, setMainTab] = useState('main'); // 'setup' or 'main'
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  useEffect(() => {
    loadScheduleData();
    loadBrands();
  }, []);

  const loadScheduleData = async () => {
    try {
      const response = await apiClient.getShiftTemplates();
      console.log('Shift Templates API response:', response);
      
      // 直接使用 API 回應的資料
      let templatesData;
      if (response.success && response.data) {
        templatesData = response.data;
      } else if (Array.isArray(response)) {
        templatesData = response;
      } else {
        templatesData = response.data || response || [];
      }
      
      console.log('Templates data:', templatesData);
      
      if (!Array.isArray(templatesData)) {
        console.error('Templates data is not an array:', templatesData);
        setShiftTemplates([]);
        return;
      }
      
      // 轉換 API 資料為前端需要的格式
      const formattedTemplates = templatesData.map(template => {
        const formatted = {
          id: template.id,
          name: template.name?.trim() || 'Unnamed Shift',
          start_time: template.start_time,
          end_time: template.end_time,
          category: template.category || 'full_day',
          is_cross_day: template.is_cross_day || false,
          timezone: template.timezone || 'Asia/Taipei',
          total_break_minutes: template.total_break_minutes || 60,
          break_periods: template.break_periods || [{ start_time: '12:00', end_time: '13:00' }],
          min_staff: template.min_staff || 1,
          max_staff: template.max_staff || 5
        };
        console.log('Formatted template:', formatted);
        return formatted;
      });
      
      console.log('All formatted shift templates:', formattedTemplates);
      
      // 確保至少有資料可以顯示
      if (formattedTemplates.length === 0) {
        console.warn('No templates received from API');
      }
      
      setShiftTemplates(formattedTemplates);
      
      // 強制觸發重新渲染
      setTimeout(() => {
        console.log('Current shiftTemplates state:', formattedTemplates);
      }, 100);

      const scheduleResponse = await apiClient.getScheduleAssignments();
      const scheduleData = scheduleResponse.data || scheduleResponse;
      const rawAssignments = Array.isArray(scheduleData) ? scheduleData : [];
      
      console.log('Schedule Assignments API response:', scheduleData);
      console.log('Raw assignments array:', rawAssignments);
      
      // 轉換 API 資料為 FullCalendar 格式
      const formattedEvents = await Promise.all(rawAssignments.map(async (assignment) => {
        // 找到對應的 shift template
        const template = formattedTemplates.find(t => t.id === assignment.shift_template_id);
        
        if (!template) {
          console.warn('Template not found for assignment:', assignment);
          return null;
        }
        
        // 組合日期和時間
        const startDateTime = `${assignment.date}T${template.start_time}:00`;
        const endDateTime = `${assignment.date}T${template.end_time}:00`;
        
        const event = {
          id: assignment.id,
          title: `${template.name} - Member ${assignment.member_id.substring(0, 8)}`,
          start: startDateTime,
          end: endDateTime,
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          extendedProps: {
            memberId: assignment.member_id,
            templateId: assignment.shift_template_id,
            templateName: template.name,
            assignmentDate: assignment.date,
            createdAt: assignment.created_at
          }
        };
        
        return event;
      }));
      
      // 過濾空值
      const validEvents = formattedEvents.filter(event => event !== null);
      
      console.log('Formatted events for calendar:', validEvents);
      setEvents(validEvents);

      checkConflicts(validEvents);
    } catch (error) {
      console.error('Failed to load schedule data:', error);
      setShiftTemplates([]);
      setEvents([]);
    }
  };

  const loadBrands = async () => {
    try {
      const response = await apiClient.getBrands();
      const brandsData = response.data || response;
      setBrands(Array.isArray(brandsData) ? brandsData : []);
    } catch (error) {
      console.error('Failed to load brands:', error);
      setBrands([]);
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
      setWorkspaces([]);
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
      setWorkspaceMembers([]);
    }
  };

  const checkConflicts = (scheduleEvents) => {
    const conflicts = [];
    
    for (let i = 0; i < scheduleEvents.length; i++) {
      for (let j = i + 1; j < scheduleEvents.length; j++) {
        const event1 = scheduleEvents[i];
        const event2 = scheduleEvents[j];
        
        // 安全檢查 extendedProps 和 memberId
        const memberId1 = event1.extendedProps?.memberId;
        const memberId2 = event2.extendedProps?.memberId;
        
        // 檢查同一成員的時間重疊
        if (memberId1 && memberId2 && memberId1 === memberId2) {
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
    console.log('Form data before validation:', assignmentFormData);
    
    // Validate required fields
    if (!assignmentFormData.brand_id || !assignmentFormData.workspace_id || !assignmentFormData.member_id || !assignmentFormData.template_id || !assignmentFormData.date) {
      console.log('Validation failed:', {
        brand_id: assignmentFormData.brand_id,
        workspace_id: assignmentFormData.workspace_id,
        member_id: assignmentFormData.member_id,
        template_id: assignmentFormData.template_id,
        date: assignmentFormData.date
      });
      setAlertDialog({
        open: true,
        type: 'warning',
        title: 'Validation Error',
        message: 'Please fill in all required fields.'
      });
      return;
    }

    try {
      // 轉換為後端需要的格式 (使用新的 member_id 欄位)
      const requestData = {
        member_id: assignmentFormData.member_id,
        shift_template_id: assignmentFormData.template_id,
        date: assignmentFormData.date
      };
      
      console.log('Final request data:', requestData);
      console.log('Request data types:', {
        member_id: typeof requestData.member_id,
        shift_template_id: typeof requestData.shift_template_id,
        date: typeof requestData.date
      });
      
      const response = await apiClient.createScheduleAssignment(requestData);
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
    console.log('Rendering template card:', template);
    
    if (!template) {
      console.error('Template is null or undefined');
      return null;
    }
    
    const categoryName = shiftCategories.find(cat => cat.id === template.category)?.name || template.category || 'No Category';
    
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-medium">{template.name || 'Unnamed Shift'}</h3>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded mt-1 inline-block">
                {categoryName}
              </span>
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
              {template.start_time || 'N/A'} - {template.end_time || 'N/A'}
              {template.is_cross_day && <span className="text-orange-600">(Cross Day)</span>}
            </div>
            <div className="flex items-center gap-4">
              <div>TZ: {template.timezone || 'Asia/Taipei'}</div>
            </div>
            <div>Break: {template.total_break_minutes || 0} min</div>
            {template.break_periods && template.break_periods.length > 0 && (
              <div>
                Periods: {template.break_periods.map(b => `${b.start_time || 'N/A'}-${b.end_time || 'N/A'}`).join(', ')}
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
          {/* Removed activeTab condition since we're using mainTab now */}
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

      <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="main">Main</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <div className="grid grid-cols-10 gap-4">
            {/* Categories - 30% */}
            <div className="col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      className="w-full flex items-center gap-2"
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
                          <span className="font-medium text-sm">{category.name}</span>
                          <div className="flex gap-1">
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
                </CardContent>
              </Card>
            </div>

            {/* Shift Templates - 70% */}
            <div className="col-span-7">
              <Card>
                <CardHeader>
                  <CardTitle>Shift Templates</CardTitle>
                </CardHeader>
                <CardContent>
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
                      Add Template
                    </Button>
                    <div>
                      {shiftTemplates.length > 0 ? (
                        shiftTemplates.map(template => {
                          return <ShiftTemplateCard key={template.id} template={template} />;
                        })
                      ) : (
                        <EmptyState 
                          type="schedule" 
                          title="No Shift Templates" 
                          description="Click 'Add Template' to create your first shift." 
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="main" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Shift Management Widget */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Shift Management</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            </div>

            {/* Calendar Widget */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Schedule Calendar</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <FullCalendarComponent
                    events={events}
                    onDateClick={handleDateClick}
                    onEventClick={handleEventClick}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

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