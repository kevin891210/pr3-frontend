import { buildApiUrl } from '../config/runtime';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.listeners = new Map();
  }

  connect(channel = 'leave_requests') {
    try {
      const baseUrl = buildApiUrl('').replace('http', 'ws').replace('/api/v1', '');
      const wsUrl = `${baseUrl}/ws?channel=${channel}`;
      
      console.log('Attempting WebSocket connection to:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected successfully');
        this.reconnectAttempts = 0;
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        if (event.code !== 1000) { // 非正常關閉才重連
          this.attemptReconnect();
        }
      };
      
      this.ws.onerror = (error) => {
        console.warn('WebSocket connection failed - WebSocket server may not be available');
        console.log('This is normal if the backend WebSocket server is not running');
        // 不顯示錯誤，因為這是可選功能
      };
      
    } catch (error) {
      console.warn('Failed to initialize WebSocket:', error.message);
    }
  }

  handleMessage(data) {
    const { type } = data;
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket message handler:', error);
        }
      });
    }
  }

  subscribe(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(callback);
    
    // 返回取消訂閱函數
    return () => {
      this.unsubscribe(type, callback);
    };
  }

  unsubscribe(type, callback) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).delete(callback);
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting WebSocket reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, this.reconnectInterval * this.reconnectAttempts); // 指數退避
    } else {
      console.log('WebSocket reconnection attempts exhausted. Real-time updates disabled.');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}

export const wsService = new WebSocketService();
export default wsService;