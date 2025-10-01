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
  const [selectedMember, setSelectedMember] = useState(null);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [agentConfigs, setAgentConfigs] = useState([]);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [editingConfigs, setEditingConfigs] = useState({});
  const [alertDialog, setAlertDialog] = useState({ open: false, type: 'info', title: '', message: '' });
  const [loading, setLoading] = useState(false);

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
    if (selectedMember) {
      loadAgentConfigs(selectedMember);
    }
  }, [selectedMember]);

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
    if (!selectedMember) {
      setAlertDialog({
        open: true,
        type: 'warning',
        title: 'Warning',
        message: 'Please select a member first'
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

      await apiClient.createBatchAgentLeaveConfigs(selectedMember, configs);

      setAlertDialog({
        open: true,
        type: 'success',
        title: 'Success',
        message: 'Agent leave configurations saved successfully'
      });

      // 重新載入配置
      await loadAgentConfigs(selectedMember);
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
    setSelectedMember(null);
    setMembers([]);
    setAgentConfigs([]);
    setEditingConfigs({});
  };

  const handleMemberChange = (memberId) => {
    setSelectedMember(memberId);
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
            {selectedBrand && (
              <div>
                <label className="block text-sm font-medium mb-2">Select Agent/Member</label>
                <SearchableSelect
                  value={selectedMember || ''}
                  onChange={handleMemberChange}
                  placeholder="Select a member..."
                  searchPlaceholder="Search members..."
                  options={members.map(member => ({
                    value: member.id,
                    label: `${member.name || member.username || member.email || member.id} (${member.role || 'Member'})`
                  }))}
                />
              </div>
            )}

            {/* Leave Type Configuration */}
            {selectedMember && leaveTypes.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-semibold">Leave Type Allowances</h3>
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

            {selectedBrand && !selectedMember && members.length > 0 && (
              <EmptyState
                type="leave"
                title="No Member Selected"
                description="Please select a member to configure their leave allowances."
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
