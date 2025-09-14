import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Monitor, Play, Square, Settings, RefreshCw, 
  Users, UserCheck, AlertTriangle, UserX 
} from 'lucide-react';
import apiClient from '../../services/api';
import { AlertDialog } from '../../components/ui/dialog';
import AgentCard from '../../components/agent/AgentCard';
import AgentGrid from '../../components/agent/AgentGrid';

const AgentMonitorPage = () => {
  const [brands, setBrands] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [agents, setAgents] = useState({ onService: [], onLine: [], warning: [], offline: [] });
  const [monitorInfo, setMonitorInfo] = useState({ brandName: '', workspaceName: '', summary: null });
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState({ minutes: 1, seconds: 0 });
  const [warningTime, setWarningTime] = useState(30);
  const [alertDialog, setAlertDialog] = useState({ open: false, type: 'info', title: '', message: '' });
  
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
    if (selectedWorkspace) {
      loadAgents();
    }
  }, [selectedWorkspace]);

  useEffect(() => {
    if (autoRefresh) {
      const totalMs = (refreshInterval.minutes * 60 + refreshInterval.seconds) * 1000;
      intervalRef.current = setInterval(loadAgents, totalMs);
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
  }, [autoRefresh, refreshInterval]);

  const loadBrands = async () => {
    try {
      const response = await apiClient.getMonitorBrands();
      const data = response.data || response;
      setBrands(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('載入 Brand 失敗:', error);
      setBrands([]);
      setAlertDialog({
        open: true,
        type: 'danger',
        title: 'Load Failed',
        message: `Cannot load Brand 列表: ${error.message}`
      });
    }
  };

  const loadWorkspaces = async (brandId) => {
    try {
      const response = await apiClient.getBrandWorkspaces(brandId);
      const data = response.data || response;
      setWorkspaces(Array.isArray(data) ? data : []);
      setSelectedWorkspace('');
    } catch (error) {
      console.error('載入 Workspace 失敗:', error);
      setWorkspaces([]);
    }
  };

  const loadAgents = async () => {
    if (!selectedWorkspace || !selectedBrand) return;
    
    setLoading(true);
    try {
      const totalSeconds = refreshInterval.minutes * 60 + refreshInterval.seconds;
      const response = await apiClient.getAgentMonitor(
        selectedBrand,
        selectedWorkspace, 
        totalSeconds,
        warningTime
      );
      
      // Handle new API response format
      if (response.success && response.data) {
        const agentData = response.data;
        
        // 設定分類後的 Agent 數據
        setAgents({
          onService: agentData.on_service || [],
          onLine: agentData.on_line || [],
          warning: agentData.warning || [],
          offline: agentData.offline || []
        });
        
        // 設定監控資訊
        setMonitorInfo({
          brandName: agentData.brand_name || '',
          workspaceName: agentData.workspace_name || '',
          summary: agentData.summary || null
        });
        
        console.log('Agent data loaded:', agentData);
      } else {
        throw new Error('無效的 API 回應格式');
      }
    } catch (error) {
      console.error('載入 Agent 失敗:', error);
      
      // 如果 API 失敗，使用備用的模擬數據
      setAgents({
        onService: [
          { id: '1', name: 'Agent A', email: 'agenta@example.com' },
          { id: '5', name: 'Agent E', email: 'agente@example.com' }
        ],
        onLine: [
          { id: '2', name: 'Agent B', email: 'agentb@example.com' }
        ],
        warning: [
          { id: '3', name: 'Agent C', email: 'agentc@example.com' }
        ],
        offline: [
          { id: '4', name: 'Agent D', email: 'agentd@example.com' }
        ]
      });
      
      setMonitorInfo({
        brandName: 'Test Brand',
        workspaceName: 'Test Workspace',
        summary: {
          on_service_count: 2,
          on_line_count: 1,
          warning_count: 1,
          offline_count: 1
        }
      });
      
      setAlertDialog({
        open: true,
        type: 'warning',
        title: 'Load Failed',
        message: `Cannot load Agent Status，顯示模擬數據: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };





  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Monitor</h1>
          <p className="text-gray-600">監控 Agent OnlineStatus</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "destructive" : "default"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-2"
          >
            {autoRefresh ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {autoRefresh ? '停止自動刷新' : '開始自動刷新'}
          </Button>
          <Button
            variant="outline"
            onClick={loadAgents}
            disabled={loading || !selectedWorkspace}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            手動刷新
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            監控設定
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Brand</label>
              <select
                className="w-full p-2 border rounded-md"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
              >
                <option value="">選擇 Brand</option>
                {Array.isArray(brands) && brands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
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
                <option value="">選擇 Workspace</option>
                {Array.isArray(workspaces) && workspaces.map(workspace => (
                  <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">刷新間隔</label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={refreshInterval.minutes}
                  onChange={(e) => setRefreshInterval(prev => ({ ...prev, minutes: parseInt(e.target.value) || 0 }))}
                  className="w-16 text-center"
                />
                <span className="text-sm self-center">分</span>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={refreshInterval.seconds}
                  onChange={(e) => setRefreshInterval(prev => ({ ...prev, seconds: parseInt(e.target.value) || 0 }))}
                  className="w-16 text-center"
                />
                <span className="text-sm self-center">秒</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Warning 時間 (分鐘)</label>
              <Input
                type="number"
                min="1"
                value={warningTime}
                onChange={(e) => setWarningTime(parseInt(e.target.value) || 30)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedWorkspace && (
        <div className="space-y-4">
          {monitorInfo.brandName && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{monitorInfo.brandName}</h3>
                    <p className="text-gray-600">{monitorInfo.workspaceName}</p>
                  </div>
                  {monitorInfo.summary && (
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-600">On Service: {monitorInfo.summary.on_service_count}</span>
                      <span className="text-blue-600">On Line: {monitorInfo.summary.on_line_count}</span>
                      <span className="text-yellow-600">Warning: {monitorInfo.summary.warning_count}</span>
                      <span className="text-red-600">Offline: {monitorInfo.summary.offline_count}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AgentGrid
              agents={agents.onService}
              type="service"
              title="On Service"
              icon={UserCheck}
            />
            <AgentGrid
              agents={agents.onLine}
              type="online"
              title="On Line"
              icon={Users}
            />
            <AgentGrid
              agents={agents.warning}
              type="warning"
              title="Warning"
              icon={AlertTriangle}
            />
          </div>

          <AgentGrid
            agents={agents.offline}
            type="offline"
            title="Offline"
            icon={UserX}
            maxCols={4}
            collapsible={true}
          />
        </div>
      )}

      <AlertDialog
        open={alertDialog.open}
        onClose={() => setAlertDialog({ open: false, type: 'info', title: '', message: '' })}
        type={alertDialog.type}
        title={alertDialog.title}
        message={alertDialog.message}
      />
    </div>
  );
};

export default AgentMonitorPage;