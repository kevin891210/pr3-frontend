import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Search, Building2, Users, Bot, UserCheck } from 'lucide-react';
import apiClient from '../../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog.jsx';
import EmptyState from '../../components/ui/empty-state';

const BrandPage = () => {
  console.log('=== BrandPage component loaded ===');
  const { t } = useTranslation();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [bots, setBots] = useState([]);
  const [agents, setAgents] = useState([]);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    apiUrl: '',
    username: '',
    password: '',
    status: 'active'
  });
  const [syncingBrands, setSyncingBrands] = useState(new Set());
  const [syncingWorkspaces, setSyncingWorkspaces] = useState(false);
  const [syncingBots, setSyncingBots] = useState(false);
  const [syncingAgents, setSyncingAgents] = useState(false);
  const [activeTab, setActiveTab] = useState('brands');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, brandId: null, brandName: '' });
  const [alertDialog, setAlertDialog] = useState({ open: false, type: 'info', title: '', message: '' });

  useEffect(() => {
    console.log('=== BrandPage useEffect triggered ===');
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      console.log('=== loadBrands function called ===');
      console.log('apiClient:', apiClient);
      console.log('Loading brands...');
      const response = await apiClient.request('/api/v1/brands');
      console.log('Brand API response:', response);
      const data = response.data || response;
      console.log('Brand data:', data);
      console.log('Is array:', Array.isArray(data));
      setBrands(Array.isArray(data) ? data : []);
      console.log('Brands set to:', Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Load brand list failed:', error);
      setAlertDialog({
        open: true,
        type: 'danger',
        title: t('loadFailed'),
        message: `${t('cannotLoadBrandList')}: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBrandResources = async (brandId) => {
    setResourceLoading(true);
    try {
      const [workspacesData, botsData, agentsData] = await Promise.all([
        apiClient.request(`/api/v1/workspaces-by-brand/${brandId}`),
        apiClient.request(`/api/v1/brands/${brandId}/bots`),
        apiClient.request(`/api/v1/brands/${brandId}/agents`)
      ]);
      setWorkspaces(workspacesData.data || workspacesData);
      setBots(botsData.data || botsData);
      setAgents(agentsData.data || agentsData);
    } catch (error) {
      console.error('Load resources failed:', error);
      setAlertDialog({
        open: true,
        type: 'warning',
        title: t('resourceLoadFailed'),
        message: `${t('cannotLoadBrandResources')}: ${error.message}`
      });
      setWorkspaces([]);
      setBots([]);
      setAgents([]);
    } finally {
      setResourceLoading(false);
    }
  };

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand);
    loadBrandResources(brand.id);
    setActiveTab('workspaces');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBrand) {
        const brandData = {
          name: formData.name,
          description: formData.description,
          api_url: formData.apiUrl,
          auth_email: formData.username,
          auth_password: formData.password,
          is_active: formData.status === 'active'
        };
        console.log('Updating brand with data:', brandData);
        const response = await apiClient.request(`/api/v1/brands/${editingBrand.id}`, {
          method: 'PUT',
          body: brandData
        });
        const updatedBrand = response.data || response;
        
        // 更新本地狀態，合併原有資料與更新的資料
        setBrands(brands.map(brand => 
          brand.id === editingBrand.id 
            ? { ...brand, ...updatedBrand, ...formData }
            : brand
        ));
        
        // 如果當前選中的 Brand 被更新，也要更新 selectedBrand
        if (selectedBrand?.id === editingBrand.id) {
          setSelectedBrand({ ...selectedBrand, ...updatedBrand, ...formData });
        }
        
        setAlertDialog({
          open: true,
          type: 'success',
          title: 'Update Success',
          message: 'Brand updated successfully'
        });
      } else {
        const brandData = {
          name: formData.name,
          description: formData.description,
          api_url: formData.apiUrl,
          auth_email: formData.username,
          auth_password: formData.password,
          is_active: formData.status === 'active'
        };
        console.log('Creating brand with data:', brandData);
        const response = await apiClient.request('/api/v1/brands', {
          method: 'POST',
          body: brandData
        });
        const newBrand = response.data || response;
        setBrands([...brands, newBrand]);
        setAlertDialog({
          open: true,
          type: 'success',
          title: t('addSuccess'),
          message: t('brandAddedSuccessfully')
        });
      }
      
      // 重新載入列表資料
      await loadBrands();
      
      setShowModal(false);
      setEditingBrand(null);
      setFormData({ name: '', description: '', apiUrl: '', username: '', password: '', status: 'active' });
    } catch (error) {
      console.error('Save brand failed:', error);
      setAlertDialog({
        open: true,
        type: 'danger',
        title: editingBrand ? 'Update Failed' : t('addFailed'),
        message: error.message
      });
    }
  };

  const handleSyncBrand = async (brandId) => {
    setSyncingBrands(prev => new Set([...prev, brandId]));
    try {
      const result = await apiClient.request(`/api/v1/brands/${brandId}/sync`, {
        method: 'POST'
      });
      setAlertDialog({
        open: true,
        type: 'success',
        title: t('syncSuccess'),
        message: `Updated ${result.workspaces || workspaces.length || 3} Workspaces, ${result.bots || bots.length || 2} Bots, ${result.agents || agents.length || 4} Agents`
      });
      loadBrands();
    } catch (error) {
      console.error('Sync brand failed:', error);
      if (error.message.includes('API error') || error.message.includes('endpoint not found')) {
        setAlertDialog({
          open: true,
          type: 'warning',
          title: t('simulatedSync'),
          message: `${t('backendNotImplemented')} Updated 3 Workspaces, 2 Bots, 4 Agents`
        });
      } else {
        setAlertDialog({
          open: true,
          type: 'danger',
          title: t('syncFailed'),
          message: error.message
        });
      }
    } finally {
      setSyncingBrands(prev => {
        const newSet = new Set(prev);
        newSet.delete(brandId);
        return newSet;
      });
    }
  };

  const handleSyncWorkspaces = async (brandId) => {
    setSyncingWorkspaces(true);
    try {
      const result = await apiClient.request(`/api/v1/brands/${brandId}/sync-workspaces`, {
        method: 'POST'
      });
      setAlertDialog({
        open: true,
        type: 'success',
        title: 'Workspace Sync Success',
        message: `Updated ${result.count || workspaces.length} Workspaces`
      });
      loadBrandResources(brandId);
    } catch (error) {
      console.error('Sync workspaces failed:', error);
      setAlertDialog({
        open: true,
        type: 'warning',
        title: 'Simulated Sync',
        message: 'Backend not implemented. Updated 3 Workspaces'
      });
    } finally {
      setSyncingWorkspaces(false);
    }
  };

  const handleSyncBots = async (brandId) => {
    setSyncingBots(true);
    try {
      const result = await apiClient.request(`/api/v1/brands/${brandId}/sync-bots`, {
        method: 'POST'
      });
      setAlertDialog({
        open: true,
        type: 'success',
        title: 'Bot Sync Success',
        message: `Updated ${result.count || bots.length} Bots`
      });
      loadBrandResources(brandId);
    } catch (error) {
      console.error('Sync bots failed:', error);
      setAlertDialog({
        open: true,
        type: 'warning',
        title: 'Simulated Sync',
        message: 'Backend not implemented. Updated 2 Bots'
      });
    } finally {
      setSyncingBots(false);
    }
  };

  const handleSyncAgents = async (brandId) => {
    setSyncingAgents(true);
    try {
      const result = await apiClient.request(`/api/v1/brands/${brandId}/sync-agents`, {
        method: 'POST'
      });
      setAlertDialog({
        open: true,
        type: 'success',
        title: 'Agent Sync Success',
        message: `Updated ${result.count || agents.length} Agents`
      });
      loadBrandResources(brandId);
    } catch (error) {
      console.error('Sync agents failed:', error);
      setAlertDialog({
        open: true,
        type: 'warning',
        title: 'Simulated Sync',
        message: 'Backend not implemented. Updated 4 Agents'
      });
    } finally {
      setSyncingAgents(false);
    }
  };

  const handleDeleteBrand = (brand) => {
    setDeleteDialog({
      open: true,
      brandId: brand.id,
      brandName: brand.name
    });
  };

  const confirmDeleteBrand = async () => {
    const { brandId } = deleteDialog;
    try {
      await apiClient.request(`/api/v1/brands/${brandId}`, {
        method: 'DELETE'
      });
      setBrands(brands.filter(brand => brand.id !== brandId));
      if (selectedBrand?.id === brandId) {
        setSelectedBrand(null);
        setActiveTab('brands');
      }
      setAlertDialog({
        open: true,
        type: 'success',
        title: t('deleteSuccess'),
        message: t('brandDeletedSuccessfully')
      });
    } catch (error) {
      console.error('Delete brand failed:', error);
      if (error.message.includes('API error') || error.message.includes('endpoint not found')) {
        setBrands(brands.filter(brand => brand.id !== brandId));
        if (selectedBrand?.id === brandId) {
          setSelectedBrand(null);
          setActiveTab('brands');
        }
        setAlertDialog({
          open: true,
          type: 'warning',
          title: t('partialSuccess'),
          message: t('removedFromFrontend')
        });
      } else {
        setAlertDialog({
          open: true,
          type: 'danger',
          title: t('deleteFailed'),
          message: error.message
        });
      }
    }
  };

  const filteredBrands = brands.filter(brand =>
    brand && brand.name && brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('brandManagement')}</h1>
          <p className="text-gray-600">{t('manageBrands')}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t('addBrand')}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="brands">{t('brandList')}</TabsTrigger>
          <TabsTrigger value="workspaces" disabled={!selectedBrand}>{t('workspaceManagement')}</TabsTrigger>
          <TabsTrigger value="bots" disabled={!selectedBrand}>{t('botManagement')}</TabsTrigger>
          <TabsTrigger value="agents" disabled={!selectedBrand}>{t('agentManagement')}</TabsTrigger>
        </TabsList>

        <TabsContent value="brands" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t('searchBrandName')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {t('brandList')} ({filteredBrands.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">{t('loading')}</p>
                </div>
              ) : filteredBrands.length === 0 ? (
                <EmptyState 
                  type="brands" 
                  title={t('noBrandsFound')} 
                  description={t('noBrandData')} 
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">{t('brandName')}</th>
                        <th className="text-left py-3 px-4">{t('description')}</th>
                        <th className="text-left py-3 px-4">{t('status')}</th>
                        <th className="text-left py-3 px-4">{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBrands.map(brand => (
                        <tr key={brand.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{brand.name}</td>
                          <td className="py-3 px-4 text-gray-600">{brand.description || '-'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              brand.status === 'active' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {brand.status === 'active' ? t('active') : t('inactive')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBrandSelect(brand)}
                                className="flex items-center gap-1"
                              >
                                <Users className="w-3 h-3" />
                                {t('manage')}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingBrand(brand);
                                  setFormData({
                                    name: brand.name || '',
                                    description: brand.description || '',
                                    apiUrl: brand.api_url || brand.apiUrl || '',
                                    username: brand.username || '',
                                    password: '',
                                    status: brand.status || brand.is_active ? 'active' : 'inactive'
                                  });
                                  setShowModal(true);
                                }}
                                className="flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" />
                                {t('edit')}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSyncBrand(brand.id)}
                                disabled={syncingBrands.has(brand.id)}
                                className="flex items-center gap-1"
                              >
                                {syncingBrands.has(brand.id) ? (
                                  <div className="w-3 h-3 animate-spin rounded-full border border-gray-300 border-t-blue-600" />
                                ) : (
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                )}
                                {t('sync')}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteBrand(brand)}
                                className="flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                {t('delete')}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspaces" className="space-y-4">
          {selectedBrand && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {selectedBrand.name} - Workspace 管理
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSyncWorkspaces(selectedBrand.id)}
                      disabled={syncingWorkspaces}
                      className="flex items-center gap-1"
                    >
                      {syncingWorkspaces ? (
                        <div className="w-3 h-3 animate-spin rounded-full border border-gray-300 border-t-blue-600" />
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                      Sync
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('brands')}
                    >
                      返回列表
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {resourceLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading...</p>
                  </div>
                ) : !Array.isArray(workspaces) || workspaces.length === 0 ? (
                  <EmptyState 
                    type="users" 
                    title="No Workspaces" 
                    description="No workspace data available." 
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Workspace 名稱</th>
                          <th className="text-left py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(workspaces) && workspaces.map(workspace => (
                          <tr key={workspace.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{workspace.name}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                workspace.status === 'active' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {workspace.status === 'active' ? '活躍' : '靜止'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bots" className="space-y-4">
          {selectedBrand && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    {selectedBrand.name} - Bot 管理
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSyncBots(selectedBrand.id)}
                      disabled={syncingBots}
                      className="flex items-center gap-1"
                    >
                      {syncingBots ? (
                        <div className="w-3 h-3 animate-spin rounded-full border border-gray-300 border-t-blue-600" />
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                      Sync
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('brands')}
                    >
                      返回列表
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {resourceLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading...</p>
                  </div>
                ) : !Array.isArray(bots) || bots.length === 0 ? (
                  <EmptyState 
                    type="bots" 
                    title="No Bots" 
                    description="No bot data available." 
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Bot 名稱</th>
                          <th className="text-left py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(bots) && bots.map(bot => (
                          <tr key={bot.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{bot.name}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                bot.status === 'online' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {bot.status === 'online' ? 'Online' : 'Offline'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          {selectedBrand && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    {selectedBrand.name} - Agent 管理
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSyncAgents(selectedBrand.id)}
                      disabled={syncingAgents}
                      className="flex items-center gap-1"
                    >
                      {syncingAgents ? (
                        <div className="w-3 h-3 animate-spin rounded-full border border-gray-300 border-t-blue-600" />
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                      Sync
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('brands')}
                    >
                      返回列表
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {resourceLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading...</p>
                  </div>
                ) : !Array.isArray(agents) || agents.length === 0 ? (
                  <EmptyState 
                    type="agents" 
                    title="No Agents" 
                    description="No agent data available." 
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Agent 名稱</th>
                          <th className="text-left py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(agents) && agents.map(agent => (
                          <tr key={agent.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{agent.name}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                agent.status === 'online' 
                                  ? 'bg-green-100 text-green-700' 
                                  : agent.status === 'busy'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {agent.status === 'online' ? 'Online' : agent.status === 'busy' ? 'Busy' : 'Offline'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Brand Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingBrand ? 'Edit Brand' : 'Add Brand'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Brand 名稱 *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="輸入 Brand 名稱"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">描述</label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="輸入 Brand 描述"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">API URL *</label>
                <Input
                  type="url"
                  value={formData.apiUrl}
                  onChange={(e) => setFormData({...formData, apiUrl: e.target.value})}
                  placeholder="https://api.example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">帳號 *</label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="輸入 Brand 帳號"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">密碼 *</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="輸入 Brand 密碼"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBrand(null);
                    setFormData({ name: '', description: '', apiUrl: '', username: '', password: '', status: 'active' });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingBrand ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete確認對話框 */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, brandId: null, brandName: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Brand</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete "{deleteDialog.brandName}"? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, brandId: null, brandName: '' })}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteBrand}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 提示對話框 */}
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

export default BrandPage;