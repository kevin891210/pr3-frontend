import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Settings, Edit, Trash2, Save, X } from 'lucide-react';
import apiClient from '../../../../services/api';
import EmptyState from '../../../../components/ui/empty-state';
import SearchableSelect from '../../../../components/ui/searchable-select';

const AgentLeaveConfig = () => {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]); // 改為多選
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [agentConfigs, setAgentConfigs] = useState([]);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [editingConfigs, setEditingConfigs] = useState({});
  const [alertDialog, setAlertDialog] = useState({ open: false, type: 'info', title: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    loadBrands();
    loadLeaveTypes();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      loadBrandMembers(selectedBrand);
    }
  }, [selectedBrand]);

  useEffect(() => {
    if (selectedMembers.length === 1) {
      loadAgentConfigs(selectedMembers[0]);
    } else if (selectedMembers.length === 0) {
      setAgentConfigs([]);
      setEditingConfigs({});
    } else {
      // 多選時顯示預設值
      const configs = {};
      leaveTypes.forEach(type => {
        configs[type.id] = {
          id: null,
          days_per_year: type.days_per_year || 14
        };
      });
      setEditingConfigs(configs);
      setAgentConfigs([]);
    }
  }, [selectedMembers, leaveTypes]);

  const loadBrands = async () => {
    try {
      const response = await apiClient.getBrands();
      const brandsData = response.data || response;
      setBrands(Array.isArray(brandsData) ? brandsData : []);
    } catch (error) {
      console.error('Failed to load brands:', error);
      setBrands([]);
    }
  };

  const loadBrandMembers = async (brandId) => {
    try {
      const response = await apiClient.getBrandMembers(brandId);
      const membersData = response.data || response;
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error('Failed to load members:', error);
      setMembers([]);
    }
  };

  const loadLeaveTypes = async () => {
    try {
      const response = await apiClient.getLeaveTypes();
      const typesData = response.data || response;
      setLeaveTypes(Array.isArray(typesData) ? typesData : []);
    } catch (error) {
      console.error('Failed to load leave types:', error);
      setLeaveTypes([]);
    }
  };

  const loadAgentConfigs = async (memberId) => {
    try {
      setLoading(true);
      const response = await apiClient.getAgentLeaveConfigs(memberId);
      const configsData = response.data || response;
      setAgentConfigs(Array.isArray(configsData) ? configsData : []);

      // 初始化編輯狀態
      const configs = {};
      if (Array.isArray(configsData) && configsData.length > 0) {
        configsData.forEach(config => {
          configs[config.leave_type_id] = {
            id: config.id,
            days_per_year: config.days_per_year
          };
        });
      } else {
        // 如果沒有配置，使用預設值
        leaveTypes.forEach(type => {
          configs[type.id] = {
            id: null,
            days_per_year: type.days_per_year || 14
          };
        });
      }
      setEditingConfigs(configs);
    } catch (error) {
      console.error('Failed to load agent configs:', error);
      setAgentConfigs([]);
      // 初始化為預設值
      const configs = {};
      leaveTypes.forEach(type => {
        configs[type.id] = {
          id: null,
          days_per_year: type.days_per_year || 14
        };
      });
      setEditingConfigs(configs);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (leaveTypeId, days) => {
    setEditingConfigs(prev => ({
      ...prev,
      [leaveTypeId]: {
        ...prev[leaveTypeId],
        days_per_year: parseFloat(days) || 0
      }
    }));
  };

  const handleSaveConfigs = async () => {
    if (selectedMembers.length === 0) {
      setAlertDialog({
        open: true,
        type: 'warning',
        title: 'Warning',
        message: 'Please select at least one member'
      });
      return;
    }

    try {
      setLoading(true);

      // 準備批次更新的資料
      const configs = Object.keys(editingConfigs).map(leaveTypeId => ({
        leave_type_id: leaveTypeId,
        days_per_year: editingConfigs[leaveTypeId].days_per_year
      }));

      // 為每個選中的 member 批次建立配置
      const promises = selectedMembers.map(memberId =>
        apiClient.createBatchAgentLeaveConfigs(memberId, configs)
      );

      await Promise.all(promises);

      setAlertDialog({
        open: true,
        type: 'success',
        title: 'Success',
        message: `Successfully saved configurations for ${selectedMembers.length} member(s)`
      });

      // 如果只選了一個，重新載入配置
      if (selectedMembers.length === 1) {
        await loadAgentConfigs(selectedMembers[0]);
      }
    } catch (error) {
      setAlertDialog({
        open: true,
        type: 'danger',
        title: 'Error',
        message: `Failed to save configurations: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBrandChange = (brandId) => {
    setSelectedBrand(brandId);
    setSelectedMembers([]);
    setMembers([]);
    setAgentConfigs([]);
    setEditingConfigs({});
    setSelectAll(false);
  };

  const handleMemberToggle = (memberId) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(members.map(m => m.id));
    }
    setSelectAll(!selectAll);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Agent Leave Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Brand Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Select Brand</label>
              <select
                className="w-full p-2 border rounded-md"
                value={selectedBrand}
                onChange={(e) => handleBrandChange(e.target.value)}
              >
                <option value="">Choose a brand...</option>
                {brands.filter(brand => brand.is_active).map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>

            {/* Member Selection */}
            {selectedBrand && members.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Select Agents/Members</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="select-all"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="select-all" className="text-sm text-gray-600 cursor-pointer">
                      Select All ({selectedMembers.length}/{members.length})
                    </label>
                  </div>
                </div>
                <div className="border rounded-md max-h-64 overflow-y-auto bg-white">
                  {members.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer"
                      onClick={() => handleMemberToggle(member.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={() => handleMemberToggle(member.id)}
                        className="rounded border-gray-300"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {member.name || member.username || member.email || member.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.role || 'Member'} {member.email && `• ${member.email}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Leave Type Configuration */}
            {selectedMembers.length > 0 && leaveTypes.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-semibold">
                    Leave Type Allowances
                    {selectedMembers.length > 1 && (
                      <span className="ml-2 text-sm font-normal text-gray-600">
                        (Applying to {selectedMembers.length} members)
                      </span>
                    )}
                  </h3>
                  <Button
                    onClick={handleSaveConfigs}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Configuration
                  </Button>
                </div>

                <div className="space-y-3">
                  {leaveTypes.map(type => (
                    <Card key={type.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{type.name}</div>
                          <div className="text-sm text-gray-500">
                            Default: {type.days_per_year || 14} days/year
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={editingConfigs[type.id]?.days_per_year || type.days_per_year || 14}
                            onChange={(e) => handleConfigChange(type.id, e.target.value)}
                            className="w-24 text-right"
                            disabled={loading}
                          />
                          <span className="text-sm text-gray-500">days</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!selectedBrand && (
              <EmptyState
                type="leave"
                title="No Brand Selected"
                description="Please select a brand to view and configure agent leave allowances."
              />
            )}

            {selectedBrand && !selectedMember && members.length === 0 && (
              <EmptyState
                type="leave"
                title="No Members Found"
                description="No members found for this brand."
              />
            )}

            {selectedBrand && selectedMembers.length === 0 && members.length > 0 && (
              <EmptyState
                type="leave"
                title="No Members Selected"
                description="Please select one or more members to configure their leave allowances."
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alert Dialog */}
      <Dialog open={alertDialog.open} onOpenChange={(open) => !open && setAlertDialog({ open: false, type: 'info', title: '', message: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{alertDialog.title}</DialogTitle>
          </DialogHeader>
          <p>{alertDialog.message}</p>
          <DialogFooter>
            <Button onClick={() => setAlertDialog({ open: false, type: 'info', title: '', message: '' })}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentLeaveConfig;
