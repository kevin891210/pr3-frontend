import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building2, Users, Bot, UserCheck, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import NoticeWidget from '../../components/NoticeWidget';
import apiClient from '@/services/api';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">系統錯誤</h2>
          <p className="text-gray-600">載入 Dashboard 時發生錯誤，請重新整理頁面。</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            重新載入
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const DashboardPage = () => {
  const [stats, setStats] = useState({
    brandCount: 0,
    workspaceCount: 0,
    botCount: 0,
    agentCount: 0
  });
  const [agentMonitor, setAgentMonitor] = useState({
    onService: [],
    onLine: [],
    warning: [],
    offline: []
  });
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [loading, setLoading] = useState(true);
  const { hasPermission } = useAuthStore();

  useEffect(() => {
    loadDashboardData();
    loadBrands();
    const interval = setInterval(loadDashboardData, 30000); // 30秒刷新
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      loadWorkspaces();
    }
  }, [selectedBrand]);

  useEffect(() => {
    if (selectedWorkspace && selectedBrand) {
      loadAgentMonitor();
    }
  }, [selectedWorkspace, selectedBrand]);

  const loadDashboardData = async () => {
    try {
      const response = await apiClient.getDashboardStats();
      const data = response.data || response;
      setStats(data);
    } catch (error) {
      console.warn('Dashboard stats API not available, using fallback data:', error.message);
      // 使用後備數據，避免顯示錯誤
      setStats({
        total_brands: 0,
        total_workspaces: 0, 
        total_bots: 0,
        total_agents: 0,
        brandCount: 0,
        workspaceCount: 0,
        botCount: 0,
        agentCount: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBrands = async () => {
    try {
      const response = await apiClient.getMonitorBrands();
      const data = response.data || response;
      setBrands(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setSelectedBrand(data[0].id);
      }
    } catch (error) {
      console.warn('Monitor brands API not available:', error.message);
      setBrands([]);
    }
  };

  const loadWorkspaces = async () => {
    if (!selectedBrand) return;
    try {
      const response = await apiClient.getBrandWorkspaces(selectedBrand);
      const data = response.data || response;
      setWorkspaces(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setSelectedWorkspace(data[0].id);
      }
    } catch (error) {
      console.warn('Brand workspaces API not available:', error.message);
      setWorkspaces([]);
    }
  };

  const loadAgentMonitor = async () => {
    if (!selectedBrand || !selectedWorkspace) return;
    try {
      const response = await apiClient.getAgentMonitor(selectedBrand, selectedWorkspace, 60, 30);
      if (response.success && response.data) {
        setAgentMonitor({
          onService: response.data.on_service || [],
          onLine: response.data.on_line || [],
          warning: response.data.warning || [],
          offline: response.data.offline || []
        });
      }
    } catch (error) {
      console.warn('Agent monitor API not available:', error.message);
      setAgentMonitor({
        onService: [],
        onLine: [],
        warning: [],
        offline: []
      });
    }
  };

  const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => {
    const colorClasses = {
      blue: 'text-blue-600',
      green: 'text-green-600', 
      purple: 'text-purple-600',
      orange: 'text-orange-600'
    };
    
    const iconClasses = {
      blue: 'text-blue-500',
      green: 'text-green-500',
      purple: 'text-purple-500', 
      orange: 'text-orange-500'
    };
    
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
            </div>
            <Icon className={`w-8 h-8 ${iconClasses[color]}`} />
          </div>
        </CardContent>
      </Card>
    );
  };

  const AgentStatusCard = ({ title, agents = [], color, bgColor }) => {
    // 確保 agents 是陣列
    const safeAgents = Array.isArray(agents) ? agents : [];
    
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className={`text-3xl font-bold ${color.replace('text-', 'text-').replace('-700', '-600')}`}>
                {safeAgents.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Brand 總數"
          value={stats.total_brands || stats.brandCount}
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Workspace 總數"
          value={stats.total_workspaces || stats.workspaceCount}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Bot 總數"
          value={stats.total_bots || stats.botCount}
          icon={Bot}
          color="purple"
        />
        <StatCard
          title="Agent 總數"
          value={stats.total_agents || stats.agentCount}
          icon={UserCheck}
          color="orange"
        />
      </div>

      {/* Notice Widget */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <NoticeWidget />
        </div>
      </div>

      {/* Agent Monitor */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Agent Monitor</h2>
          <div className="flex gap-4">
            <select
              className="px-3 py-1 border rounded text-sm"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option value="">Select Brand</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
            <select
              className="px-3 py-1 border rounded text-sm"
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
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AgentStatusCard
            title="On Service"
            agents={agentMonitor.onService}
            color="text-green-600"
          />
          <AgentStatusCard
            title="On Line"
            agents={agentMonitor.onLine}
            color="text-blue-600"
          />
          <AgentStatusCard
            title="Warning"
            agents={agentMonitor.warning}
            color="text-yellow-600"
          />
          <AgentStatusCard
            title="Offline"
            agents={agentMonitor.offline}
            color="text-red-600"
          />
        </div>
      </div>
    </div>
  );
};

const DashboardWithErrorBoundary = () => (
  <ErrorBoundary>
    <DashboardPage />
  </ErrorBoundary>
);

export default DashboardWithErrorBoundary;