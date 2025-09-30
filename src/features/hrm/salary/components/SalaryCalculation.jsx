import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../../store/authStore.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog.jsx';
import { Calculator, Plus, Eye, Check, DollarSign, Trash2, RefreshCw } from 'lucide-react';
import { apiClient } from '@/services/api.js';
import MobilePagination from '@/components/ui/mobile-pagination.jsx';

const SalaryCalculation = () => {
  const { t } = useTranslation();
  const toast = useToast();
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
  const [tableHeight, setTableHeight] = useState(440);
  const cardRef = useRef(null);
  const headerRef = useRef(null);
  const paginationRef = useRef(null);

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
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    total: 0
  });

  const loadCalculations = async (page = 1, pageSize = pagination.pageSize) => {
    try {
      const response = await apiClient.getSalaryCalculations({ page, limit: pageSize });
      // 保持原始狀態值（小寫）以匹配資料庫
      const calculations = response.data || [];
      setCalculations(calculations);
      setPagination(prev => ({
        ...prev,
        currentPage: page,
        total: response.total || calculations.length
      }));
    } catch (error) {
      console.error('Failed to load calculations:', error);
      if (error.message.includes('enum values') && error.message.includes('salarystatus')) {
        toast.error('後端 API 狀態值定義與資料庫不一致，請聯繫後端開發者修正 enum 定義');
        // 設定空資料以避免頁面崩潰
        setCalculations([]);
      } else {
        toast.error('載入計算記錄失敗：' + error.message);
      }
    }
  };

  useEffect(() => {
    loadCalculations(1);
  }, []);

  useEffect(() => {
    const calculateTableHeight = () => {
      if (cardRef.current && headerRef.current && paginationRef.current) {
        const cardHeight = cardRef.current.offsetHeight;
        const headerHeight = headerRef.current.offsetHeight;
        const paginationHeight = paginationRef.current.offsetHeight;
        const availableHeight = cardHeight - headerHeight - paginationHeight - 20; // 20px padding
        setTableHeight(Math.max(200, availableHeight)); // 最小高度 200px
      }
    };

    calculateTableHeight();
    window.addEventListener('resize', calculateTableHeight);
    return () => window.removeEventListener('resize', calculateTableHeight);
  }, [calculations]);

  const handlePageChange = (page) => {
    loadCalculations(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, currentPage: 1 }));
    loadCalculations(1, newPageSize);
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  const startIndex = (pagination.currentPage - 1) * pagination.pageSize + 1;
  const endIndex = Math.min(pagination.currentPage * pagination.pageSize, pagination.total);

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
      const { user } = useAuthStore.getState();
      const selectedEmployee = employees.find(emp => emp.id === formData.member_id);
      
      // 檢查員工薪資生效日期
      if (selectedEmployee?.effective_date) {
        const effectiveDate = new Date(selectedEmployee.effective_date);
        const periodStart = new Date(formData.period_start);
        
        if (effectiveDate > periodStart) {
          const shouldContinue = await toast.confirm(
            `警告：員工薪資生效日期 (${selectedEmployee.effective_date}) 晚於計算期間開始日期 (${formData.period_start})，可能影響計算結果。\n\n是否繼續進行計算？`
          );
          if (!shouldContinue) return;
        }
      }
      
      const calculationData = {
        member_id: formData.member_id,
        period_start: formData.period_start,
        period_end: formData.period_end,
        overtime_weekday: formData.overtime_weekday,
        overtime_weekend: formData.overtime_weekend,
        overtime_holiday: formData.overtime_holiday,
        absence_days: formData.absence_days,
        calculated_by: user?.id || user?.user_id || 'admin-user-id',
        status: 'draft'
      };
      
      const response = await apiClient.createSalaryCalculation(calculationData);
      if (response.success || response.data) {
        const data = response.data || {};
        const resultMessage = `薪資計算成功！\n基本薪資: $${(data.base_salary || 0).toLocaleString()}\n加班費: $${(data.overtime_pay || 0).toLocaleString()}\n總薪資: $${(data.gross_salary || 0).toLocaleString()}\n淨薪資: $${(data.net_salary || 0).toLocaleString()}`;
        toast.success(resultMessage, 5000);
        if (!response.success && response.message) {
          toast.warning('計算完成，但有警告：' + response.message);
        }
        loadCalculations(pagination.currentPage);
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to create calculation:', error);
      toast.error('計算失敗：' + error.message);
    }
  };

  const handleView = async (calculation) => {
    try {
      // 調用 API 獲取詳細的薪資計算資料
      const response = await apiClient.getSalaryCalculationById(calculation.id);
      setSelectedCalculation(response.data || calculation);
      setViewDialogOpen(true);
    } catch (error) {
      console.error('Failed to load calculation details:', error);
      // 如果 API 調用失敗，使用現有資料
      setSelectedCalculation(calculation);
      setViewDialogOpen(true);
      toast.error('載入詳細資料失敗，顯示基本資訊：' + error.message);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await apiClient.confirmSalaryCalculation(id);
      await loadCalculations(pagination.currentPage);
    } catch (error) {
      console.error('Failed to confirm calculation:', error);
      toast.error('確認失敗：' + error.message);
    }
  };

  const handlePay = async (id) => {
    try {
      await apiClient.paySalaryCalculation(id);
      await loadCalculations(pagination.currentPage);
    } catch (error) {
      console.error('Failed to mark as paid:', error);
      toast.error('標記失敗：' + error.message);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await toast.confirm('確定要刪除此薪資計算嗎？');
    if (confirmed) {
      try {
        await apiClient.deleteSalaryCalculation(id);
        await loadCalculations(pagination.currentPage);
        toast.success('刪除成功');
      } catch (error) {
        console.error('Failed to delete calculation:', error);
        toast.error('刪除失敗：' + error.message);
      }
    }
  };

  const calculateAbsenceDaysFromLeave = async () => {
    if (!formData.member_id || !formData.period_start || !formData.period_end) {
      toast.error('請先選擇員工和計算期間');
      return;
    }

    try {
      // 獲取該員工在計算期間內的已批准請假記錄
      const response = await apiClient.getLeaveRequestsByDateRange(
        formData.member_id,
        formData.period_start,
        formData.period_end,
        'approved'
      );
      
      const leaveRequests = response.data || [];
      
      // 計算總請假天數
      const totalAbsenceDays = leaveRequests.reduce((total, request) => {
        // 確保請假日期在計算期間內
        const leaveStart = new Date(request.start_date);
        const leaveEnd = new Date(request.end_date);
        const periodStart = new Date(formData.period_start);
        const periodEnd = new Date(formData.period_end);
        
        // 計算重疊的天數
        const overlapStart = new Date(Math.max(leaveStart.getTime(), periodStart.getTime()));
        const overlapEnd = new Date(Math.min(leaveEnd.getTime(), periodEnd.getTime()));
        
        if (overlapStart <= overlapEnd) {
          const days = Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
          return total + days;
        }
        
        return total;
      }, 0);
      
      setFormData(prev => ({ ...prev, absence_days: totalAbsenceDays }));
      
      if (totalAbsenceDays > 0) {
        toast.success(`已自動計算缺勤天數：${totalAbsenceDays} 天（來自 ${leaveRequests.length} 筆已批准的請假記錄）`);
      } else {
        toast.info('該期間內沒有已批准的請假記錄');
      }
    } catch (error) {
      console.error('Failed to calculate absence days:', error);
      toast.error('自動計算失敗：' + error.message);
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
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 p-6 space-y-6">
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
          <Card className="h-[600px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                {t('salary.quickCalculation')}
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-4 h-[520px] overflow-y-auto">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.selectEmployee')}</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={formData.member_id}
                onChange={(e) => setFormData({...formData, member_id: e.target.value})}
              >
                <option value="">{t('salary.pleaseSelectEmployee')}</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.member_name}</option>
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
              <label className="text-sm font-medium mb-2 block">{t('salary.absenceDays')}</label>
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  value={formData.absence_days}
                  onChange={(e) => setFormData({...formData, absence_days: parseInt(e.target.value) || 0})}
                  placeholder={t('salary.enterAbsenceDays')}
                  className="flex-1"
                />
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => calculateAbsenceDaysFromLeave()}
                  disabled={!formData.member_id || !formData.period_start || !formData.period_end}
                  className="flex items-center"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
              {formData.member_id && formData.absence_days > 0 && (
                <div className="mt-1 text-xs text-red-600">
                  {t('salary.deduction')}：${calculateAbsenceDeduction(
                    employees.find(e => e.id === formData.member_id)?.base_salary || 0, 
                    formData.absence_days
                  ).toLocaleString()}
                </div>
              )}
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

            <Button 
              onClick={handleCalculate} 
              disabled={!formData.member_id || !formData.period_start || !formData.period_end}
              className="w-full mt-4"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {t('salary.calculate')}
            </Button>
            </CardContent>
          </Card>
        )}

        <div className="lg:col-span-2">
          <Card ref={cardRef} className="h-[600px] flex flex-col">
            <CardHeader ref={headerRef}>
              <CardTitle className="text-base">{t('salary.calculationRecords')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              <div className="overflow-auto" style={{height: `${tableHeight}px`}}>
                <table className="w-full min-w-[800px]">
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
              {pagination.total > 0 && (
                <div ref={paginationRef} className="border-t bg-white" style={{minHeight: '80px'}}>
                  {/* Desktop Pagination */}
                  <div className="hidden sm:flex items-center justify-between px-4 py-3">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-700">
                        顯示 {startIndex} 至 {endIndex} 筆，共 {pagination.total} 筆記錄
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">每頁顯示</span>
                        <select 
                          className="border rounded px-2 py-1 text-sm"
                          value={pagination.pageSize}
                          onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                        <span className="text-sm text-gray-700">筆</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                      >
                        上一頁
                      </Button>
                      <span className="text-sm">
                        {pagination.currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === totalPages}
                      >
                        下一頁
                      </Button>
                    </div>
                  </div>
                  
                  {/* Mobile Pagination */}
                  <div className="sm:hidden p-4">
                    <MobilePagination
                      currentPage={pagination.currentPage}
                      totalPages={totalPages}
                      pageSize={pagination.pageSize}
                      total={pagination.total}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                    />
                  </div>
                </div>
              )}
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
                  <option key={emp.id} value={emp.id}>{emp.member_name}</option>
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
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    value={formData.absence_days}
                    onChange={(e) => setFormData({...formData, absence_days: parseInt(e.target.value) || 0})}
                    placeholder={t('salary.enterAbsenceDays')}
                    className="flex-1"
                  />
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => calculateAbsenceDaysFromLeave()}
                    disabled={!formData.member_id || !formData.period_start || !formData.period_end}
                    className="flex items-center"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
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
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 border-b pb-2">{t('salary.calculationBreakdown')}</h4>
                
                {/* 薪資項目列表 - 只顯示非零值 */}
                <div className="space-y-2">
                  {selectedCalculation.base_salary > 0 && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-700">{t('salary.baseSalary')}</span>
                      <span className="font-medium">${selectedCalculation.base_salary.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {selectedCalculation.overtime_pay > 0 && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-700">{t('salary.overtimePay')}</span>
                      <span className="font-medium text-green-600">${selectedCalculation.overtime_pay.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {selectedCalculation.allowances > 0 && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-700">{t('salary.allowances')}</span>
                      <span className="font-medium text-green-600">${selectedCalculation.allowances.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {selectedCalculation.bonuses > 0 && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-700">{t('salary.bonuses')}</span>
                      <span className="font-medium text-green-600">${selectedCalculation.bonuses.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {selectedCalculation.leave_deductions > 0 && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-700">{t('salary.leaveDeductions')}</span>
                      <span className="font-medium text-red-600">-${selectedCalculation.leave_deductions.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {selectedCalculation.deductions > 0 && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-700">{t('salary.deductions')}</span>
                      <span className="font-medium text-red-600">-${selectedCalculation.deductions.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {selectedCalculation.tax_amount > 0 && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-700">{t('salary.taxAmount')}</span>
                      <span className="font-medium text-red-600">-${selectedCalculation.tax_amount.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {selectedCalculation.insurance_amount > 0 && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-700">{t('salary.insuranceAmount')}</span>
                      <span className="font-medium text-red-600">-${selectedCalculation.insurance_amount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                
                {/* 總計 */}
                <div className="border-t-2 pt-4 space-y-2">
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-semibold text-gray-900">{t('salary.grossSalary')}</span>
                    <span className="font-bold text-gray-900">${selectedCalculation.gross_salary?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xl">
                    <span className="font-bold text-green-700">{t('salary.netSalary')}</span>
                    <span className="font-bold text-green-700">${selectedCalculation.net_salary?.toLocaleString()}</span>
                  </div>
                </div>

                {/* 計算時間 */}
                {selectedCalculation.created_at && (
                  <div className="text-xs text-gray-500 text-center pt-2 border-t">
                    {t('salary.calculatedAt')}: {new Date(selectedCalculation.created_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)}>{t('common.close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
      
      {/* 頁尾 */}
      <footer className="bg-gray-50 border-t px-6 py-4">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            <span>© 2025 HRM 系統. 版權所有.</span>
          </div>
          <div className="flex space-x-4">
            <span>v0.3.0</span>
            <span>最後更新: 2025-01-17</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SalaryCalculation;