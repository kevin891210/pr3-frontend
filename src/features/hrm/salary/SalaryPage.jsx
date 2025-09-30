import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx';
import { DollarSign, Users, Calculator, FileText, Settings, TrendingUp } from 'lucide-react';
import MobileTabSelect from '@/components/ui/mobile-tab-select.jsx';
import SalaryGrades from './components/SalaryGrades';
import EmployeeSalary from './components/EmployeeSalary';
import SalaryCalculation from './components/SalaryCalculation';
import SalaryAdjustments from './components/SalaryAdjustments';
import SalarySettings from './components/SalarySettings';
import SalaryReports from './components/SalaryReports';

const SalaryPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('settings');

  const tabOptions = [
    { value: 'settings', label: t('salary.settings'), icon: Settings },
    { value: 'grades', label: t('salary.grades'), icon: DollarSign },
    { value: 'employees', label: t('salary.employees'), icon: Users },
    { value: 'adjustments', label: t('salary.adjustments'), icon: TrendingUp },
    { value: 'calculation', label: t('salary.calculation'), icon: Calculator },
    { value: 'reports', label: t('salary.reports'), icon: FileText }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('salary.management')}</h1>
        <p className="text-sm sm:text-base text-gray-600">{t('salary.settingsDescription')}</p>
      </div>

      {/* Mobile Tab Selector */}
      <div className="block sm:hidden mb-6">
        <MobileTabSelect
          tabs={tabOptions}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Desktop Tab List */}
        <TabsList className="hidden sm:grid w-full grid-cols-6 gap-1">
          {tabOptions.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1 text-xs sm:text-sm">
                <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            );
          })}
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