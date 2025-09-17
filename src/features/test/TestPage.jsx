import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import apiClient from '../../services/api';

const TestPage = () => {
  const [apiUrl, setApiUrl] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [onlineAgents, setOnlineAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(null);





  const loadTeams = async () => {
    if (apiUrl && authToken && workspaceId) {
      setLoading(true);
      console.log('Loading teams for workspace:', workspaceId, 'API:', apiUrl);
      try {
        const response = await apiClient.getThirdPartyTeams(
          apiUrl,
          authToken,
          workspaceId
        );
        console.log('API response:', response);
        setTeams(response.data || []);
      } catch (error) {
        console.error('Failed to load teams:', error);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    } else {
      console.log('Missing required fields');
      setTeams([]);
    }
  };



  const selectTeam = async (team) => {
    setSelectedTeam(team);
    setLoadingTeam(team.id);
    
    try {
      if (apiUrl && authToken) {
        const response = await apiClient.getThirdPartyTeamCapacity(
          apiUrl,
          authToken,
          team.id
        );
        setOnlineAgents(response.data?.online_agents || []);
      } else {
        // Fallback to mock data
        setOnlineAgents([
          {
            id: '67ed9916-a35e-41a5-a189-d9f2ed49b467',
            name: 'Ruman',
            avatar: 'https://storage.cxgenie-baji.com/files/f2668821dc202e96ee55ec6e4ef8e1fc.jpg',
            is_online: true,
            is_available: false,
            total_chats: 5
          },
          {
            id: '951d68e8-490a-4040-8c8e-da21f2a1f94e',
            name: 'Yousuf Raza',
            avatar: 'https://storage.cxgenie-baji.com/files/b50b7534874172cb0e68beab8ee5f1e8.jfif',
            is_online: true,
            is_available: true,
            total_chats: 12
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load team capacity:', error);
      setOnlineAgents([]);
    } finally {
      setLoadingTeam(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Test</h1>
        <p className="text-gray-600">Team management and agent capacity monitoring</p>
      </div>

      <div className="flex gap-6">
        <div className="w-[30%]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Teams
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">API URL</label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.example.com"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Auth Token</label>
                <input
                  type="text"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  placeholder="Bearer token..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Workspace ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={workspaceId}
                    onChange={(e) => setWorkspaceId(e.target.value)}
                    placeholder="Enter workspace ID..."
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Button
                    onClick={loadTeams}
                    disabled={!apiUrl || !authToken || !workspaceId || loading}
                    className="px-4"
                  >
                    {loading ? 'Loading...' : 'Submit'}
                  </Button>
                </div>
              </div>
              
              {teams.length > 0 && (
                <div className="space-y-2">
                  {teams.map((team) => (
                    <Button
                      key={team.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => selectTeam(team)}
                      disabled={loadingTeam === team.id}
                    >
                      {loadingTeam === team.id ? 'Loading...' : team.name}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="w-[70%]">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedTeam ? `${selectedTeam.name} - Online Agents` : 'Select a team to view agents'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : onlineAgents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {onlineAgents.map((agent) => (
                    <Card key={agent.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={agent.avatar}
                            alt={agent.name}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/48x48?text=Avatar';
                            }}
                          />
                          <div>
                            <h3 className="font-semibold text-lg">{agent.name}</h3>
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
                          <div className="text-2xl font-bold text-blue-600">
                            {agent.total_chats}
                          </div>
                          <div className="text-xs text-gray-500">Total Chats</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  {selectedTeam ? 'No online agents found' : 'Please select a team to view agent details'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestPage;