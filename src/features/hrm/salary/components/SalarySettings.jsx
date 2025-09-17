import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Settings, Save } from 'lucide-react';
import apiClient from '../../../../services/api';

const SalarySettings = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    has_fixed_tax: true,
    fixed_tax_rate: 0.05,
    transfer_fee: 15.0,
    payroll_cycle: 'monthly',
    payroll_day: 25,
    cutoff_day: 20,
    auto_generate_days: 3
  });

  const [isEditing, setIsEditing] = useState(false);

  const payrollCycles = [
    { value: 'weekly', label: t('salary.weekly') },
    { value: 'biweekly', label: t('salary.biweekly') },
    { value: 'monthly', label: t('salary.monthly') },
    { value: 'quarterly', label: t('salary.quarterly') }
  ];

  useEffect(() => {
    loadSalarySettings();
  }, []);

  const loadSalarySettings = async () => {
    try {
      const workspaceId = 'default'; // 或從 context 取得
      const response = await apiClient.getSalarySettings(workspaceId);
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('載入薪資設定失敗:', error);
    }
  };

  const handleSave = async () => {
    try {
      const workspaceId = 'default'; // 或從 context 取得
      await apiClient.updateSalarySettings(workspaceId, settings);
      setIsEditing(false);
      alert('薪資設定已保存');
    } catch (error) {
      console.error('保存薪資設定失敗:', error);
      alert('保存失敗：' + error.message);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{t('salary.settings')}</h2>
          <p className="text-gray-600">{t('salary.settingsDescription')}</p>
        </div>
        <Button 
          onClick={() => setIsEditing(!isEditing)} 
          variant={isEditing ? "outline" : "default"}
        >
          <Settings className="h-4 w-4 mr-2" />
          {isEditing ? t('common.cancel') : t('common.edit')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('salary.taxSettings')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="has_fixed_tax"
                checked={settings.has_fixed_tax}
                onChange={(e) => handleInputChange('has_fixed_tax', e.target.checked)}
                disabled={!isEditing}
                className="rounded"
              />
              <label htmlFor="has_fixed_tax" className="text-sm font-medium">
                {t('salary.enableFixedTax')}
              </label>
            </div>
            {settings.has_fixed_tax && (
              <div>
                <label className="text-sm font-medium mb-2 block">{t('salary.fixedTaxRate')}</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={settings.fixed_tax_rate || 0}
                  onChange={(e) => handleInputChange('fixed_tax_rate', parseFloat(e.target.value) || 0)}
                  disabled={!isEditing}
                  placeholder="例如：0.05 (5%)"
                />
                <div className="text-xs text-gray-500 mt-1">
                  當前稅率：{(settings.fixed_tax_rate * 100).toFixed(2)}%
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('salary.transferSettings')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.transferFee')}</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={settings.transfer_fee || 0}
                onChange={(e) => handleInputChange('transfer_fee', parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
                placeholder="輸入轉帳手續費"
              />
              <div className="text-xs text-gray-500 mt-1">
                每次薪資轉帳收取的固定手續費
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('salary.payrollCycle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.payrollCycle')}</label>
              <select
                className="w-full p-2 border rounded-md"
                value={settings.payroll_cycle || 'monthly'}
                onChange={(e) => handleInputChange('payroll_cycle', e.target.value)}
                disabled={!isEditing}
              >
                {payrollCycles.map(cycle => (
                  <option key={cycle.value} value={cycle.value}>
                    {cycle.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('salary.paymentSchedule')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.payrollDayLabel')}</label>
              <Input
                type="number"
                min="1"
                max="31"
                value={settings.payroll_day || 25}
                onChange={(e) => handleInputChange('payroll_day', parseInt(e.target.value) || 1)}
                disabled={!isEditing}
                placeholder={t('salary.monthlyPaymentDay')}
              />
              <div className="text-xs text-gray-500 mt-1">
                {t('salary.monthlyPaymentDay')} {settings.payroll_day} {t('salary.dayPayment')}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.cutoffDayLabel')}</label>
              <Input
                type="number"
                min="1"
                max="31"
                value={settings.cutoff_day || 20}
                onChange={(e) => handleInputChange('cutoff_day', parseInt(e.target.value) || 1)}
                disabled={!isEditing}
                placeholder={t('salary.monthlyCutoffDay')}
              />
              <div className="text-xs text-gray-500 mt-1">
                {t('salary.monthlyCutoffDay')} {settings.cutoff_day} {t('salary.dayCutoff')}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.autoGenerateLabel')}</label>
              <Input
                type="number"
                min="1"
                max="30"
                value={settings.auto_generate_days || 3}
                onChange={(e) => handleInputChange('auto_generate_days', parseInt(e.target.value) || 1)}
                disabled={!isEditing}
                placeholder={t('salary.autoGenerateDesc')}
              />
              <div className="text-xs text-gray-500 mt-1">
                {t('salary.autoGenerateDesc')} {settings.auto_generate_days} {t('salary.daysAutoGenerate')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('salary.settingsPreview')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-md space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">{t('salary.taxSystem')}：</span>
                {settings.has_fixed_tax ? `${t('salary.fixedTaxRate')} ${(settings.fixed_tax_rate * 100).toFixed(2)}%` : t('salary.noFixedTax')}
              </div>
              <div>
                <span className="font-medium">{t('salary.transferFee')}：</span>
                ${settings.transfer_fee}
              </div>
              <div>
                <span className="font-medium">{t('salary.paymentCycle')}：</span>
                {payrollCycles.find(c => c.value === settings.payroll_cycle)?.label}
              </div>
              <div>
                <span className="font-medium">{t('salary.paymentTime')}：</span>
                {t('salary.monthlyPaymentDay')} {settings.payroll_day} {t('salary.dayPayment')}
              </div>
              <div>
                <span className="font-medium">{t('salary.calculationCutoff')}：</span>
                {t('salary.monthlyCutoffDay')} {settings.cutoff_day} {t('salary.dayCutoff')}
              </div>
              <div>
                <span className="font-medium">{t('salary.autoGenerate')}：</span>
                {t('salary.autoGenerateDesc')} {settings.auto_generate_days} {t('salary.daysAutoGenerate')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isEditing && (
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {t('common.save')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SalarySettings;