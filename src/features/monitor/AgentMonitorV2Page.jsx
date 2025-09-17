import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Monitor, RefreshCw, ChevronDown, ChevronRight, 
  Users, Clock, MessageSquare
} from 'lucide-react';
import apiClient from '../../services/api';

const AgentMonitorV2Page = () => {
  const [brands, setBrands] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamCapacity, setTeamCapacity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [expandedTeams, setExpandedTeams] = useState({});
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
    if (autoRefresh && selectedTeam) {
      const intervalMs = refreshInterval * 60 * 1000;
      intervalRef.current = setInterval(() => {
        loadTeamCapacity(selectedTeam.id);
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
  }, [autoRefresh, refreshInterval, selectedTeam]);

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
      if (!brandToken || brandToken === 'demo-token') {
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

  const loadTeamCapacity = async (teamId) => {
    if (!selectedBrand || !teamId) return;
    
    setLoading(true);
    try {
      setError(null);
      const brand = brands.find(b => b.id === selectedBrand);
      if (!brand || !brand.api_url) {
        throw new Error('Brand API URL 未設定');
      }
      
      const brandToken = await getBrandToken(selectedBrand);
      if (!brandToken || brandToken === 'demo-token') {
        throw new Error('無法取得有效的 Brand Token');
      }
      
      const response = await apiClient.getThirdPartyTeamCapacity(
        brand.api_url,
        brandToken,
        teamId
      );
      
      if (response.success && response.data) {
        setTeamCapacity(response.data);
      } else {
        throw new Error('API 回應格式錯誤');
      }
    } catch (error) {
      console.error('載入 Team Capacity 失敗:', error);
      setError('載入 Team Capacity 失敗: ' + error.message);
      setTeamCapacity(null);
    } finally {
      setLoading(false);
    }
  };

  const getBrandToken = async (brandId) => {
    try {
      const response = await apiClient.getBrandToken(brandId);
      return response.token || response.data?.token;
    } catch (error) {
      console.error('取得 Brand Token 失敗:', error);
      throw error;
    }
  };

  const handleTeamClick = (team) => {
    setSelectedTeam(team);
    loadTeamCapacity(team.id);
  };

  const toggleTeamExpansion = (teamId) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
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
                  Online
                </span>
              )}
              {agent.is_available && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Available
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{agent.total_chats}</div>
          <div className="text-sm text-gray-500">chats</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full gap-6">
      {/* Team Widget - 30% */}
      <div className="w-[30%] space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Agent Monitor V2
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Brand</label>
              <select
                className="w-full p-2 border rounded-md"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
              >
                <option value="">選擇 Brand</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name} {brand.status === 'active' ? '🟢' : '🔴'}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Workspace</label>
              <select
                className="w-full p-2 border rounded-md"
                value={selectedWorkspace}
                onChange={(e) => setSelectedWorkspace(e.target.value)}
                disabled={!selectedBrand}
              >
                <option value="">Select Workspace</option>
                {workspaces.map(workspace => (
                  <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Auto Refresh (minutes)</label>
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
              {autoRefresh ? '停止自動刷新' : '開始自動刷新'}
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
              <CardTitle>Brand 狀態</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const brand = brands.find(b => b.id === selectedBrand);
                if (!brand) return null;
                return (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>狀態:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        brand.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {brand.status === 'active' ? '在線' : '離線'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>API 連接:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        brand.api_status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {brand.api_status === 'online' ? '正常' : '異常'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>工作區數量:</span>
                      <span className="font-medium">{brand.workspace_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>認證狀態:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        brand.auth_status === 'valid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {brand.auth_status === 'valid' ? '有效' : '無效'}
                      </span>
                    </div>
                    {brand.last_check && (
                      <div className="flex justify-between">
                        <span>最後檢查:</span>
                        <span className="text-gray-600">
                          {new Date(brand.last_check).toLocaleString('zh-TW')}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()} 
            </CardContent>
          </Card>
        )}

        {/* Teams List */}
        {teams.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {teams.map(team => (
                <div key={team.id} className="border rounded-lg">
                  <div className="flex items-center justify-between p-3">
                    <Button
                      variant="ghost"
                      onClick={() => handleTeamClick(team)}
                      className="flex-1 justify-start"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {team.name}
                      <span className="ml-auto text-sm text-gray-500">
                        ({team.member_count})
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTeamExpansion(team.id)}
                    >
                      {expandedTeams[team.id] ? 
                        <ChevronDown className="w-4 h-4" /> : 
                        <ChevronRight className="w-4 h-4" />
                      }
                    </Button>
                  </div>
                  
                  {expandedTeams[team.id] && (
                    <div className="px-3 pb-3 space-y-1">
                      {team.members?.slice(0, 5).map(member => (
                        <div key={member.id} className="text-sm text-gray-600 pl-6">
                          {member.member.name}
                        </div>
                      ))}
                      {team.members?.length > 5 && (
                        <div className="text-sm text-gray-500 pl-6">
                          +{team.members.length - 5} more...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : selectedBrand && selectedWorkspace && !loading && (
          <Card>
            <CardContent className="p-4 text-center text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">沒有找到 Teams</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Loading Panel - 70% */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Team Capacity Monitor</h2>
            {selectedTeam && (
              <p className="text-gray-600">Team: {selectedTeam.name}</p>
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
              刷新 Brand
            </Button>
            {selectedTeam && (
              <Button
                variant="outline"
                onClick={() => loadTeamCapacity(selectedTeam.id)}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                刷新 Team
              </Button>
            )}
          </div>
        </div>

        {!selectedTeam ? (
          selectedBrand ? (
            <div className="space-y-4">
              {/* Brand Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Brand 監控概覽</CardTitle>
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
                          <div className="text-sm text-gray-600">Brand 狀態</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className={`text-2xl font-bold ${
                            brand.api_status === 'online' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {brand.api_status === 'online' ? '✓' : '✗'}
                          </div>
                          <div className="text-sm text-gray-600">API 連接</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {brand.workspace_count || 0}
                          </div>
                          <div className="text-sm text-gray-600">工作區</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className={`text-2xl font-bold ${
                            brand.auth_status === 'valid' ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {brand.auth_status === 'valid' ? '✓' : '!'}
                          </div>
                          <div className="text-sm text-gray-600">認證狀態</div>
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
                    <p className="text-sm">選擇 Team 以查看容量詳情</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>選擇 Brand 開始監控</p>
                </div>
              </CardContent>
            </Card>
          )
        ) : teamCapacity ? (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{teamCapacity.total_chats}</div>
                  <div className="text-sm text-gray-600">Total Chats</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{teamCapacity.total_tickets}</div>
                  <div className="text-sm text-gray-600">Total Tickets</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{teamCapacity.online_agents?.length || 0}</div>
                  <div className="text-sm text-gray-600">Online Agents</div>
                </CardContent>
              </Card>
            </div>

            {/* Online Agents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Online Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teamCapacity.online_agents?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamCapacity.online_agents.map(agent => (
                      <AgentCard key={agent.id} agent={agent} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No online agents found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : loading ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p>Loading team capacity...</p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
};

export default AgentMonitorV2Page;