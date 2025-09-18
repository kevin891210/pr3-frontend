import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog.jsx';
import { Plus, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { apiClient } from '@/services/api.js';

const SalaryGrades = () => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [formData, setFormData] = useState({
    grade_name: '',
    grade_level: 1,
    base_salary: 0,
    overtime_rate_weekday: 1.34,
    overtime_rate_weekend: 1.67,
    overtime_rate_holiday: 2.0
  });

  // 薪資換算公式
  const calculateDailyRate = (baseSalary) => {
    return Math.round(baseSalary / 30); // 月薪轉日薪：除以30天
  };
  
  const calculateHourlyRate = (baseSalary) => {
    return Math.round(baseSalary / 240); // 月薪轉時薪：除以240小時 (30天 × 8小時)
  };
  
  const calculateAbsenceDeduction = (baseSalary, absenceDays) => {
    return Math.round((baseSalary / 30) * absenceDays); // 缺勤扣款：基本薪資 ÷ 30天 × 缺勤天數
  };

  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGrades();
  }, []);

  const loadGrades = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getSalaryGrades();
      setGrades(response.data || []);
    } catch (error) {
      console.error('Failed to load salary grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingGrade(null);
    setFormData({
      grade_name: '',
      grade_level: Math.max(...grades.map(g => g.grade_level), 0) + 1,
      base_salary: 0,
      hourly_rate: 0,
      overtime_rate_weekday: 1.34,
      overtime_rate_weekend: 1.67,
      overtime_rate_holiday: 2.0
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (grade) => {
    setEditingGrade(grade);
    setFormData({
      grade_name: grade.grade_name || '',
      grade_level: grade.grade_level || 1,
      base_salary: grade.base_salary || 0,
      overtime_rate_weekday: grade.overtime_rate_weekday || 1.34,
      overtime_rate_weekend: grade.overtime_rate_weekend || 1.67,
      overtime_rate_holiday: grade.overtime_rate_holiday || 2.0
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const gradeData = {
        ...formData,
        hourly_rate: calculateHourlyRate(formData.base_salary),
        is_active: editingGrade ? editingGrade.is_active : true
      };
      
      if (editingGrade) {
        await apiClient.updateSalaryGrade(editingGrade.id, gradeData);
      } else {
        await apiClient.createSalaryGrade(gradeData);
      }
      
      await loadGrades();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save salary grade:', error);
      alert('保存失敗：' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('確定要刪除此薪資等級嗎？')) {
      try {
        await apiClient.deleteSalaryGrade(id);
        await loadGrades();
      } catch (error) {
        console.error('Failed to delete salary grade:', error);
        alert('刪除失敗：' + error.message);
      }
    }
  };

  const toggleStatus = async (id) => {
    try {
      const grade = grades.find(g => g.id === id);
      await apiClient.updateSalaryGrade(id, { ...grade, is_active: !grade.is_active });
      await loadGrades();
    } catch (error) {
      console.error('Failed to toggle grade status:', error);
      alert('狀態更新失敗：' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{t('salary.grades')}</h2>
          <p className="text-gray-600">{t('salary.gradesDescription')}</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t('salary.addGrade')}
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">{t('common.loading')}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {grades.map((grade) => (
          <Card key={grade.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{grade.grade_name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant={grade.is_active ? 'default' : 'secondary'}
                      className={`cursor-pointer ${
                        grade.is_active 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      onClick={() => toggleStatus(grade.id)}
                    >
                      {grade.is_active ? t('common.active') : t('common.inactive')}
                    </Badge>
                    <span className="text-sm text-gray-500">{t('salary.level')} {grade.grade_level}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">{t('salary.monthlySalary')}</span>
                  <div className="font-semibold">${grade.base_salary.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-500">{t('salary.dailySalary')}</span>
                  <div className="font-semibold">${calculateDailyRate(grade.base_salary)}</div>
                </div>
                <div>
                  <span className="text-gray-500">{t('salary.hourlyRate')}</span>
                  <div className="font-semibold">${calculateHourlyRate(grade.base_salary)}</div>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="text-sm text-gray-500 mb-2">{t('salary.overtimeMultiplier')}</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="text-gray-500">{t('salary.weekday')}</div>
                    <div className="font-medium">{grade.overtime_rate_weekday}x</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">{t('salary.weekend')}</div>
                    <div className="font-medium">{grade.overtime_rate_weekend}x</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">{t('salary.holiday')}</div>
                    <div className="font-medium">{grade.overtime_rate_holiday}x</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={() => handleEdit(grade)} variant="outline" size="sm" className="flex-1">
                  <Edit className="h-3 w-3 mr-1" />
                  {t('common.edit')}
                </Button>
                <Button onClick={() => handleDelete(grade.id)} variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGrade ? t('salary.editGrade') : t('salary.addGrade')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.gradeName')}</label>
              <Input
                value={formData.grade_name}
                onChange={(e) => setFormData({...formData, grade_name: e.target.value})}
                placeholder={t('salary.enterGradeName')}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.gradeLevel')}</label>
              <Input
                type="number"
                value={formData.grade_level}
                onChange={(e) => setFormData({...formData, grade_level: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.baseSalary')}</label>
              <Input
                type="number"
                value={formData.base_salary}
                onChange={(e) => setFormData({...formData, base_salary: parseInt(e.target.value) || 0})}
                placeholder={t('salary.enterMonthlySalary')}
              />
              {formData.base_salary > 0 && (
                <div className="mt-2 text-sm text-gray-600 space-y-1">
                  <div>{t('salary.dailySalary')}: ${calculateDailyRate(formData.base_salary).toLocaleString()}</div>
                  <div>{t('salary.hourlyRate')}: ${calculateHourlyRate(formData.base_salary).toLocaleString()}</div>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.overtimeMultiplier')}</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-500">{t('salary.weekday')}</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.overtime_rate_weekday || ''}
                    onChange={(e) => setFormData({...formData, overtime_rate_weekday: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">{t('salary.weekend')}</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.overtime_rate_weekend || ''}
                    onChange={(e) => setFormData({...formData, overtime_rate_weekend: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">{t('salary.holiday')}</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.overtime_rate_holiday || ''}
                    onChange={(e) => setFormData({...formData, overtime_rate_holiday: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalaryGrades;