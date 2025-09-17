import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Monitor, RefreshCw, Users, Clock, MessageSquare, ChevronUp, ChevronDown
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import apiClient from '../../services/api';

const AgentMonitorV2Page = () => {
  const { t } = useTranslation();
  const [brands, setBrands] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [teams, setTeams] = useState([]);
  const [teamsCapacity, setTeamsCapacity] = useState({});
  const [collapsedTeams, setCollapsedTeams] = useState({});
  const [activeTab, setActiveTab] = useState('teams');
  const [teamFilters, setTeamFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5);

  const [error, setError] = useState(null);
  
  const intervalRef = useRef(null);

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      loadWorkspaces(selectedBrand);
    }
  }, [selectedBrand]);

  useEffect(() => {
    if (selectedBrand && selectedWorkspace) {
      loadTeams();
    }
  }, [selectedBrand, selectedWorkspace]);

  useEffect(() => {
    if (teams.length > 0) {
      loadAllTeamsCapacity();
    }
  }, [teams]);

  useEffect(() => {
    if (teams.length > 0 && Object.keys(teamsCapacity).length > 0) {
      // 初始化 team filters - 預設把 online agent 為 0 的 Team 取消勾選
      const filters = {};
      teams.forEach(team => {
        const capacity = teamsCapacity[team.id];
        const onlineAgentCount = capacity?.online_agents?.length || 0;
        filters[team.id] = onlineAgentCount > 0;
      });
      setTeamFilters(filters);
    }
  }, [teams, teamsCapacity]);

  useEffect(() => {
    if (autoRefresh && teams.length > 0) {
      const intervalMs = refreshInterval * 60 * 1000;
      intervalRef.current = setInterval(() => {
        loadAllTeamsCapacity();
      }, intervalMs);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, teams]);

  const loadBrands = async () => {
    try {
      setError(null);
      const response = await apiClient.getMonitorBrands({}, false);
      const data = response.data || response;
      setBrands(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('載入 Brand 失敗:', error);
      setError('載入 Brand 列表失敗: ' + error.message);
      setBrands([]);
    }
  };

  const loadWorkspaces = async (brandId) => {
    try {
      setError(null);
      const response = await apiClient.getBrandWorkspaces(brandId);
      const data = response.data || response;
      setWorkspaces(Array.isArray(data) ? data : []);
      setSelectedWorkspace('');
    } catch (error) {
      console.error('載入 Workspace 失敗:', error);
      setError('載入 Workspace 列表失敗: ' + error.message);
      setWorkspaces([]);
      setSelectedWorkspace('');
    }
  };

  const loadTeams = async () => {
    if (!selectedBrand || !selectedWorkspace) return;
    
    setLoading(true);
    try {
      setError(null);
      const brand = brands.find(b => b.id === selectedBrand);
      if (!brand || !brand.api_url) {
        throw new Error('Brand API URL 未設定');
      }
      
      const brandToken = await getBrandToken(selectedBrand);
      if (!brandToken) {
        throw new Error('無法取得有效的 Brand Token');
      }
      
      const response = await apiClient.getThirdPartyTeams(
        brand.api_url, 
        brandToken, 
        selectedWorkspace
      );
      
      if (response.success && response.data) {
        setTeams(response.data);
      } else {
        throw new Error('API 回應格式錯誤');
      }
    } catch (error) {
      console.error('載入 Teams 失敗:', error);
      setError('載入 Teams 失敗: ' + error.message);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllTeamsCapacity = async () => {
    if (!selectedBrand || teams.length === 0) return;
    
    setLoading(true);
    try {
      setError(null);
      const brand = brands.find(b => b.id === selectedBrand);
      if (!brand || !brand.api_url) {
        throw new Error('Brand API URL 未設定');
      }
      
      const brandToken = await getBrandToken(selectedBrand);
      if (!brandToken) {
        throw new Error('無法取得有效的 Brand Token');
      }
      
      const capacityPromises = teams.map(async (team) => {
        try {
          const response = await apiClient.getThirdPartyTeamCapacity(
            brand.api_url,
            brandToken,
            team.id
          );
          return {
            teamId: team.id,
            data: response.success ? response.data : null
          };
        } catch (error) {
          console.error(`載入 Team ${team.name} Capacity 失敗:`, error);
          return { teamId: team.id, data: null };
        }
      });
      
      const results = await Promise.all(capacityPromises);
      const newTeamsCapacity = {};
      results.forEach(result => {
        if (result.data) {
          newTeamsCapacity[result.teamId] = result.data;
        }
      });
      
      setTeamsCapacity(newTeamsCapacity);
    } catch (error) {
      console.error('載入 Teams Capacity 失敗:', error);
      setError('載入 Teams Capacity 失敗: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getBrandToken = async (brandId) => {
    // 直接從 brands 資料中取得 token（參考 Agent Monitor 模式）
    const brand = brands.find(b => b.id === brandId);
    if (brand?.auth_token || brand?.token) {
      return brand.auth_token || brand.token;
    }
    
    // 如果 brands 資料中沒有 token，嘗試從 API 取得
    try {
      const response = await apiClient.getBrandToken(brandId);
      const token = response.token || response.data?.token || response.data?.auth_token;
      if (token) {
        return token;
      }
    } catch (error) {
      console.error('從 API 取得 Brand Token 失敗:', error);
    }
    
    throw new Error('無法取得有效的 Brand Token');
  };





  const AgentCard = ({ agent }) => (
    <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={agent.avatar || 'https://via.placeholder.com/40'} 
            alt={agent.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{agent.name}</h3>
            <div className="flex gap-2 mt-1">
              {agent.is_online && (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  {t('online')}
                </span>
              )}
              {agent.is_available && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {t('available')}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{agent.total_chats}</div>
          <div className="text-sm text-gray-500">{t('chats')}</div>
        </div>
      </div>
    </div>
  );

  const TeamCapacityCard = ({ team }) => {
    const capacity = teamsCapacity[team.id];
    const isCollapsed = collapsedTeams[team.id];
    
    const toggleCollapse = () => {
      setCollapsedTeams(prev => ({
        ...prev,
        [team.id]: !prev[team.id]
      }));
    };
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{team.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">({team.member_count} {t('members')})</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCollapse}
              >
                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {capacity ? (
            <div className="space-y-4">
              {/* Summary Stats - Always visible */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{capacity.total_chats}</div>
                  <div className="text-xs text-gray-600">{t('totalChats')}</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{capacity.total_tickets}</div>
                  <div className="text-xs text-gray-600">{t('totalTickets')}</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">{capacity.online_agents?.length || 0}</div>
                  <div className="text-xs text-gray-600">{t('onlineAgents')}</div>
                </div>
              </div>
              
              {/* Online Agents - Only visible when expanded */}
              {!isCollapsed && capacity.online_agents?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">{t('onlineAgents')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {capacity.online_agents.map(agent => (
                      <AgentCard key={agent.id} agent={agent} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">{t('loading')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Agent Capacity 資料處理
  const getAgentCapacityData = () => {
    const agentMap = new Map();
    
    teams.forEach(team => {
      const capacity = teamsCapacity[team.id];
      if (capacity?.online_agents) {
        capacity.online_agents.forEach(agent => {
          if (!agentMap.has(agent.name)) {
            agentMap.set(agent.name, {
              name: agent.name,
              avatar: agent.avatar,
              is_online: agent.is_online,
              is_available: agent.is_available,
              teams: [],
              totalChats: 0
            });
          }
          
          const agentData = agentMap.get(agent.name);
          agentData.teams.push({
            teamName: team.name,
            chats: agent.total_chats
          });
          agentData.totalChats += agent.total_chats;
        });
      }
    });
    
    return Array.from(agentMap.values());
  };

  const AgentCapacityView = () => {
    const agentData = getAgentCapacityData();
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agentData.length > 0 ? (
          agentData.map(agent => (
            <Card key={agent.name}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={agent.avatar || 'https://via.placeholder.com/40'} 
                      alt={agent.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <span className="text-sm">{agent.name}</span>
                      <div className="flex gap-1 mt-1">
                        {agent.is_online && (
                          <span className="px-1 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                            {t('online')}
                          </span>
                        )}
                        {agent.is_available && (
                          <span className="px-1 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {t('available')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">{agent.totalChats}</div>
                    <div className="text-xs text-gray-500">{t('chats')}</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-medium text-xs">{t('teams')}:</h4>
                  <div className="space-y-1">
                    {agent.teams.map((teamData, index) => (
                      <div key={index} className="flex justify-between items-center p-1 bg-gray-50 rounded text-xs">
                        <span>{teamData.teamName}</span>
                        <span className="font-medium">{teamData.chats}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t('noAgentData')}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Monitor className="w-6 h-6" />
            {t('agentMonitorV2Title')}
          </h1>
          <p className="text-gray-600">{t('description')}</p>
        </div>
      </div>
      
    <div className="flex h-full gap-6">
      {/* Team Widget - 20% on large screens, 30% on medium screens */}
      <div className="w-[30%] lg:w-[20%] space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('monitorSettings')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('brandLabel')}</label>
              <select
                className="w-full p-2 border rounded-md"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
              >
                <option value="">{t('selectBrand')}</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name} {brand.status === 'active' ? '🟢' : '🔴'}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">{t('workspace')}</label>
              <select
                className="w-full p-2 border rounded-md"
                value={selectedWorkspace}
                onChange={(e) => setSelectedWorkspace(e.target.value)}
                disabled={!selectedBrand}
              >
                <option value="">{t('selectWorkspace')}</option>
                {workspaces.map(workspace => (
                  <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('autoRefresh')}</label>
              <Input
                type="number"
                min="1"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 5)}
              />
            </div>

            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "destructive" : "default"}
              className="w-full"
            >
              {autoRefresh ? t('stopAutoRefresh') : t('startAutoRefresh')}
            </Button>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Brand Status */}
        {selectedBrand && (
          <Card>
            <CardHeader>
              <CardTitle>{t('brandStatus')}</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const brand = brands.find(b => b.id === selectedBrand);
                if (!brand) return null;
                return (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{t('status')}:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        brand.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {brand.status === 'active' ? t('online') : t('offline')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('apiConnection')}:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        brand.api_status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {brand.api_status === 'online' ? t('normal') : t('abnormal')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('workspaceCount')}:</span>
                      <span className="font-medium">{brand.workspace_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('authStatus')}:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        brand.auth_status === 'valid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {brand.auth_status === 'valid' ? t('valid') : t('invalid')}
                      </span>
                    </div>
                    {brand.last_check && (
                      <div className="flex justify-between">
                        <span>{t('lastCheck')}:</span>
                        <span className="text-gray-600">
                          {new Date(brand.last_check).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()} 
            </CardContent>
          </Card>
        )}


      </div>

      {/* Loading Panel - 70% */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{t('teamCapacityMonitor')}</h2>
            {selectedBrand && selectedWorkspace && (
              <p className="text-gray-600">{t('workspace')}: {workspaces.find(w => w.id === selectedWorkspace)?.name}</p>
            )}
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={loadBrands}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {t('refreshBrand')}
            </Button>
            {teams.length > 0 && (
              <Button
                variant="outline"
                onClick={loadAllTeamsCapacity}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {t('refreshTeams')}
              </Button>
            )}
          </div>
        </div>

        {selectedBrand && selectedWorkspace && teams.length > 0 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="teams">{t('teamCapacityMonitor')}</TabsTrigger>
              <TabsTrigger value="agents">{t('agentCapacityMonitor')}</TabsTrigger>
            </TabsList>

            <TabsContent value="teams" className="space-y-4">
              {/* Team Filter */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('teamFilter')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {teams.map(team => (
                      <label key={team.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={teamFilters[team.id] || false}
                          onChange={(e) => setTeamFilters(prev => ({
                            ...prev,
                            [team.id]: e.target.checked
                          }))}
                        />
                        <span className="text-sm">{team.name}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Filtered Teams */}
              <div className="space-y-4">
                {teams.filter(team => teamFilters[team.id]).map(team => (
                  <TeamCapacityCard key={team.id} team={team} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="agents" className="space-y-4">
              <AgentCapacityView />
            </TabsContent>
          </Tabs>
        ) : selectedBrand ? (
          <div className="space-y-4">
            {/* Brand Overview */}
            <Card>
              <CardHeader>
                <CardTitle>{t('brandOverview')}</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const brand = brands.find(b => b.id === selectedBrand);
                  if (!brand) return null;
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className={`text-2xl font-bold ${
                          brand.status === 'active' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {brand.status === 'active' ? '✓' : '✗'}
                        </div>
                        <div className="text-sm text-gray-600">{t('brandStatus')}</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className={`text-2xl font-bold ${
                          brand.api_status === 'online' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {brand.api_status === 'online' ? '✓' : '✗'}
                        </div>
                        <div className="text-sm text-gray-600">{t('apiConnection')}</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {brand.workspace_count || 0}
                        </div>
                        <div className="text-sm text-gray-600">{t('workspaces')}</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className={`text-2xl font-bold ${
                          brand.auth_status === 'valid' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {brand.auth_status === 'valid' ? '✓' : '!'}
                        </div>
                        <div className="text-sm text-gray-600">{t('authStatus')}</div>
                      </div>
                    </div>
                  );
                })()} 
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center text-gray-500">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('selectWorkspaceToViewTeams')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t('selectBrandToStart')}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </div>
  );
};

export default AgentMonitorV2Page;