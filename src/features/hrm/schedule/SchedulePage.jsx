import React, { useState, useEffect } from 'react';
import FullCalendarComponent from '../../../components/calendar/FullCalendarComponent';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Clock, Users, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import apiClient from '../../../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog.jsx';
import EmptyState from '../../../components/ui/empty-state';
import SearchableSelect from '../../../components/ui/searchable-select';
import Modal from '../../../components/ui/modal';

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
    break_periods: [{ start_time: '', end_time: '' }]
  });
  const [assignmentFormData, setAssignmentFormData] = useState({
    brand_id: '',
    member_id: '',
    template_id: '',
    date: '',
    break_schedule: []
  });
  const [brands, setBrands] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [shiftCategories, setShiftCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '' });
  const [deleteCategoryDialog, setDeleteCategoryDialog] = useState({ open: false, categoryId: null, categoryName: '' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, shiftId: null, shiftName: '' });
  const [mainTab, setMainTab] = useState('main'); // 'setup' or 'main'
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [deleteAssignmentDialog, setDeleteAssignmentDialog] = useState({ open: false, assignmentId: null, assignmentTitle: '' });
  const [showPastAssignments, setShowPastAssignments] = useState(false);

  useEffect(() => {
    loadShiftCategories();
    loadScheduleData();
    loadBrands();
  }, []);

  const loadShiftCategories = async () => {
    try {
      const response = await apiClient.getShiftCategories();
      const categoriesData = response.data || response;
      setShiftCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Failed to load shift categories:', error);
      // Fallback to default categories if API fails
      setShiftCategories([
        { id: 'full_day', name: 'Full Day Shift' },
        { id: 'rotating', name: 'Rotating Shift' }
      ]);
    }
  };

  const loadScheduleData = async () => {
    try {
      const response = await apiClient.getShiftTemplates();
      
      // 直接使用 API 回應的資料
      let templatesData;
      if (response.success && response.data) {
        templatesData = response.data;
      } else if (Array.isArray(response)) {
        templatesData = response;
      } else {
        templatesData = response.data || response || [];
      }
      
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
          break_periods: Array.isArray(template.break_periods) && template.break_periods.length > 0 
            ? template.break_periods 
            : [{ start_time: '', end_time: '' }],
          min_staff: template.min_staff || 1,
          max_staff: template.max_staff || 5
        };
        return formatted;
      });
      
      // 確保至少有資料可以顯示
      if (formattedTemplates.length === 0) {
        console.warn('No templates received from API');
      }
      
      setShiftTemplates(formattedTemplates);

      const scheduleResponse = await apiClient.getScheduleAssignments();
      const scheduleData = scheduleResponse.data || scheduleResponse;
      const rawAssignments = Array.isArray(scheduleData) ? scheduleData : [];
      
      // 為每個成員分配顏色
      const memberColors = {};
      const colors = [
        { bg: '#ef4444', border: '#dc2626' }, // red
        { bg: '#3b82f6', border: '#2563eb' }, // blue
        { bg: '#10b981', border: '#059669' }, // green
        { bg: '#f59e0b', border: '#d97706' }, // yellow
        { bg: '#8b5cf6', border: '#7c3aed' }, // purple
        { bg: '#06b6d4', border: '#0891b2' }, // cyan
        { bg: '#ec4899', border: '#db2777' }, // pink
        { bg: '#84cc16', border: '#65a30d' }, // lime
        { bg: '#f97316', border: '#ea580c' }, // orange
        { bg: '#6366f1', border: '#4f46e5' }  // indigo
      ];
      
      let colorIndex = 0;
      rawAssignments.forEach(assignment => {
        if (!memberColors[assignment.member_id]) {
          memberColors[assignment.member_id] = colors[colorIndex % colors.length];
          colorIndex++;
        }
      });

      // 轉換 API 資料為 FullCalendar 格式
      const formattedEvents = await Promise.all(rawAssignments.map(async (assignment) => {
        // 使用 JOIN 查詢返回的 shift_template 資訊，或從本地模板查找
        let template = assignment.shift_template || formattedTemplates.find(t => t.id === assignment.shift_template_id);
        
        if (!template) {
          console.warn('Template not found for assignment:', assignment, 'Available templates:', formattedTemplates.map(t => t.id));
          // 創建一個默認的 template 以避免丟失 assignment
          template = {
            id: assignment.shift_template_id,
            name: `Unknown Template (${assignment.shift_template_id})`,
            start_time: '09:00',
            end_time: '18:00',
            category: 'unknown',
            is_cross_day: false,
            timezone: 'Asia/Taipei',
            total_break_minutes: 60
          };
        }
        
        // 組合日期和時間，確保格式正確
        const assignmentDate = assignment.date;
        const startTime = template.start_time || '09:00';
        const endTime = template.end_time || '18:00';
        
        // 驗證日期格式
        if (!assignmentDate) {
          console.warn('Missing date data for assignment:', assignment);
          return null;
        }
        
        // 處理跨日班次
        let startDateTime, endDateTime;
        if (template.is_cross_day && startTime > endTime) {
          // 跨日班次：開始時間在當天，結束時間在隔天
          startDateTime = `${assignmentDate}T${startTime}:00`;
          const nextDay = new Date(assignmentDate);
          nextDay.setDate(nextDay.getDate() + 1);
          const nextDayStr = nextDay.toISOString().split('T')[0];
          endDateTime = `${nextDayStr}T${endTime}:00`;
        } else {
          // 一般班次：同一天
          startDateTime = `${assignmentDate}T${startTime}:00`;
          endDateTime = `${assignmentDate}T${endTime}:00`;
        }
        
        // 驗證生成的日期時間是否有效
        const startDate = new Date(startDateTime);
        const endDate = new Date(endDateTime);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.warn('Invalid date/time generated:', { startDateTime, endDateTime, assignment });
          return null;
        }
        
        const memberName = assignment.member_name || `Member ${assignment.member_id.substring(0, 8)}`;
        const memberColor = memberColors[assignment.member_id];
        
        const event = {
          id: assignment.id,
          title: `${memberName}\n${template.name} (${startTime}-${endTime})`,
          start: startDateTime,
          end: endDateTime,
          backgroundColor: memberColor.bg,
          borderColor: memberColor.border,
          textColor: '#ffffff',
          extendedProps: {
            memberId: assignment.member_id,
            memberName: memberName,
            templateId: assignment.shift_template_id,
            templateName: template.name,
            assignmentDate: assignment.date,
            createdAt: assignment.created_at,
            startTime: startTime,
            endTime: endTime
          }
        };
        
        return event;
      }));
      
      // 過濾空值
      const validEvents = formattedEvents.filter(event => event !== null);
      
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

  const loadBrandMembers = async (brandId) => {
    if (!brandId) {
      setWorkspaceMembers([]);
      return;
    }
    try {
      const response = await apiClient.getBrandMembers(brandId);
      const membersData = response.data || response;
      setWorkspaceMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error('Failed to load brand members:', error);
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
    const props = event.extendedProps;
    
    alert(`Shift Details:
Member: ${props.memberName || 'Unknown'}
Shift: ${props.templateName || 'Unknown'}
Date: ${props.assignmentDate || 'Unknown'}
Time: ${new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(event.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`);
  };

  const handleEditShift = (template) => {
    setEditingShift(template);
    setShiftFormData({
      name: template.name || '',
      category: template.category || '',
      start_time: template.start_time || '',
      end_time: template.end_time || '',
      is_cross_day: template.is_cross_day || false,
      timezone: template.timezone || 'Asia/Taipei',
      total_break_minutes: template.total_break_minutes || 60,
      break_periods: Array.isArray(template.break_periods) && template.break_periods.length > 0 
        ? template.break_periods 
        : [{ start_time: '', end_time: '' }],
      min_staff: template.min_staff || 1,
      max_staff: template.max_staff || 5
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
      setShiftFormData({ name: '', category: '', start_time: '', end_time: '', is_cross_day: false, timezone: 'Asia/Taipei', total_break_minutes: 60, break_periods: [{ start_time: '', end_time: '' }] });
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

  // Handle brand selection to load members
  const handleBrandChange = (brandId) => {
    setAssignmentFormData(prev => ({ ...prev, brand_id: brandId, member_id: '' }));
    loadBrandMembers(brandId);
  };

  // Handle assignment edit
  const handleEditAssignment = (event) => {
    setEditingAssignment(event);
    setAssignmentFormData({
      brand_id: '',
      member_id: event.extendedProps.memberId,
      template_id: event.extendedProps.templateId,
      date: event.extendedProps.assignmentDate,
      break_schedule: []
    });
    setShowAssignmentModal(true);
  };

  // Handle assignment delete
  const handleDeleteAssignment = (event) => {
    setDeleteAssignmentDialog({
      open: true,
      assignmentId: event.id,
      assignmentTitle: event.title
    });
  };

  // Confirm delete assignment
  const confirmDeleteAssignment = async () => {
    try {
      await apiClient.deleteScheduleAssignment(deleteAssignmentDialog.assignmentId);
      setAlertDialog({
        open: true,
        type: 'success',
        title: 'Delete Success',
        message: 'Assignment deleted successfully'
      });
      await loadScheduleData();
    } catch (error) {
      setAlertDialog({
        open: true,
        type: 'danger',
        title: 'Delete Failed',
        message: `Failed to delete assignment: ${error.message}`
      });
    }
    setDeleteAssignmentDialog({ open: false, assignmentId: null, assignmentTitle: '' });
  };

  // Handle shift assignment submission
  const handleAssignmentSubmit = async () => {
    // Validate required fields
    if (!assignmentFormData.brand_id || !assignmentFormData.member_id || !assignmentFormData.template_id || !assignmentFormData.date) {
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
      
      if (editingAssignment) {
        const response = await apiClient.updateScheduleAssignment(editingAssignment.id, requestData);
        setAlertDialog({
          open: true,
          type: 'success',
          title: 'Update Success',
          message: 'Assignment updated successfully'
        });
      } else {
        const response = await apiClient.createScheduleAssignment(requestData);
        setAlertDialog({
          open: true,
          type: 'success',
          title: 'Assignment Success',
          message: 'Shift assigned successfully'
        });
      }
      
      setShowAssignmentModal(false);
      setEditingAssignment(null);
      setAssignmentFormData({ brand_id: '', member_id: '', template_id: '', date: '', break_schedule: [] });
      setWorkspaceMembers([]);
      
      // Reload schedule data to show new assignment
      await loadScheduleData();
    } catch (error) {
      setAlertDialog({
        open: true,
        type: 'danger',
        title: editingAssignment ? 'Update Failed' : 'Assignment Failed',
        message: `Failed to ${editingAssignment ? 'update' : 'assign'} shift: ${error.message}`
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
        await apiClient.updateShiftCategory(editingCategory.id, categoryFormData);
        setAlertDialog({
          open: true,
          type: 'success',
          title: 'Update Success',
          message: 'Category updated successfully'
        });
      } else {
        await apiClient.createShiftCategory(categoryFormData);
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
      // Reload categories after successful operation
      await loadShiftCategories();
    } catch (error) {
      setAlertDialog({
        open: true,
        type: 'danger',
        title: 'Save Failed',
        message: error.message
      });
    }
  };

  const confirmDeleteCategory = async () => {
    try {
      await apiClient.deleteShiftCategory(deleteCategoryDialog.categoryId);
      setAlertDialog({
        open: true,
        type: 'success',
        title: 'Delete Success',
        message: 'Category deleted successfully'
      });
      // Reload categories after successful deletion
      await loadShiftCategories();
    } catch (error) {
      setAlertDialog({
        open: true,
        type: 'danger',
        title: 'Delete Failed',
        message: `Failed to delete category: ${error.message}`
      });
    }
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

  const ShiftTemplatesTable = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Category</th>
              <th className="text-left p-3 font-medium">Time</th>
              <th className="text-left p-3 font-medium">Break</th>
              <th className="text-left p-3 font-medium">Staff</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shiftTemplates.map(template => {
              const categoryName = shiftCategories.find(cat => cat.id === template.category)?.name || template.category || 'Unknown Category';
              console.log('Template:', template.name, 'Category ID:', template.category, 'Resolved Name:', categoryName);
              return (
                <tr key={template.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium">{template.name || 'Unnamed Shift'}</div>
                    {template.is_cross_day && <span className="text-xs text-orange-600">(Cross Day)</span>}
                  </td>
                  <td className="p-3">
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                      {categoryName}
                    </span>
                  </td>
                  <td className="p-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {template.start_time || 'N/A'} - {template.end_time || 'N/A'}
                    </div>
                  </td>
                  <td className="p-3 text-sm">{template.total_break_minutes || 0} min</td>
                  <td className="p-3 text-sm">{template.min_staff || 1}-{template.max_staff || 5}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="sm" variant="outline" onClick={() => handleEditShift(template)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteShift(template)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {shiftTemplates.length === 0 && (
          <div className="p-8">
            <EmptyState 
              type="schedule" 
              title="No Shift Templates" 
              description="Click 'Add Template' to create your first shift." 
            />
          </div>
        )}
      </div>
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
                        setShiftFormData({ name: '', category: '', start_time: '', end_time: '', is_cross_day: false, timezone: 'Asia/Taipei', total_break_minutes: 60, break_periods: [{ start_time: '', end_time: '' }] });
                        setShowShiftModal(true);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Add Template
                    </Button>
                    <ShiftTemplatesTable />
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
                        setEditingAssignment(null);
                        setAssignmentFormData({ brand_id: '', member_id: '', template_id: '', date: '', break_schedule: [] });
                        setWorkspaceMembers([]);
                        setShowAssignmentModal(true);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Assign Shift
                    </Button>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-700">Recent Assignments</h3>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setShowPastAssignments(!showPastAssignments)}
                          className="text-xs"
                        >
                          {showPastAssignments ? 'Hide Past' : 'Show Past'}
                        </Button>
                      </div>
                      {Array.isArray(events) && events.length > 0 ? (
                        (() => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          
                          const filteredEvents = showPastAssignments 
                            ? events 
                            : events.filter(event => {
                                const eventDate = new Date(event.start);
                                eventDate.setHours(0, 0, 0, 0);
                                return eventDate >= today;
                              });
                          
                          return filteredEvents.slice(0, 5).map(event => {
                            const eventDate = new Date(event.start);
                            eventDate.setHours(0, 0, 0, 0);
                            const isPast = eventDate < today;
                            
                            return (
                              <Card key={event.id} className={`p-3 ${isPast ? 'opacity-60 bg-gray-50' : ''}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className={`font-medium text-sm ${isPast ? 'text-gray-500' : ''}`}>
                                      {event.title}
                                      {isPast && <span className="ml-2 text-xs text-gray-400">(Past)</span>}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {event.start && !isNaN(new Date(event.start)) ? (
                                        `${new Date(event.start).toLocaleDateString()} - ${new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                                      ) : (
                                        event.extendedProps?.assignmentDate || 'No Date'
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button size="sm" variant="outline" onClick={() => handleEditAssignment(event)}>
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDeleteAssignment(event)}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            );
                          });
                        })()
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
      <Modal
        open={showAssignmentModal}
        onOpenChange={setShowAssignmentModal}
        title={editingAssignment ? 'Edit Assignment' : 'Assign Shift'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAssignmentModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignmentSubmit}>
              {editingAssignment ? 'Update Assignment' : 'Assign Shift'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
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
                <label className="block text-sm font-medium mb-2">Member *</label>
                <SearchableSelect
                  value={assignmentFormData.member_id}
                  onChange={(value) => setAssignmentFormData(prev => ({ ...prev, member_id: value }))}
                  placeholder="Select Member"
                  searchPlaceholder="Search members..."
                  disabled={!assignmentFormData.brand_id}
                  options={workspaceMembers.map(member => ({
                    value: member.id,
                    label: `${member.name || member.username || member.email || member.id} (${member.role || 'Member'})`
                  }))}
                />
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

        </div>
      </Modal>

      {/* Shift Template Modal */}
      <Modal
        open={showShiftModal}
        onOpenChange={setShowShiftModal}
        title={editingShift ? 'Edit Shift Template' : 'Add Shift Template'}
        size="md"
        className="max-h-[80vh]"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setShowShiftModal(false)}>
              Cancel
            </Button>
            <Button type="submit" form="shift-form">
              {editingShift ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="shift-form" onSubmit={handleShiftSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto">
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Time *</label>
                  <Input
                    type="time"
                    value={shiftFormData.end_time}
                    onChange={(e) => setShiftFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    required
                  />
                </div>
              </div>
              


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

                  />
                  <span className="text-sm">Cross Day Shift</span>
                </label>
              </div>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal
        open={showCategoryModal}
        onOpenChange={setShowCategoryModal}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        size="md"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setShowCategoryModal(false)}>
              Cancel
            </Button>
            <Button type="submit" form="category-form">
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category Name *</label>
                <Input
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter category name"
                  required
                />
              </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, shiftId: null, shiftName: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shift Template</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete "{deleteDialog.shiftName}"? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, shiftId: null, shiftName: '' })}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteShift}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <Dialog open={deleteCategoryDialog.open} onOpenChange={(open) => !open && setDeleteCategoryDialog({ open: false, categoryId: null, categoryName: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete "{deleteCategoryDialog.categoryName}"? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCategoryDialog({ open: false, categoryId: null, categoryName: '' })}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteCategory}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Assignment Confirmation Dialog */}
      <Dialog open={deleteAssignmentDialog.open} onOpenChange={(open) => !open && setDeleteAssignmentDialog({ open: false, assignmentId: null, assignmentTitle: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete "{deleteAssignmentDialog.assignmentTitle}"? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAssignmentDialog({ open: false, assignmentId: null, assignmentTitle: '' })}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteAssignment}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={alertDialog.open} onOpenChange={(open) => !open && setAlertDialog({ open: false, type: 'info', title: '', message: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{alertDialog.title}</DialogTitle>
          </DialogHeader>
          <p>{alertDialog.message}</p>
          <DialogFooter>
            <Button onClick={() => setAlertDialog({ open: false, type: 'info', title: '', message: '' })}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchedulePage;