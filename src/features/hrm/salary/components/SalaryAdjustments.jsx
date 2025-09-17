import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../../../services/api.js';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Plus, Check, Trash2, TrendingUp, TrendingDown, Gift, AlertTriangle, Settings, Edit } from 'lucide-react';

const SalaryAdjustments = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('adjustments');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    member_id: '',
    adjustment_type_id: '',
    amount: 0,
    reason: '',
    effective_date: ''
  });
  const [typeFormData, setTypeFormData] = useState({
    type_name: '',
    type_code: '',
    description: ''
  });

  const [employees, setEmployees] = useState([]);
  const [adjustmentTypes, setAdjustmentTypes] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesRes, typesRes, adjustmentsRes] = await Promise.all([
        apiClient.getEmployeeSalaries(),
        apiClient.getSalaryAdjustmentTypes(),
        apiClient.getSalaryAdjustments()
      ]);
      
      setEmployees(employeesRes.data || []);
      setAdjustmentTypes(typesRes.data || []);
      setAdjustments(adjustmentsRes.data || []);
    } catch (error) {
      console.error('Failed to load adjustment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (typeCode) => {
    const iconMap = {
      bonus: { icon: Gift, color: 'text-green-600' },
      penalty: { icon: AlertTriangle, color: 'text-red-600' },
      allowance: { icon: TrendingUp, color: 'text-blue-600' },
      deduction: { icon: TrendingDown, color: 'text-orange-600' }
    };
    const config = iconMap[typeCode] || iconMap.bonus;
    const Icon = config.icon;
    return <Icon className={`h-4 w-4 ${config.color}`} />;
  };

  const handleCreate = () => {
    setFormData({
      member_id: '',
      adjustment_type_id: '',
      amount: 0,
      reason: '',
      effective_date: ''
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      await apiClient.createSalaryAdjustment(formData);
      await loadData();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create adjustment:', error);
      alert('創建失敗：' + error.message);
    }
  };

  const handleCreateType = () => {
    setTypeFormData({ type_name: '', type_code: '', description: '' });
    setEditingType(null);
    setIsTypeDialogOpen(true);
  };

  const handleEditType = (type) => {
    setTypeFormData({
      type_name: type.type_name,
      type_code: type.type_code,
      description: type.description
    });
    setEditingType(type);
    setIsTypeDialogOpen(true);
  };

  const handleSaveType = async () => {
    try {
      if (editingType) {
        await apiClient.updateSalaryAdjustmentType(editingType.id, typeFormData);
      } else {
        await apiClient.createSalaryAdjustmentType(typeFormData);
      }
      await loadData();
      setIsTypeDialogOpen(false);
    } catch (error) {
      console.error('Failed to save adjustment type:', error);
      alert('保存失敗：' + error.message);
    }
  };

  const handleDeleteType = async (id) => {
    if (confirm('確定要刪除此調整類型嗎？')) {
      try {
        await apiClient.deleteSalaryAdjustmentType(id);
        await loadData();
      } catch (error) {
        console.error('Failed to delete adjustment type:', error);
        alert('刪除失敗：' + error.message);
      }
    }
  };

  const handleProcess = async (id) => {
    try {
      await apiClient.processSalaryAdjustment(id);
      await loadData();
    } catch (error) {
      console.error('Failed to process adjustment:', error);
      alert('處理失敗：' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('確定要刪除此薪資調整嗎？')) {
      try {
        await apiClient.deleteSalaryAdjustment(id);
        await loadData();
      } catch (error) {
        console.error('Failed to delete adjustment:', error);
        alert('刪除失敗：' + error.message);
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: '待處理', variant: 'secondary' },
      processed: { label: '已處理', variant: 'default' }
    };
    const config = statusMap[status] || statusMap.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isPositiveAdjustment = (typeName) => {
    return typeName.includes('獎金') || typeName.includes('津貼');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{t('salary.adjustments')}</h2>
          <p className="text-gray-600">{t('salary.adjustmentsDescription')}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="adjustments" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('salary.adjustmentRecords')}
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t('salary.adjustmentTypes')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="adjustments" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{t('salary.adjustmentRecords')}</h3>
            <Button onClick={handleCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('salary.addAdjustment')}
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">{t('common.loading')}</div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium text-gray-900">{t('salary.employee')}</th>
                        <th className="text-left p-4 font-medium text-gray-900">{t('salary.adjustmentType')}</th>
                        <th className="text-left p-4 font-medium text-gray-900">{t('salary.amount')}</th>
                        <th className="text-left p-4 font-medium text-gray-900">{t('salary.reason')}</th>
                        <th className="text-left p-4 font-medium text-gray-900">{t('salary.effectiveDate')}</th>
                        <th className="text-left p-4 font-medium text-gray-900">{t('common.status')}</th>
                        <th className="text-left p-4 font-medium text-gray-900">{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adjustments.map((adj) => (
                        <tr key={adj.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <span className="font-medium">{adj.member_name}</span>
                          </td>
                          <td className="p-4">
                            <span>{adj.adjustment_type_name}</span>
                          </td>
                          <td className="p-4">
                            <span className={`font-medium ${
                              isPositiveAdjustment(adj.adjustment_type_name)
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {isPositiveAdjustment(adj.adjustment_type_name) ? '+' : '-'}
                              ${adj.amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-sm">{adj.reason}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-sm">{adj.effective_date}</span>
                          </td>
                          <td className="p-4">
                            {getStatusBadge(adj.status)}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              {adj.status === 'pending' && (
                                <Button onClick={() => handleProcess(adj.id)} variant="ghost" size="sm">
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button onClick={() => handleDelete(adj.id)} variant="ghost" size="sm" className="text-red-600">
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
          )}
        </TabsContent>

        <TabsContent value="types" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{t('salary.adjustmentTypeManagement')}</h3>
            <Button onClick={handleCreateType} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('salary.addType')}
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium text-gray-900">{t('salary.typeName')}</th>
                      <th className="text-left p-4 font-medium text-gray-900">{t('salary.typeCode')}</th>
                      <th className="text-left p-4 font-medium text-gray-900">{t('salary.description')}</th>
                      <th className="text-left p-4 font-medium text-gray-900">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adjustmentTypes.map((type) => (
                      <tr key={type.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(type.type_code)}
                            <span className="font-medium">{type.type_name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{type.type_code}</Badge>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-gray-600">{type.description}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button onClick={() => handleEditType(type)} variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button onClick={() => handleDeleteType(type.id)} variant="ghost" size="sm" className="text-red-600">
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
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('salary.addAdjustment')}</DialogTitle>
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
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.adjustmentType')}</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={formData.adjustment_type_id}
                onChange={(e) => setFormData({...formData, adjustment_type_id: e.target.value})}
              >
                <option value="">{t('salary.pleaseSelectType')}</option>
                {adjustmentTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.type_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.amount')}</label>
              <Input 
                type="number" 
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: parseInt(e.target.value) || 0})}
                placeholder={t('salary.enterAmount')}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.reason')}</label>
              <Input 
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                placeholder={t('salary.enterReason')}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.effectiveDate')}</label>
              <Input 
                type="date" 
                value={formData.effective_date}
                onChange={(e) => setFormData({...formData, effective_date: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={!formData.member_id || !formData.adjustment_type_id || !formData.amount || !formData.effective_date}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingType ? t('common.edit') : t('common.add')}{t('salary.adjustmentType')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.typeName')}</label>
              <Input 
                value={typeFormData.type_name}
                onChange={(e) => setTypeFormData({...typeFormData, type_name: e.target.value})}
                placeholder={t('salary.enterTypeName')}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.typeCode')}</label>
              <Input 
                value={typeFormData.type_code}
                onChange={(e) => setTypeFormData({...typeFormData, type_code: e.target.value})}
                placeholder={t('salary.enterTypeCode')}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.description')}</label>
              <Input 
                value={typeFormData.description}
                onChange={(e) => setTypeFormData({...typeFormData, description: e.target.value})}
                placeholder={t('salary.enterDescription')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTypeDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveType} disabled={!typeFormData.type_name || !typeFormData.type_code}>
              {editingType ? t('common.update') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalaryAdjustments;