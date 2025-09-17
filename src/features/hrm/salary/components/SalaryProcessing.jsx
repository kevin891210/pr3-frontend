import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Calculator, TrendingUp } from 'lucide-react';
import SalaryCalculation from './SalaryCalculation';
import SalaryAdjustments from './SalaryAdjustments';

const SalaryProcessing = () => {
  const [activeTab, setActiveTab] = useState('calculation');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">薪資計算</h2>
        <p className="text-gray-600">執行薪資計算與管理調整記錄</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calculation" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            薪資計算
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            調整記錄
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculation" className="mt-6">
          <SalaryCalculation />
        </TabsContent>

        <TabsContent value="adjustments" className="mt-6">
          <SalaryAdjustments />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalaryProcessing;