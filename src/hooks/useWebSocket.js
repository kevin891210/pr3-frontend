import { useEffect, useCallback } from 'react';
import wsService from '../services/websocket';

export const useWebSocket = (channel = 'leave_requests') => {
  useEffect(() => {
    // 只在開發環境或明確啟用 WebSocket 時才連接
    const shouldConnect = process.env.NODE_ENV === 'development' || 
                         localStorage.getItem('enableWebSocket') === 'true';
    
    if (shouldConnect) {
      wsService.connect(channel);
    } else {
      console.log('WebSocket disabled in production. Enable with localStorage.setItem("enableWebSocket", "true")');
    }
    
    return () => {
      if (shouldConnect) {
        wsService.disconnect();
      }
    };
  }, [channel]);

  const subscribe = useCallback((type, callback) => {
    return wsService.subscribe(type, callback);
  }, []);

  return { subscribe };
};

export default useWebSocket;