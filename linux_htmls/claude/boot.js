// Claude Components - Boot Sequence
const Boot = {
  terminal: null,
  shell: null,
  fs: null,
  api: null,
  onComplete: null,

  init(components) {
    this.terminal = components.terminal;
    this.shell = components.shell;
    this.fs = components.fs;
    this.api = components.api;
    this.onComplete = components.onComplete;
    return this;
  },

  async run() {
    const t = this.terminal;
    const delay = ms => new Promise(r => setTimeout(r, ms));

    // ASCII Logo
    t.writeln('', 'cyan');
    t.writeln('╔═══════════════════════════════════════╗', 'cyan');
    t.writeln('║     ██████╗██╗      █████╗ ██╗   ██╗  ║', 'cyan');
    t.writeln('║    ██╔════╝██║     ██╔══██╗██║   ██║  ║', 'cyan');
    t.writeln('║    ██║     ██║     ███████║██║   ██║  ║', 'cyan');
    t.writeln('║    ██║     ██║     ██╔══██║██║   ██║  ║', 'cyan');
    t.writeln('║    ╚██████╗███████╗██║  ██║╚██████╔╝  ║', 'cyan');
    t.writeln('║     ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝   ║', 'cyan');
    t.writeln('║              ClaudeOS 1.0             ║', 'info');
    t.writeln('╚═══════════════════════════════════════╝', 'cyan');
    t.writeln('');
    await delay(300);

    // Kernel boot
    t.writeln('[0.001] Booting kernel...', 'dim');
    await delay(150);
    t.writeln('[0.002] CPU: Claude Virtual @ 3.0GHz', 'dim');
    await delay(100);
    t.writeln('[0.003] Memory: 16GB available', 'dim');
    await delay(150);

    // Mount filesystems
    t.writeln('[0.004] Mounting filesystems...', 'dim');
    await delay(100);
    t.writeln('[  OK  ] Mounted /proc', 'success');
    await delay(50);
    t.writeln('[  OK  ] Mounted /etc', 'success');
    await delay(50);
    t.writeln('[  OK  ] Mounted /home', 'success');
    await delay(150);

    // API connection
    if (this.api) {
      t.writeln('[0.005] Connecting to Claude API...', 'dim');
      await delay(200);
      const result = await this.api.connect();
      if (result.success) {
        t.writeln('[  OK  ] Claude API connected', 'success');
      } else {
        t.writeln('[WARN ] Claude API offline - using simulation', 'info');
        this.api.enableMockMode();
      }
      await delay(100);
    }

    // Package installation
    t.writeln('');
    t.writeln('>>> Auto-installing packages...', 'cyan');
    await delay(200);

    const packages = ['nodejs', 'npm', 'claude-code'];
    for (const pkg of packages) {
      t.write(`[pkg] Installing ${pkg}... `, 'dim');
      await delay(250);
      this.fs.installPackage(pkg);
      t.writeln('✓', 'success');
    }

    await delay(200);
    t.writeln('');
    t.writeln('[  OK  ] Environment ready', 'success');
    t.writeln('[  OK  ] Starting shell', 'success');
    await delay(200);

    t.writeln('');
    t.writeln('ClaudeOS 1.0 LTS - Type "help" for commands', 'dim');
    t.writeln('');

    if (this.onComplete) this.onComplete();
  },

  // Quick boot (skip animation)
  quick() {
    const t = this.terminal;
    t.writeln('ClaudeOS 1.0 - Quick Boot', 'cyan');
    t.writeln('');
    if (this.api) this.api.enableMockMode();
    ['nodejs', 'npm', 'claude-code'].forEach(p => this.fs.installPackage(p));
    t.writeln('Environment ready. Type "help" for commands.', 'success');
    t.writeln('');
    if (this.onComplete) this.onComplete();
  }
};

if (typeof module !== 'undefined') module.exports = Boot;
