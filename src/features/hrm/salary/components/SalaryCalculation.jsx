import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog.jsx';
import { Calculator, Plus, Eye, Check, DollarSign, Trash2 } from 'lucide-react';
import { apiClient } from '@/services/api.js';

const SalaryCalculation = () => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCalculation, setSelectedCalculation] = useState(null);
  const [formData, setFormData] = useState({
    member_id: '',
    period_start: '',
    period_end: '',
    overtime_weekday: 0,
    overtime_weekend: 0,
    overtime_holiday: 0,
    absence_days: 0
  });

  const [employees, setEmployees] = useState([]);
  const [salarySettings, setSalarySettings] = useState(null);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesRes, adjustmentsRes] = await Promise.all([
        apiClient.getEmployeeSalaries(),
        apiClient.getSalaryAdjustments()
      ]);
      
      setEmployees(employeesRes.data || []);
      setAdjustments(adjustmentsRes.data || []);
      
      // Load salary settings if workspace is available
      const workspaceId = localStorage.getItem('currentWorkspaceId');
      if (workspaceId) {
        const settingsRes = await apiClient.getSalarySettings(workspaceId);
        setSalarySettings(settingsRes.data);
      }
    } catch (error) {
      console.error('Failed to load calculation data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 薪資換算公式
  const calculateHourlyRate = (baseSalary) => {
    return Math.round(baseSalary / 240); // 月薪轉時薪：除以240小時
  };
  
  const calculateAbsenceDeduction = (baseSalary, absenceDays) => {
    return Math.round((baseSalary / 30) * absenceDays); // 缺勤扣款
  };

  const getEmployeeAdjustments = (memberId, periodStart, periodEnd) => {
    return adjustments.filter(adj => 
      adj.member_id === memberId && 
      adj.status === 'processed' &&
      adj.effective_date >= periodStart &&
      adj.effective_date <= periodEnd
    );
  };

  const isPositiveAdjustment = (typeName) => {
    return typeName.includes('獎金') || typeName.includes('津貼') || typeName.includes('貼');
  };

  const calculateAdjustmentTotal = (adjustmentList) => {
    return adjustmentList.reduce((sum, adj) => {
      return sum + (isPositiveAdjustment(adj.adjustment_type_name) ? adj.amount : -adj.amount);
    }, 0);
  };

  const [calculations, setCalculations] = useState([]);

  const loadCalculations = async () => {
    try {
      const response = await apiClient.getSalaryCalculations();
      setCalculations(response.data || []);
    } catch (error) {
      console.error('Failed to load calculations:', error);
    }
  };

  useEffect(() => {
    loadCalculations();
  }, []);

  const handleCreate = () => {
    setFormData({
      member_id: '',
      period_start: '',
      period_end: '',
      overtime_weekday: 0,
      overtime_weekend: 0,
      overtime_holiday: 0,
      absence_days: 0
    });
    setIsDialogOpen(true);
  };

  const handleCalculate = async () => {
    try {
      const calculationData = {
        member_id: formData.member_id,
        period_start: formData.period_start,
        period_end: formData.period_end,
        overtime_weekday: formData.overtime_weekday,
        overtime_weekend: formData.overtime_weekend,
        overtime_holiday: formData.overtime_holiday,
        absence_days: formData.absence_days
      };
      
      await apiClient.createSalaryCalculation(calculationData);
      await loadCalculations();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create calculation:', error);
      alert('計算失敗：' + error.message);
    }
  };

  const handleView = (calculation) => {
    setSelectedCalculation(calculation);
    setViewDialogOpen(true);
  };

  const handleConfirm = async (id) => {
    try {
      await apiClient.confirmSalaryCalculation(id);
      await loadCalculations();
    } catch (error) {
      console.error('Failed to confirm calculation:', error);
      alert('確認失敗：' + error.message);
    }
  };

  const handlePay = async (id) => {
    try {
      await apiClient.paySalaryCalculation(id);
      await loadCalculations();
    } catch (error) {
      console.error('Failed to mark as paid:', error);
      alert('標記失敗：' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('確定要刪除此薪資計算嗎？')) {
      try {
        await apiClient.deleteSalaryCalculation(id);
        await loadCalculations();
      } catch (error) {
        console.error('Failed to delete calculation:', error);
        alert('刪除失敗：' + error.message);
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { label: t('salary.draft'), variant: 'secondary' },
      confirmed: { label: t('salary.confirmed'), variant: 'default' },
      paid: { label: t('salary.paid'), variant: 'success' }
    };
    const config = statusMap[status] || statusMap.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{t('salary.calculation')}</h2>
          <p className="text-gray-600">{t('salary.calculationDescription')}</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t('salary.addCalculation')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {loading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-gray-500">{t('common.loading')}</div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                {t('salary.quickCalculation')}
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.selectEmployee')}</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={formData.member_id}
                onChange={(e) => setFormData({...formData, member_id: e.target.value})}
              >
                <option value="">{t('salary.pleaseSelectEmployee')}</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-2 block">{t('salary.startDate')}</label>
                <Input 
                  type="date" 
                  value={formData.period_start}
                  onChange={(e) => setFormData({...formData, period_start: e.target.value})}
                  placeholder="yyyy/mm/dd"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t('salary.endDate')}</label>
                <Input 
                  type="date" 
                  value={formData.period_end}
                  onChange={(e) => setFormData({...formData, period_end: e.target.value})}
                  placeholder="yyyy/mm/dd"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.overtimeHours')}</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{t('salary.weekday')}</label>
                  <Input 
                    type="number" 
                    value={formData.overtime_weekday}
                    onChange={(e) => setFormData({...formData, overtime_weekday: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{t('salary.weekend')}</label>
                  <Input 
                    type="number" 
                    value={formData.overtime_weekend}
                    onChange={(e) => setFormData({...formData, overtime_weekend: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{t('salary.holiday')}</label>
                  <Input 
                    type="number" 
                    value={formData.overtime_holiday}
                    onChange={(e) => setFormData({...formData, overtime_holiday: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.adjustmentPreview')}</label>
              <div className="bg-gray-50 p-3 rounded-md max-h-24 overflow-y-auto">
                {formData.member_id && formData.period_start && formData.period_end ? (
                  getEmployeeAdjustments(formData.member_id, formData.period_start, formData.period_end).length > 0 ? (
                    getEmployeeAdjustments(formData.member_id, formData.period_start, formData.period_end).map(adj => (
                      <div key={adj.id} className="text-xs flex justify-between py-1">
                        <span>{adj.adjustment_type_name}</span>
                        <span className={isPositiveAdjustment(adj.adjustment_type_name) ? 'text-green-600' : 'text-red-600'}>
                          {isPositiveAdjustment(adj.adjustment_type_name) ? '+' : '-'}${adj.amount.toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500">{t('salary.noAdjustmentRecords')}</div>
                  )
                ) : (
                  <div className="text-xs text-gray-500">{t('salary.pleaseSelectEmployeeAndPeriod')}</div>
                )}
              </div>
            </div>

            </CardContent>
          </Card>
        )}

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('salary.calculationRecords')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium text-gray-900">{t('salary.employee')}</th>
                      <th className="text-left p-4 font-medium text-gray-900">{t('salary.calculationPeriod')}</th>
                      <th className="text-left p-4 font-medium text-gray-900">{t('salary.grossSalary')}</th>
                      <th className="text-left p-4 font-medium text-gray-900">{t('salary.netSalary')}</th>
                      <th className="text-left p-4 font-medium text-gray-900">{t('common.status')}</th>
                      <th className="text-left p-4 font-medium text-gray-900">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculations.map((calc) => (
                      <tr key={calc.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <span className="font-medium">{calc.member_name}</span>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {calc.period_start} ~ {calc.period_end}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-medium">${calc.gross_salary.toLocaleString()}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-green-600">${calc.net_salary.toLocaleString()}</span>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(calc.status)}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button onClick={() => handleView(calc)} variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {calc.status === 'draft' && (
                              <Button onClick={() => handleConfirm(calc.id)} variant="ghost" size="sm">
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {calc.status === 'confirmed' && (
                              <Button onClick={() => handlePay(calc.id)} variant="ghost" size="sm">
                                <DollarSign className="h-4 w-4" />
                              </Button>
                            )}
                            <Button onClick={() => handleDelete(calc.id)} variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('salary.addCalculation')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.selectEmployee')}</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={formData.member_id}
                onChange={(e) => setFormData({...formData, member_id: e.target.value})}
              >
                <option value="">{t('salary.pleaseSelectEmployee')}</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-2 block">{t('salary.startDate')}</label>
                <Input 
                  type="date" 
                  value={formData.period_start}
                  onChange={(e) => setFormData({...formData, period_start: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t('salary.endDate')}</label>
                <Input 
                  type="date" 
                  value={formData.period_end}
                  onChange={(e) => setFormData({...formData, period_end: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-2 block">{t('salary.overtimeHours')}</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">{t('salary.weekday')}</label>
                    <Input 
                      type="number" 
                      value={formData.overtime_weekday}
                      onChange={(e) => setFormData({...formData, overtime_weekday: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{t('salary.weekend')}</label>
                    <Input 
                      type="number" 
                      value={formData.overtime_weekend}
                      onChange={(e) => setFormData({...formData, overtime_weekend: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{t('salary.holiday')}</label>
                    <Input 
                      type="number" 
                      value={formData.overtime_holiday}
                      onChange={(e) => setFormData({...formData, overtime_holiday: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t('salary.absenceDays')}</label>
                <Input 
                  type="number" 
                  value={formData.absence_days}
                  onChange={(e) => setFormData({...formData, absence_days: parseInt(e.target.value) || 0})}
                  placeholder={t('salary.enterAbsenceDays')}
                />
                {formData.member_id && formData.absence_days > 0 && (
                  <div className="mt-1 text-xs text-red-600">
                    {t('salary.deduction')}：${calculateAbsenceDeduction(
                      employees.find(e => e.id === formData.member_id)?.base_salary || 0, 
                      formData.absence_days
                    ).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.adjustmentPreview')}</label>
              <div className="bg-gray-50 p-2 rounded-md max-h-20 overflow-y-auto">
                {formData.member_id && formData.period_start && formData.period_end ? (
                  getEmployeeAdjustments(formData.member_id, formData.period_start, formData.period_end).length > 0 ? (
                    getEmployeeAdjustments(formData.member_id, formData.period_start, formData.period_end).map(adj => (
                      <div key={adj.id} className="text-xs flex justify-between py-1">
                        <span>{adj.adjustment_type_name}</span>
                        <span className={isPositiveAdjustment(adj.adjustment_type_name) ? 'text-green-600' : 'text-red-600'}>
                          {isPositiveAdjustment(adj.adjustment_type_name) ? '+' : '-'}${adj.amount.toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500">{t('salary.noAdjustmentRecords')}</div>
                  )
                ) : (
                  <div className="text-xs text-gray-500">{t('salary.pleaseSelectEmployeeAndPeriod')}</div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleCalculate} disabled={!formData.member_id || !formData.period_start || !formData.period_end}>{t('salary.calculate')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('salary.calculationDetails')}</DialogTitle>
          </DialogHeader>
          {selectedCalculation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">{t('salary.employeeName')}</label>
                  <div className="font-medium">{selectedCalculation.member_name}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">{t('salary.calculationPeriod')}</label>
                  <div className="font-medium">{selectedCalculation.period_start} ~ {selectedCalculation.period_end}</div>
                </div>
              </div>
              {selectedCalculation.details && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-500">{t('salary.baseSalary')}</label>
                    <div className="font-medium">${selectedCalculation.details.base_salary?.toLocaleString()}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">{t('salary.hourlyRate')}</label>
                    <div className="font-medium">${selectedCalculation.details.hourly_rate?.toLocaleString()}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">{t('salary.overtimeHours')}</label>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>{t('salary.weekday')}: {selectedCalculation.details.overtime_hours?.weekday}{t('salary.hours')}</div>
                      <div>{t('salary.weekend')}: {selectedCalculation.details.overtime_hours?.weekend}{t('salary.hours')}</div>
                      <div>{t('salary.holiday')}: {selectedCalculation.details.overtime_hours?.holiday}{t('salary.hours')}</div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">{t('salary.overtimePay')}</label>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>{t('salary.weekday')}: ${Math.round(selectedCalculation.details.overtime_pay?.weekday || 0)}</div>
                      <div>{t('salary.weekend')}: ${Math.round(selectedCalculation.details.overtime_pay?.weekend || 0)}</div>
                      <div>{t('salary.holiday')}: ${Math.round(selectedCalculation.details.overtime_pay?.holiday || 0)}</div>
                    </div>
                  </div>
                  {selectedCalculation.details.absence_days > 0 && (
                    <div>
                      <label className="text-sm text-gray-500">{t('salary.absenceDeduction')}</label>
                      <div className="text-sm text-red-600">
                        {selectedCalculation.details.absence_days}{t('salary.days')} - ${selectedCalculation.details.absence_deduction?.toLocaleString()}
                      </div>
                    </div>
                  )}
                  {selectedCalculation.details.adjustments && selectedCalculation.details.adjustments.length > 0 && (
                    <div>
                      <label className="text-sm text-gray-500">{t('salary.adjustments')}</label>
                      <div className="space-y-1">
                        {selectedCalculation.details.adjustments.map(adj => (
                          <div key={adj.id} className="text-sm flex justify-between">
                            <span>{adj.adjustment_type_name}</span>
                            <span className={isPositiveAdjustment(adj.adjustment_type_name) ? 'text-green-600' : 'text-red-600'}>
                              {isPositiveAdjustment(adj.adjustment_type_name) ? '+' : '-'}${adj.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                        <div className="text-sm font-medium border-t pt-1">
                          <span>{t('salary.adjustmentTotal')}：</span>
                          <span className={selectedCalculation.details.adjustment_total >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {selectedCalculation.details.adjustment_total >= 0 ? '+' : ''}${selectedCalculation.details.adjustment_total?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">{t('salary.grossSalary')}</span>
                  <span className="text-lg font-bold">${selectedCalculation.gross_salary?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-green-600">
                  <span className="text-lg font-semibold">{t('salary.netSalary')}</span>
                  <span className="text-lg font-bold">${selectedCalculation.net_salary?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)}>{t('salary.close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalaryCalculation;