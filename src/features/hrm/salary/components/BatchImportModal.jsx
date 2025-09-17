import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx';
import { Search, Users, Settings } from 'lucide-react';
import apiClient from '../../../../services/api';

const BatchImportModal = ({ isOpen, onClose, onImport, salaryGrades }) => {
  const { t } = useTranslation();
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [brands, setBrands] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [batchSettings, setBatchSettings] = useState({
    salary_grade_id: '',
    effective_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);



  useEffect(() => {
    if (isOpen) {
      loadBrands();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedBrand) {
      loadWorkspaces();
    }
  }, [selectedBrand]);

  useEffect(() => {
    if (selectedWorkspace) {
      loadMembers();
    }
  }, [selectedWorkspace]);



  const loadBrands = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getBrands();
      setBrands(response.data || []);
    } catch (error) {
      console.error('載入 Brand 失敗:', error);
      // 使用模擬資料
      setBrands([
        { id: '1', brand_name: 'Brand A' },
        { id: '2', brand_name: 'Brand B' },
        { id: '3', brand_name: 'Brand C' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getBrandWorkspaces(selectedBrand);
      setWorkspaces(response.data || []);
      setSelectedWorkspace('');
      setMembers([]);
    } catch (error) {
      console.error('載入 Workspace 失敗:', error);
      // 使用模擬資料
      setWorkspaces([
        { id: 'ws1', name: 'Workspace 1' },
        { id: 'ws2', name: 'Workspace 2' },
        { id: 'ws3', name: 'Workspace 3' }
      ]);
      setSelectedWorkspace('');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getWorkspaceMembers(selectedWorkspace);
      const membersData = response.data || [];
      // Normalize member data to ensure consistent ID field
      const normalizedMembers = membersData.map(member => ({
        ...member,
        member_id: member.member_id || member.id || member.user_id || `member-${Date.now()}-${Math.random()}`
      }));
      setMembers(normalizedMembers);
      setSelectedMembers(new Set()); // Reset selection when loading new members
    } catch (error) {
      console.error('載入 Members 失敗:', error);
      // 使用模擬資料
      setMembers([
        { member_id: `emp1-${Date.now()}-1`, name: '張小明', email: 'zhang@example.com', role: 'agent' },
        { member_id: `emp2-${Date.now()}-2`, name: '李小華', email: 'li@example.com', role: 'agent' },
        { member_id: `emp3-${Date.now()}-3`, name: '王大明', email: 'wang@example.com', role: 'team_leader' },
        { member_id: `emp4-${Date.now()}-4`, name: '陳小美', email: 'chen@example.com', role: 'manager' }
      ]);
      setSelectedMembers(new Set());
    } finally {
      setLoading(false);
    }
  };



  const handleSelectMember = (memberId) => {
    setSelectedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedMembers.size === members.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(members.map(m => m.member_id)));
    }
  };

  const handleImport = async () => {
    if (selectedMembers.size === 0) {
      alert(t('salary.pleaseSelectEmployees'));
      return;
    }
    if (!batchSettings.salary_grade_id) {
      alert(t('salary.pleaseSelectGrade'));
      return;
    }

    const selectedMemberData = members.filter(m => {
      const memberId = m.member_id || m.id || `fallback-${members.indexOf(m)}`;
      return selectedMembers.has(memberId);
    });

    const importData = selectedMemberData.map(member => ({
      member_id: member.member_id || member.id,
      member_name: member.name,
      member_email: member.email,
      salary_grade_id: batchSettings.salary_grade_id,
      effective_date: batchSettings.effective_date
    }));

    try {
      await onImport(importData);
      alert(`${t('salary.successfullyImported')} ${importData.length} ${t('salary.employees')}`);
      handleClose();
    } catch (error) {
      console.error('Import failed:', error);
      alert(t('salary.importFailed'));
    }
  };

  const handleClose = () => {
    setSelectedBrand('');
    setSelectedWorkspace('');
    setBrands([]);
    setWorkspaces([]);
    setMembers([]);
    setSelectedMembers(new Set());
    setBatchSettings({
      salary_grade_id: '',
      effective_date: new Date().toISOString().split('T')[0]
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t('salary.batchImport')}</DialogTitle>
          <DialogDescription>
            {t('salary.batchImportDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6 h-[70vh]">
          {/* 左側：員工選擇 */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t('salary.selectEmployees')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              {/* Brand 選擇 */}
              <div className="w-full">
                <label className="text-sm font-medium mb-2 block">{t('common.brand')}</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  style={{ width: '100%', height: 'auto' }}
                  value={selectedBrand || ''}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  disabled={loading}
                >
                  <option value="">{t('salary.selectBrand')}</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>
                      {brand.brand_name || brand.name || `Brand ${brand.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Workspace 選擇 */}
              <div className="w-full">
                <label className="text-sm font-medium mb-2 block">{t('common.workspace')}</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  style={{ width: '100%', height: 'auto' }}
                  value={selectedWorkspace || ''}
                  onChange={(e) => setSelectedWorkspace(e.target.value)}
                  disabled={!selectedBrand || loading}
                >
                  <option value="">{t('salary.selectWorkspace')}</option>
                  {workspaces.map(workspace => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name || workspace.workspace_name || `Workspace ${workspace.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* 員工列表 */}
              {selectedWorkspace && (
                <div className="flex-1 border rounded-md overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b">
                      <button
                        type="button"
                        className="flex items-center gap-2 text-sm font-medium hover:text-blue-600"
                        onClick={(e) => {
                          e.preventDefault();
                          handleSelectAll();
                        }}
                      >
                        <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                          selectedMembers.size === members.length && members.length > 0
                            ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                        }`}>
                          {selectedMembers.size === members.length && members.length > 0 && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        {t('salary.selectAll')} ({selectedMembers.size}/{members.length})
                      </button>
                    </div>
                    <div className="overflow-y-auto max-h-96">
                      {loading ? (
                        <div className="p-4 text-center text-gray-500">{t('salary.loading')}</div>
                      ) : members.length > 0 ? (
                        members.map((member, index) => {
                          const memberId = member.member_id || member.id || `fallback-${index}`;
                          const isSelected = selectedMembers.has(memberId);
                          return (
                            <div 
                              key={`member-${memberId}-${index}`}
                              className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                                isSelected ? 'bg-blue-50 border-blue-200' : ''
                              }`}
                              onClick={() => handleSelectMember(memberId)}
                            >
                              <div className="flex items-center gap-3">
                                <div 
                                  className={`w-4 h-4 border-2 rounded flex items-center justify-center cursor-pointer ${
                                    isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectMember(memberId);
                                  }}
                                >
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{member.name}</div>
                                  <div className="text-sm text-gray-500">{member.email}</div>
                                  <div className="text-xs text-gray-400">
                                    ID: {memberId} | {t('salary.role')}: {member.role || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          {selectedWorkspace ? t('salary.noMatchingEmployees') : t('salary.selectWorkspaceFirst')}
                        </div>
                      )}
                    </div>
                  </div>
              )}
            </CardContent>
          </Card>

          {/* 右側：薪資設定 */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {t('salary.salarySettings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              {/* 已選擇的員工預覽 */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('salary.selectedEmployees')} ({selectedMembers.size})
                </label>
                <div className="border rounded-md p-3 bg-gray-50 max-h-32 overflow-y-auto">
                  {selectedMembers.size > 0 ? (
                    Array.from(selectedMembers).map((memberId, index) => {
                      const member = members.find(m => m.member_id === memberId);
                      return member ? (
                        <div key={`selected-${memberId}-${index}`} className="text-sm py-1">
                          {member.name} ({member.email})
                        </div>
                      ) : null;
                    })
                  ) : (
                    <div className="text-sm text-gray-500">{t('salary.noEmployeesSelected')}</div>
                  )}
                </div>
              </div>

              {/* 薪資等級選擇 */}
              <div className="w-full">
                <label className="text-sm font-medium mb-2 block">{t('salary.grades')} *</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  style={{ width: '100%', height: 'auto' }}
                  value={batchSettings.salary_grade_id}
                  onChange={(e) => setBatchSettings({
                    ...batchSettings, 
                    salary_grade_id: e.target.value
                  })}
                >
                  <option value="">{t('salary.selectGrade')}</option>
                  {salaryGrades.map(grade => (
                    <option key={grade.id} value={grade.id}>
                      {grade.grade_name} - ${grade.base_salary?.toLocaleString()}
                    </option>
                  ))}
                </select>
                {batchSettings.salary_grade_id && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-md">
                    {(() => {
                      const selectedGrade = salaryGrades.find(g => g.id === batchSettings.salary_grade_id);
                      return selectedGrade ? (
                        <div className="text-sm">
                          <div className="font-medium">{selectedGrade.grade_name}</div>
                          <div className="text-gray-600">
                            {t('salary.baseSalary')}: ${selectedGrade.base_salary?.toLocaleString()}
                          </div>
                          {selectedGrade.hourly_rate && (
                            <div className="text-gray-600">
                              {t('salary.hourlyRate')}: ${selectedGrade.hourly_rate}
                            </div>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>

              {/* 生效日期 */}
              <div>
                <label className="text-sm font-medium mb-2 block">{t('salary.effectiveDate')} *</label>
                <Input
                  type="date"
                  value={batchSettings.effective_date}
                  onChange={(e) => setBatchSettings({
                    ...batchSettings, 
                    effective_date: e.target.value
                  })}
                />
              </div>

              {/* 匯入預覽 */}
              {selectedMembers.size > 0 && batchSettings.salary_grade_id && (
                <div className="border rounded-md p-4 bg-green-50">
                  <div className="text-sm font-medium text-green-800 mb-2">{t('salary.importPreview')}</div>
                  <div className="text-sm text-green-700 space-y-1">
                    <div>{t('salary.willSetSalaryFor')} {selectedMembers.size} {t('salary.employeesSetSalary')}</div>
                    <div>{t('salary.grades')}: {salaryGrades.find(g => g.id === batchSettings.salary_grade_id)?.grade_name}</div>
                    <div>{t('salary.effectiveDate')}: {batchSettings.effective_date}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleImport}
            disabled={selectedMembers.size === 0 || !batchSettings.salary_grade_id}
          >
            {t('salary.importSettings')} ({selectedMembers.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchImportModal;