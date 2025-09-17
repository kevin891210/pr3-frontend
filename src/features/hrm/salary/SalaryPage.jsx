import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx';
import { DollarSign, Users, Calculator, FileText, Settings, TrendingUp } from 'lucide-react';
import SalaryGrades from './components/SalaryGrades';
import EmployeeSalary from './components/EmployeeSalary';
import SalaryCalculation from './components/SalaryCalculation';
import SalaryAdjustments from './components/SalaryAdjustments';
import SalarySettings from './components/SalarySettings';
import SalaryReports from './components/SalaryReports';

const SalaryPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('settings');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('salary.management')}</h1>
        <p className="text-gray-600">{t('salary.settingsDescription')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t('salary.settings')}
          </TabsTrigger>
          <TabsTrigger value="grades" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            {t('salary.grades')}
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('salary.employees')}
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('salary.adjustments')}
          </TabsTrigger>
          <TabsTrigger value="calculation" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            {t('salary.calculation')}
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('salary.reports')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-6">
          <SalarySettings />
        </TabsContent>

        <TabsContent value="grades" className="mt-6">
          <SalaryGrades />
        </TabsContent>

        <TabsContent value="employees" className="mt-6">
          <EmployeeSalary />
        </TabsContent>

        <TabsContent value="adjustments" className="mt-6">
          <SalaryAdjustments />
        </TabsContent>

        <TabsContent value="calculation" className="mt-6">
          <SalaryCalculation />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <SalaryReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalaryPage;