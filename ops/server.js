const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const CONFIG_PATH = '/usr/share/nginx/html/config/app-config.json';

// Health check
app.get('/__ops/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Update config (only when not initialized or with admin token)
app.patch('/__ops/config', (req, res) => {
  try {
    const cfg = req.body || {};
    
    // Validate required fields
    if (!cfg.api?.baseUrl) {
      return res.status(400).json({ error: 'Missing api.baseUrl' });
    }

    // Check if already initialized (simple protection)
    let currentConfig = {};
    try {
      const existing = fs.readFileSync(CONFIG_PATH, 'utf-8');
      currentConfig = JSON.parse(existing);
    } catch (e) {
      // File doesn't exist or invalid JSON, allow write
    }

    // If already initialized, require some form of auth (simplified for demo)
    if (currentConfig.initialized && !req.headers.authorization) {
      return res.status(403).json({ error: 'Already initialized, admin token required' });
    }

    // Set initialized flag
    cfg.initialized = true;
    cfg.updatedAt = new Date().toISOString();

    // Write config
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
    
    res.json({ success: true, message: 'Configuration updated' });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// Get current config status
app.get('/__ops/config', (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    res.json({ 
      initialized: config.initialized || false,
      envName: config.envName || 'UNKNOWN',
      buildVersion: config.buildVersion || '0.0.0'
    });
  } catch (error) {
    res.json({ initialized: false });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ops server running on port ${PORT}`);
});