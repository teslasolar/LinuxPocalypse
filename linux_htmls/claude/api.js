// Claude Components - API Connector
const ClaudeAPI = {
  baseUrl: '',
  apiKey: '',
  connected: false,

  init(config = {}) {
    this.baseUrl = config.baseUrl || '/api';
    this.apiKey = config.apiKey || '';
    return this;
  },

  async connect() {
    try {
      const res = await fetch(`${this.baseUrl}/health`, {
        headers: this.getHeaders()
      });
      this.connected = res.ok;
      return { success: res.ok, status: res.status };
    } catch (e) {
      this.connected = false;
      return { success: false, error: e.message };
    }
  },

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;
    return headers;
  },

  async chat(message, context = []) {
    try {
      const res = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ message, context })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return { error: e.message };
    }
  },

  async runCode(code, language = 'javascript') {
    try {
      const res = await fetch(`${this.baseUrl}/run`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ code, language })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return { error: e.message };
    }
  },

  async installPackage(name) {
    try {
      const res = await fetch(`${this.baseUrl}/npm/install`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ package: name })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return { error: e.message };
    }
  },

  async readFile(path) {
    try {
      const res = await fetch(`${this.baseUrl}/fs/read?path=${encodeURIComponent(path)}`, {
        headers: this.getHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return { error: e.message };
    }
  },

  async writeFile(path, content) {
    try {
      const res = await fetch(`${this.baseUrl}/fs/write`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ path, content })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return { error: e.message };
    }
  },

  async listFiles(path = '/') {
    try {
      const res = await fetch(`${this.baseUrl}/fs/list?path=${encodeURIComponent(path)}`, {
        headers: this.getHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return { error: e.message };
    }
  },

  // Mock mode for offline testing
  enableMockMode() {
    this.connected = true;
    this.mock = true;

    this.chat = async (message) => ({
      response: `[Mock] Claude received: "${message}"`,
      mock: true
    });

    this.runCode = async (code) => ({
      output: `[Mock] Would execute: ${code.slice(0, 50)}...`,
      mock: true
    });

    this.installPackage = async (name) => ({
      success: true,
      package: name,
      version: '1.0.0',
      mock: true
    });

    return this;
  }
};

if (typeof module !== 'undefined') module.exports = ClaudeAPI;
