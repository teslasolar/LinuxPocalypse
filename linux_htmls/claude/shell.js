// Claude Components - Shell Command Interpreter
const Shell = {
  cwd: '/home/user',
  user: 'user',
  hostname: 'claude',
  history: [],
  historyIndex: -1,
  fs: null,
  output: null, // function(text, type)

  init(fs, outputFn) {
    this.fs = fs;
    this.output = outputFn;
    return this;
  },

  log(text, type = 'output') {
    if (this.output) this.output(text, type);
  },

  getPrompt() {
    const path = this.cwd.replace('/home/user', '~');
    return { user: this.user, host: this.hostname, path };
  },

  resolvePath(path) {
    if (!path) return this.cwd;
    if (path === '~') return '/home/user';
    if (path === '..') return this.cwd.split('/').slice(0, -1).join('/') || '/';
    if (path.startsWith('/')) return path;
    return this.cwd + '/' + path;
  },

  exec(cmd) {
    if (!cmd.trim()) return { success: true };

    this.history.push(cmd);
    this.historyIndex = this.history.length;

    const parts = cmd.trim().split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    const commands = {
      help: () => {
        this.log('ClaudeOS Commands:', 'info');
        this.log('  ls [-la]        List directory', 'output');
        this.log('  cd <dir>        Change directory', 'output');
        this.log('  pwd             Print working directory', 'output');
        this.log('  cat <file>      Show file contents', 'output');
        this.log('  touch <file>    Create file', 'output');
        this.log('  mkdir <dir>     Create directory', 'output');
        this.log('  rm <file>       Remove file', 'output');
        this.log('  echo <text>     Print text', 'output');
        this.log('  node <file>     Run JavaScript', 'output');
        this.log('  npm <cmd>       Package manager', 'output');
        this.log('  claude          Claude CLI', 'output');
        this.log('  neofetch        System info', 'output');
        this.log('  clear           Clear screen', 'output');
        return { success: true };
      },

      ls: () => {
        const items = this.fs.list(this.cwd);
        const detailed = args.includes('-l') || args.includes('-la');
        items.forEach(item => {
          if (detailed) {
            const perm = item.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--';
            this.log(`${perm} 1 user user 4096 Dec 22 12:00 ${item.name}`, item.type === 'dir' ? 'dir' : 'file');
          } else {
            this.log(item.name, item.type === 'dir' ? 'dir' : 'file');
          }
        });
        return { success: true };
      },

      cd: () => {
        const target = this.resolvePath(args[0]);
        if (this.fs.isDir(target) || target === '/') {
          this.cwd = target;
          return { success: true };
        }
        this.log(`cd: ${args[0]}: No such directory`, 'error');
        return { success: false };
      },

      pwd: () => {
        this.log(this.cwd);
        return { success: true };
      },

      cat: () => {
        const path = this.resolvePath(args[0]);
        const content = this.fs.read(path);
        if (content !== null) {
          this.log(content);
          return { success: true };
        }
        this.log(`cat: ${args[0]}: No such file`, 'error');
        return { success: false };
      },

      touch: () => {
        if (!args[0]) {
          this.log('touch: missing operand', 'error');
          return { success: false };
        }
        this.fs.write(this.resolvePath(args[0]), '');
        this.log(`Created ${args[0]}`, 'success');
        return { success: true };
      },

      mkdir: () => {
        if (!args[0]) {
          this.log('mkdir: missing operand', 'error');
          return { success: false };
        }
        this.fs.mkdir(this.resolvePath(args[0]));
        this.log(`Created directory ${args[0]}`, 'success');
        return { success: true };
      },

      rm: () => {
        const path = this.resolvePath(args[0]);
        if (this.fs.rm(path)) {
          this.log(`Removed ${args[0]}`, 'success');
          return { success: true };
        }
        this.log(`rm: ${args[0]}: No such file`, 'error');
        return { success: false };
      },

      echo: () => {
        this.log(args.join(' '));
        return { success: true };
      },

      clear: () => {
        return { success: true, action: 'clear' };
      },

      whoami: () => {
        this.log(this.user);
        return { success: true };
      },

      date: () => {
        this.log(new Date().toString());
        return { success: true };
      },

      uname: () => {
        if (args[0] === '-a') {
          this.log('Linux claude-sandbox 6.1.0-claude #1 SMP ClaudeOS x86_64 GNU/Linux');
        } else {
          this.log('Linux');
        }
        return { success: true };
      },

      free: () => {
        this.log('              total        used        free');
        this.log('Mem:       16384000     4384000    12000000');
        this.log('Swap:       4096000           0     4096000');
        return { success: true };
      },

      ps: () => {
        this.log('  PID TTY          TIME CMD');
        this.log('    1 tty1     00:00:00 init');
        this.log('   42 tty1     00:00:00 bash');
        return { success: true };
      },

      node: () => {
        if (args[0] === '-v' || args[0] === '--version') {
          this.log('v20.10.0');
          return { success: true };
        }
        if (!args[0]) {
          this.log('Usage: node <file.js>', 'error');
          return { success: false };
        }
        const code = this.fs.read(this.resolvePath(args[0]));
        if (!code) {
          this.log(`node: ${args[0]}: No such file`, 'error');
          return { success: false };
        }
        this.log(`> Running ${args[0]}...`, 'dim');
        code.split('\n').forEach(line => {
          const m = line.match(/console\.log\(['"`](.*)['"`]\)/);
          if (m) this.log(m[1]);
        });
        return { success: true };
      },

      npm: () => {
        if (args[0] === '-v') {
          this.log('10.2.0');
          return { success: true };
        }
        if (args[0] === 'install' || args[0] === 'i') {
          const pkg = args[1];
          if (!pkg) {
            this.log('up to date', 'success');
            return { success: true };
          }
          this.log(`Installing ${pkg}...`, 'dim');
          return { success: true, action: 'async', callback: (done) => {
            setTimeout(() => {
              this.fs.installPackage(pkg);
              this.log(`+ ${pkg}@1.0.0`, 'success');
              this.log('added 1 package');
              done();
            }, 600);
          }};
        }
        if (args[0] === 'list') {
          this.fs.packages.forEach(p => this.log(`├── ${p}`));
          return { success: true };
        }
        this.log('npm install <pkg> | npm list | npm -v');
        return { success: true };
      },

      claude: () => {
        if (args[0] === '-v' || args[0] === '--version') {
          this.log('claude-code 1.0.38');
          return { success: true };
        }
        this.log('╭─ Claude Code ─╮', 'magenta');
        this.log('│ AI Assistant  │', 'magenta');
        this.log('╰───────────────╯', 'magenta');
        this.log('Ready', 'success');
        return { success: true };
      },

      neofetch: () => {
        this.log('    ▄▄▄▄▄     ' + this.user + '@claude', 'cyan');
        this.log('  ▄███████▄   ─────────────', 'cyan');
        this.log(' ███████████  OS: ClaudeOS 1.0', 'cyan');
        this.log(' ███████████  Kernel: 6.1.0', 'cyan');
        this.log('  ▀███████▀   Packages: ' + this.fs.packages.length, 'cyan');
        this.log('    ▀▀▀▀▀     Shell: bash', 'cyan');
        return { success: true };
      },

      history: () => {
        this.history.forEach((h, i) => this.log(`  ${i + 1}  ${h}`));
        return { success: true };
      },

      exit: () => {
        this.log('logout');
        return { success: true, action: 'exit' };
      },

      sudo: () => {
        this.log('Access granted', 'success');
        return { success: true };
      },

      git: () => {
        if (args[0] === '--version') this.log('git version 2.42.0');
        else if (args[0] === 'status') {
          this.log('On branch main');
          this.log('nothing to commit, working tree clean');
        }
        else this.log('git <command>');
        return { success: true };
      }
    };

    if (commands[command]) {
      return commands[command]();
    } else {
      this.log(`${command}: command not found`, 'error');
      return { success: false };
    }
  },

  historyUp() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      return this.history[this.historyIndex];
    }
    return null;
  },

  historyDown() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      return this.history[this.historyIndex];
    }
    return null;
  }
};

if (typeof module !== 'undefined') module.exports = Shell;
