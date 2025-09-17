import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog.jsx';
import { Search, Plus, Edit, History, Trash2, Upload } from 'lucide-react';
import BatchImportModal from './BatchImportModal.jsx';
import apiClient from '../../../../services/api.js';

const EmployeeSalary = () => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showBatchImportModal, setShowBatchImportModal] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedEmployeeHistory, setSelectedEmployeeHistory] = useState(null);
  const [batchFormData, setBatchFormData] = useState({
    salary_grade_id: '',
    effective_date: new Date().toISOString().split('T')[0]
  });
  const [formData, setFormData] = useState({
    member_name: '',
    member_email: '',
    salary_grade_id: '',
    effective_date: new Date().toISOString().split('T')[0]
  });

  const [salaryGrades, setSalaryGrades] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [salaryHistory, setSalaryHistory] = useState({});

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSalaryGrades(),
        loadEmployees()
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSalaryGrades = async () => {
    try {
      const response = await apiClient.getSalaryGrades();
      setSalaryGrades(response.data || []);
    } catch (error) {
      console.error('Failed to load salary grades:', error);
      // Fallback to mock data
      setSalaryGrades([
        { id: '1', grade_name: '初級員工', base_salary: 30000 },
        { id: '2', grade_name: '資深員工', base_salary: 45000 },
        { id: '3', grade_name: '主管', base_salary: 60000 }
      ]);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await apiClient.getEmployeeSalaries();
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Failed to load employees:', error);
      // Fallback to empty array for fresh start
      setEmployees([]);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.member_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setEditingEmployee(null);
    setFormData({
      member_name: '',
      member_email: '',
      salary_grade_id: '',
      effective_date: new Date().toISOString().split('T')[0]
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      member_name: employee.member_name,
      member_email: employee.member_email,
      salary_grade_id: employee.salary_grade.id || '',
      effective_date: employee.effective_date
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const selectedGrade = salaryGrades.find(g => g.id === formData.salary_grade_id);
      const employeeData = {
        member_name: formData.member_name,
        member_email: formData.member_email,
        salary_grade_id: formData.salary_grade_id,
        effective_date: formData.effective_date
      };

      if (editingEmployee) {
        await apiClient.updateEmployeeSalary(editingEmployee.id, employeeData);
      } else {
        await apiClient.request('/api/v1/salary/employees', {
          method: 'POST',
          body: employeeData
        });
      }
      
      // Reload employees after save
      await loadEmployees();
      setIsDialogOpen(false);
      alert(editingEmployee ? t('messages.updateSuccess') : t('messages.addSuccess'));
    } catch (error) {
      console.error('Failed to save employee:', error);
      alert('保存失敗: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('確定要刪除此員工薪資設定嗎？')) {
      try {
        await apiClient.deleteEmployeeSalary(id);
        await loadEmployees();
        alert(t('messages.deleteSuccess'));
      } catch (error) {
        console.error('Failed to delete employee:', error);
        alert('刪除失敗: ' + error.message);
      }
    }
  };

  const toggleStatus = (id) => {
    setEmployees(employees.map(e => e.id === id ? { ...e, is_active: !e.is_active } : e));
  };

  const handleSelectEmployee = (employeeId) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(e => e.id));
    }
  };

  const handleBatchSave = async () => {
    if (selectedEmployees.length === 0) {
      alert('請選擇要設定的員工');
      return;
    }
    if (!batchFormData.salary_grade_id) {
      alert('請選擇薪資等級');
      return;
    }

    try {
      const updateData = {
        salary_grade_id: batchFormData.salary_grade_id,
        effective_date: batchFormData.effective_date
      };

      // Update each selected employee
      await Promise.all(selectedEmployees.map(id => 
        apiClient.updateEmployeeSalary(id, updateData)
      ));

      await loadEmployees();
      setSelectedEmployees([]);
      setShowBatchDialog(false);
      setBatchFormData({
        salary_grade_id: '',
        effective_date: new Date().toISOString().split('T')[0]
      });
      alert(`已成功為 ${selectedEmployees.length} 位員工設定薪資等級`);
    } catch (error) {
      console.error('Failed to batch update employees:', error);
      alert('批量更新失敗: ' + error.message);
    }
  };

  const handleViewHistory = async (employee) => {
    try {
      const response = await apiClient.getEmployeeSalaryHistory(employee.id);
      setSalaryHistory(prev => ({
        ...prev,
        [employee.id]: response.data || []
      }));
      setSelectedEmployeeHistory(employee);
      setShowHistoryDialog(true);
    } catch (error) {
      console.error('Failed to load salary history:', error);
      // Show dialog anyway with empty history
      setSelectedEmployeeHistory(employee);
      setShowHistoryDialog(true);
    }
  };

  const getEmployeeHistory = (employeeId) => {
    return salaryHistory[employeeId] || [];
  };

  const handleBatchDelete = async () => {
    if (selectedEmployees.length === 0) {
      alert(t('salary.pleaseSelectEmployees'));
      return;
    }
    
    if (confirm(`${t('salary.confirmDeleteEmployees')} ${selectedEmployees.length} ${t('salary.employees')}?`)) {
      try {
        // Delete each selected employee
        await Promise.all(selectedEmployees.map(id => apiClient.deleteEmployeeSalary(id)));
        await loadEmployees();
        setSelectedEmployees([]);
        alert(`${t('salary.successfullyDeleted')} ${selectedEmployees.length} ${t('salary.employees')}`);
      } catch (error) {
        console.error('Failed to batch delete employees:', error);
        alert('批量刪除失敗: ' + error.message);
      }
    }
  };

  const handleBatchImport = async (importData) => {
    try {
      // Create each employee salary setting
      await Promise.all(importData.map(data => 
        apiClient.request('/api/v1/salary/employees', {
          method: 'POST',
          body: {
            member_name: data.member_name,
            member_email: data.member_email,
            salary_grade_id: data.salary_grade_id,
            effective_date: data.effective_date
          }
        })
      ));
      
      await loadEmployees();
      alert(`${t('salary.successfullyImported')} ${importData.length} ${t('salary.employees')}`);
    } catch (error) {
      console.error('Failed to batch import employees:', error);
      alert('批量匯入失敗: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{t('salary.employees')}</h2>
          <p className="text-gray-600">{t('salary.employeesDescription')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowBatchImportModal(true)} variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {t('salary.batchImport')}
          </Button>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('common.add')}
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t('salary.searchEmployees')}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {selectedEmployees.length > 0 && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowBatchDialog(true)}
            >
              {t('salary.batchEdit')} ({selectedEmployees.length})
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBatchDelete}
            >
              {t('common.delete')} ({selectedEmployees.length})
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">{t('common.loading')}</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-900">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                      onChange={handleSelectAll}
                      className="mr-2"
                    />
                    {t('salary.employeeInfo')}
                  </th>
                  <th className="text-left p-4 font-medium text-gray-900">{t('salary.grades')}</th>
                  <th className="text-left p-4 font-medium text-gray-900">{t('salary.baseSalary')}</th>
                  <th className="text-left p-4 font-medium text-gray-900">{t('salary.effectiveDate')}</th>
                  <th className="text-left p-4 font-medium text-gray-900">{t('common.status')}</th>
                  <th className="text-left p-4 font-medium text-gray-900">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className={`border-b hover:bg-gray-50 ${selectedEmployees.includes(employee.id) ? 'bg-blue-50' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(employee.id)}
                          onChange={() => handleSelectEmployee(employee.id)}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{employee.member_name}</div>
                          <div className="text-sm text-gray-500">{employee.member_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{employee.salary_grade?.grade_name || 'N/A'}</Badge>
                    </td>
                    <td className="p-4">
                      <span className="font-medium">${employee.salary_grade?.base_salary?.toLocaleString() || '0'}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{employee.effective_date}</span>
                    </td>
                    <td className="p-4">
                      <Badge 
                        variant={employee.is_active ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => toggleStatus(employee.id)}
                      >
                        {employee.is_active ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button onClick={() => handleEdit(employee)} variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleViewHistory(employee)} variant="ghost" size="sm">
                          <History className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleDelete(employee.id)} variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? t('salary.editEmployee') : t('salary.addEmployee')}</DialogTitle>
            <DialogDescription>
              {editingEmployee ? t('salary.editEmployeeDesc') : t('salary.addEmployeeDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">員工姓名</label>
              <Input
                value={formData.member_name}
                onChange={(e) => setFormData({...formData, member_name: e.target.value})}
                placeholder="輸入員工姓名"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">員工信箱</label>
              <Input
                type="email"
                value={formData.member_email}
                onChange={(e) => setFormData({...formData, member_email: e.target.value})}
                placeholder="輸入員工信箱"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">薪資等級</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={formData.salary_grade_id}
                onChange={(e) => setFormData({...formData, salary_grade_id: e.target.value})}
              >
                <option value="">請選擇薪資等級</option>
                {salaryGrades.map(grade => (
                  <option key={grade.id} value={grade.id}>
                    {grade.grade_name} - ${grade.base_salary.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">生效日期</label>
              <Input
                type="date"
                value={formData.effective_date}
                onChange={(e) => setFormData({...formData, effective_date: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>批量設定薪資等級</DialogTitle>
            <DialogDescription>
              為多位已選擇的員工設定相同的薪資等級和生效日期
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-3">
                已選擇 {selectedEmployees.length} 位員工，將為他們設定相同的薪資等級。
              </p>
              <div className="bg-gray-50 p-3 rounded-md max-h-32 overflow-y-auto">
                {selectedEmployees.map(id => {
                  const emp = employees.find(e => e.id === id);
                  return (
                    <div key={id} className="text-sm py-1">
                      {emp?.member_name} ({emp?.member_email})
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">薪資等級 *</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={batchFormData.salary_grade_id}
                onChange={(e) => setBatchFormData({...batchFormData, salary_grade_id: e.target.value})}
              >
                <option value="">請選擇薪資等級</option>
                {salaryGrades.map(grade => (
                  <option key={grade.id} value={grade.id}>
                    {grade.grade_name} - ${grade.base_salary.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">生效日期 *</label>
              <Input
                type="date"
                value={batchFormData.effective_date}
                onChange={(e) => setBatchFormData({...batchFormData, effective_date: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDialog(false)}>取消</Button>
            <Button onClick={handleBatchSave}>確認設定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>薪資歷史記錄 - {selectedEmployeeHistory?.member_name}</DialogTitle>
            <DialogDescription>
              查看該員工的薪資變更歷史記錄和相關資訊
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedEmployeeHistory && (
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm text-gray-600">員工信箱：{selectedEmployeeHistory.member_email}</div>
                <div className="text-sm text-gray-600">目前薪資等級：{selectedEmployeeHistory.salary_grade?.grade_name}</div>
                <div className="text-sm text-gray-600">目前基本薪資：${selectedEmployeeHistory.salary_grade?.base_salary?.toLocaleString()}</div>
              </div>
            )}
            <div className="max-h-96 overflow-y-auto">
              {selectedEmployeeHistory && getEmployeeHistory(selectedEmployeeHistory.id).length > 0 ? (
                <div className="space-y-3">
                  {getEmployeeHistory(selectedEmployeeHistory.id).map((record, index) => (
                    <div key={record.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-gray-900">
                          {record.change_date}
                        </div>
                        <div className="text-sm text-gray-500">
                          操作人：{record.changed_by}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">薪資等級：</span>
                          {record.from_grade ? (
                            <>
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                                {record.from_grade}
                              </span>
                              <span className="text-gray-400">→</span>
                            </>
                          ) : null}
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            {record.to_grade}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">基本薪資：</span>
                          {record.from_salary ? (
                            <>
                              <span className="text-red-600">
                                ${record.from_salary.toLocaleString()}
                              </span>
                              <span className="text-gray-400">→</span>
                            </>
                          ) : null}
                          <span className="text-green-600 font-medium">
                            ${record.to_salary.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">變更原因：</span>
                          <span className="text-gray-900">{record.reason}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  無薪資變更記錄
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowHistoryDialog(false)}>關閉</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BatchImportModal
        isOpen={showBatchImportModal}
        onClose={() => setShowBatchImportModal(false)}
        onImport={handleBatchImport}
        salaryGrades={salaryGrades}
      />
    </div>
  );
};

export default EmployeeSalary;