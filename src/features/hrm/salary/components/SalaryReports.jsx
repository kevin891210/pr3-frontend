import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Download, Calendar, TrendingUp, Users, DollarSign } from 'lucide-react';
import { apiClient } from '@/services/api.js';
import { useAuthStore } from '@/store/authStore.jsx';

const SalaryReports = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [salaryTrend, setSalaryTrend] = useState([]);
  const [gradeDistribution, setGradeDistribution] = useState([]);
  const [statistics, setStatistics] = useState({
    totalEmployees: 0,
    monthlyTotal: 0,
    averageSalary: 0,
    growthRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState({
    startDate: '',
    endDate: ''
  });
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get workspace_id from user data or localStorage
      const workspaceId = user?.workspace_id || localStorage.getItem('workspace_id') || '1';
      
      if (!workspaceId) {
        throw new Error('Workspace ID not found. Please login again.');
      }
      
      const [reportsRes, statsRes] = await Promise.all([
        apiClient.getSalaryReports(workspaceId),
        apiClient.getSalaryStatistics(workspaceId)
      ]);
      
      if (reportsRes.data) {
        setSalaryTrend(reportsRes.data.salaryTrend || []);
        setGradeDistribution(reportsRes.data.gradeDistribution || []);
      }
      
      if (statsRes.data) {
        setStatistics(statsRes.data);
      }
    } catch (error) {
      console.error('Failed to load report data:', error);
      setError(error.message);
      // Keep default empty arrays for graceful degradation
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodSelect = () => {
    // TODO: 實作期間篩選邏輯
    console.log('Selected period:', selectedPeriod);
    setShowPeriodDialog(false);
  };

  const handleExportReport = () => {
    // TODO: 實作報表匯出邏輯
    console.log('Exporting report...');
    // 模擬匯出過程
    const reportData = {
      statistics,
      salaryTrend,
      gradeDistribution,
      period: selectedPeriod
    };
    
    // 創建並下載 JSON 文件（示例）
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salary-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{t('salary.reports')}</h2>
          <p className="text-gray-600">{t('salary.reportsDescription')}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setShowPeriodDialog(true)}
          >
            <Calendar className="h-4 w-4" />
            {t('salary.selectPeriod')}
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={handleExportReport}
          >
            <Download className="h-4 w-4" />
            {t('salary.exportReport')}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">{t('common.loading')}</div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <div className="text-red-500">Error: {error}</div>
          <Button onClick={loadReportData} className="mt-4">Retry</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('salary.totalEmployees')}</p>
                  <p className="text-2xl font-bold">{statistics.totalEmployees}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('salary.monthlyTotal')}</p>
                  <p className="text-2xl font-bold">${(statistics.monthlyTotal / 1000).toFixed(0)}K</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('salary.averageSalaryLabel')}</p>
                  <p className="text-2xl font-bold">${(statistics.averageSalary / 1000).toFixed(0)}K</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('salary.growthRate')}</p>
                  <p className="text-2xl font-bold">+{statistics.growthRate?.toFixed(1)}%</p>
                </div>
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('salary.salaryTrend')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salaryTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, t('salary.totalSalary')]} />
                <Bar dataKey="total" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('salary.gradeDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gradeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('salary.gradeStatistics')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-900">{t('salary.grades')}</th>
                  <th className="text-left p-4 font-medium text-gray-900">{t('salary.employeeCount')}</th>
                  <th className="text-left p-4 font-medium text-gray-900">{t('salary.totalSalary')}</th>
                  <th className="text-left p-4 font-medium text-gray-900">{t('salary.averageSalary')}</th>
                  <th className="text-left p-4 font-medium text-gray-900">{t('salary.percentage')}</th>
                </tr>
              </thead>
              <tbody>
                {gradeDistribution.map((grade, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <span className="font-medium">{grade.name}</span>
                    </td>
                    <td className="p-4">
                      <span>{grade.value}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium">${grade.salary.toLocaleString()}</span>
                    </td>
                    <td className="p-4">
                      <span>${(grade.salary / grade.value).toLocaleString()}</span>
                    </td>
                    <td className="p-4">
                      <span>{statistics.totalEmployees > 0 ? ((grade.value / statistics.totalEmployees) * 100).toFixed(1) : 0}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPeriodDialog} onOpenChange={setShowPeriodDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('salary.selectPeriod')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.startDate')}</label>
              <Input 
                type="date" 
                value={selectedPeriod.startDate}
                onChange={(e) => setSelectedPeriod({...selectedPeriod, startDate: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('salary.endDate')}</label>
              <Input 
                type="date" 
                value={selectedPeriod.endDate}
                onChange={(e) => setSelectedPeriod({...selectedPeriod, endDate: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPeriodDialog(false)}>{t('common.cancel')}</Button>
            <Button onClick={handlePeriodSelect}>{t('common.apply')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalaryReports;