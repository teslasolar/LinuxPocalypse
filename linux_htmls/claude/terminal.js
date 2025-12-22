// Claude Components - Terminal UI (xterm.js wrapper)
const TerminalUI = {
  term: null,
  shell: null,
  buffer: '',
  ready: false,
  colors: {
    output: '\x1b[0m',
    error: '\x1b[31m',
    success: '\x1b[32m',
    info: '\x1b[33m',
    dim: '\x1b[90m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    dir: '\x1b[1;34m',
    file: '\x1b[0m',
    reset: '\x1b[0m'
  },

  init(container, shell, options = {}) {
    if (typeof Terminal === 'undefined') {
      container.innerHTML = '<pre style="color:#f55;padding:20px">Error: xterm.js not loaded</pre>';
      return null;
    }

    this.shell = shell;

    const cols = Math.floor(container.offsetWidth / 8) || 80;
    const rows = Math.floor(container.offsetHeight / 17) || 24;

    this.term = new Terminal({
      theme: options.theme || {
        background: '#000',
        foreground: '#0f0',
        cursor: '#0f0',
        cursorAccent: '#000',
        green: '#0f0',
        yellow: '#ff0',
        blue: '#0af',
        magenta: '#f0f',
        cyan: '#0ff',
        red: '#f55',
        white: '#fff'
      },
      fontSize: options.fontSize || 14,
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: options.fontFamily || 'Courier New, monospace',
      cols,
      rows
    });

    this.term.open(container);

    // Handle resize
    window.addEventListener('resize', () => {
      const newCols = Math.floor(container.offsetWidth / 8) || 80;
      const newRows = Math.floor(container.offsetHeight / 17) || 24;
      this.term.resize(newCols, newRows);
    });

    // Handle input
    this.term.onData(data => this.handleInput(data));

    // Connect shell output
    if (this.shell) {
      this.shell.init(this.shell.fs, (text, type) => this.writeln(text, type));
    }

    this.ready = true;
    return this;
  },

  write(text, type = 'output') {
    const color = this.colors[type] || this.colors.output;
    this.term.write(color + text + this.colors.reset);
  },

  writeln(text, type = 'output') {
    this.write(text + '\n', type);
  },

  clear() {
    this.term.clear();
  },

  prompt() {
    if (!this.shell) return;
    const p = this.shell.getPrompt();
    this.term.write(`\x1b[1;32m${p.user}@${p.host}\x1b[0m:\x1b[1;34m${p.path}\x1b[0m$ `);
  },

  handleInput(data) {
    if (!this.ready) return;

    if (data === '\r') { // Enter
      this.term.writeln('');
      if (this.buffer.trim()) {
        const result = this.shell.exec(this.buffer.trim());
        if (result.action === 'clear') {
          this.clear();
        } else if (result.action === 'async' && result.callback) {
          result.callback(() => this.prompt());
          this.buffer = '';
          return;
        } else if (result.action === 'exit') {
          this.ready = false;
          return;
        }
      }
      this.buffer = '';
      this.prompt();
    } else if (data === '\x7f') { // Backspace
      if (this.buffer.length > 0) {
        this.buffer = this.buffer.slice(0, -1);
        this.term.write('\b \b');
      }
    } else if (data === '\x03') { // Ctrl+C
      this.term.writeln('^C');
      this.buffer = '';
      this.prompt();
    } else if (data === '\x1b[A') { // Up arrow
      const prev = this.shell.historyUp();
      if (prev) {
        this.term.write('\x1b[2K\r');
        this.prompt();
        this.buffer = prev;
        this.term.write(prev);
      }
    } else if (data === '\x1b[B') { // Down arrow
      const next = this.shell.historyDown();
      if (next) {
        this.term.write('\x1b[2K\r');
        this.prompt();
        this.buffer = next;
        this.term.write(next);
      }
    } else if (data.charCodeAt(0) >= 32) { // Printable
      this.buffer += data;
      this.term.write(data);
    }
  },

  focus() {
    if (this.term) this.term.focus();
  }
};

if (typeof module !== 'undefined') module.exports = TerminalUI;
