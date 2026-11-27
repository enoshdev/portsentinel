/**
 * PortSentinel Backend API Service
 * Centralized client for communicating with the FastAPI backend.
 * Provides typed helpers for telemetry, monitored IPs, firewall rules, and demonstration state.
 */

const API_BASE = '/api';

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch (e) {
        // Non-JSON response
      }
      const message = errorData?.detail || `API Request failed with status ${response.status}`;
      throw new ApiError(message, response.status, errorData);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or connection failure
    throw new ApiError(
      `Unable to connect to PortSentinel backend server at ${url}. Please ensure the FastAPI backend is running on port 8000.`,
      0,
      { originalError: error.message }
    );
  }
}

export const api = {
  // System Health
  checkHealth: () => request('/health'),

  // Dashboard Overview
  getDashboardStats: () => request('/dashboard/stats'),

  // Monitored Hosts
  getMonitoredIps: () => request('/ips'),
  getMonitoredIp: (identifier) => request(`/ips/${encodeURIComponent(identifier)}`),

  // Connection Event Logs
  getConnectionLogs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.ip) query.set('ip', params.ip);
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));
    const qs = query.toString();
    return request(`/logs${qs ? `?${qs}` : ''}`);
  },

  // Record connection event
  recordEvent: (eventData) =>
    request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    }),

  // Risk Progression Timeline
  getRiskHistory: (identifier) =>
    request(`/risk-history/${encodeURIComponent(identifier)}`),

  // Firewall & Quarantine Records
  getFirewallRules: () => request('/firewall/rules'),
  getFirewallHistory: () => request('/firewall/history'),
  getFirewallStatus: () => request('/firewall/status'),
  
  blockIp: (ip, reason = 'Manual operator quarantine', dryRun = null) =>
    request('/firewall/block', {
      method: 'POST',
      body: JSON.stringify({ ip, reason, dry_run: dryRun }),
    }),

  unblockIp: (ip, reason = 'Quarantine reversed during operator review', dryRun = null) =>
    request('/firewall/unblock', {
      method: 'POST',
      body: JSON.stringify({ ip, reason, dry_run: dryRun }),
    }),

  setAutoBlock: (enabled, threshold = 80) =>
    request('/firewall/auto-block', {
      method: 'POST',
      body: JSON.stringify({ enabled, threshold }),
    }),

  setDryRun: (enabled) =>
    request('/firewall/dry-run', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),

  getAllowlist: () => request('/firewall/allowlist'),
  addToAllowlist: (ip) =>
    request('/firewall/allowlist/add', {
      method: 'POST',
      body: JSON.stringify({ ip }),
    }),
  removeFromAllowlist: (ip) =>
    request('/firewall/allowlist/remove', {
      method: 'POST',
      body: JSON.stringify({ ip }),
    }),

  // Demonstration Data Reset & Clear
  resetDemoData: () =>
    request('/demo/reset', {
      method: 'POST',
    }),
  clearAllData: () =>
    request('/demo/clear', {
      method: 'POST',
    }),

  // Live Connected Device Registration & Interactive Port Scan
  getClientDevice: () => request('/monitoring/client-device'),
  connectClientPorts: (ports) =>
    request('/monitoring/client-device/connect', {
      method: 'POST',
      body: JSON.stringify({ ports }),
    }),
  triggerClientDeviceScan: () =>
    request('/monitoring/client-device/scan', {
      method: 'POST',
    }),

  // Phase 2: Live Network Monitoring Controls
  getMonitoringStatus: () => request('/monitoring/status'),
  getInterfaces: () => request('/monitoring/interfaces'),
  startMonitoring: (interfaceName, filterStr = 'tcp') =>
    request('/monitoring/start', {
      method: 'POST',
      body: JSON.stringify({ interface_name: interfaceName, filter_str: filterStr }),
    }),
  stopMonitoring: () =>
    request('/monitoring/stop', {
      method: 'POST',
    }),

  // Phase 2: Traffic Simulation & Testing
  simulateNormalTraffic: (sourceIp = '192.168.1.105', count = 15) =>
    request('/test/traffic/normal', {
      method: 'POST',
      body: JSON.stringify({ source_ip: sourceIp, count }),
    }),
  simulateFastScan: (sourceIp = '10.0.0.99', portCount = 20) =>
    request('/test/traffic/fast-scan', {
      method: 'POST',
      body: JSON.stringify({ source_ip: sourceIp, port_count: portCount }),
    }),
  simulateSlowScan: (sourceIp = '203.0.113.199', probeCount = 6) =>
    request('/test/traffic/slow-scan', {
      method: 'POST',
      body: JSON.stringify({ source_ip: sourceIp, probe_count: probeCount }),
    }),
  simulateRepeatedPort: (sourceIp = '192.168.1.180', count = 25, port = 443) =>
    request('/test/traffic/repeated-port', {
      method: 'POST',
      body: JSON.stringify({ source_ip: sourceIp, count, port }),
    }),
  replayPcap: (filePath = null) =>
    request('/test/pcap/generate-and-replay', {
      method: 'POST',
      body: JSON.stringify({ file_path: filePath }),
    }),
};

/**
 * Creates a persistent WebSocket connection for real-time telemetry streaming.
 */
export function createTelemetryWebSocket(onEvent, onStatusChange) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // If running on Vite dev server (port 3000), proxy handles /ws or direct to 8000
  const host = window.location.port === '3000' ? '127.0.0.1:8000' : window.location.host;
  const wsUrl = `${protocol}//${host}/ws`;

  let ws = null;
  let reconnectTimer = null;
  let isClosedIntentionally = false;

  function connect() {
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (onStatusChange) onStatusChange('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onEvent) onEvent(data);
        } catch (e) {
          console.warn('Malformed telemetry frame:', event.data);
        }
      };

      ws.onerror = (err) => {
        if (onStatusChange) onStatusChange('error');
      };

      ws.onclose = () => {
        if (onStatusChange) onStatusChange('disconnected');
        if (!isClosedIntentionally) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    } catch (e) {
      if (onStatusChange) onStatusChange('error');
    }
  }

  connect();

  return {
    close: () => {
      isClosedIntentionally = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    },
    send: (msg) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }
    }
  };
}

export default api;

