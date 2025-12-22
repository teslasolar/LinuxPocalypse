// Claude Components - Virtual Filesystem
const FS = {
  files: {},
  dirs: ['/home/user', '/etc', '/usr/bin', '/proc', '/tmp', '/var/log'],
  packages: [],

  init() {
    this.files = {
      '/etc/os-release': 'NAME="ClaudeOS"\nVERSION="1.0"\nID=claudeos',
      '/etc/hostname': 'claude-sandbox',
      '/home/user/.bashrc': 'export PS1="\\u@\\h:\\w$ "',
      '/home/user/.profile': '# ClaudeOS User Profile',
      '/proc/version': 'Linux version 6.1.0-claude',
      '/proc/cpuinfo': 'processor: 0\nmodel name: Claude Virtual CPU\ncpu MHz: 3000',
      '/proc/meminfo': 'MemTotal: 16384000 kB\nMemFree: 12000000 kB',
    };
    this.packages = ['coreutils', 'bash', 'nodejs', 'npm'];
    return this;
  },

  read(path) {
    return this.files[path] || null;
  },

  write(path, content) {
    this.files[path] = content;
    if (this.onChange) this.onChange();
  },

  exists(path) {
    return path in this.files || this.dirs.includes(path);
  },

  isDir(path) {
    return this.dirs.includes(path);
  },

  list(dir) {
    const items = [];
    // Files in dir
    Object.keys(this.files).forEach(f => {
      if (f.startsWith(dir + '/') && f.split('/').length === dir.split('/').length + 1) {
        items.push({ name: f.split('/').pop(), type: 'file', path: f });
      }
    });
    // Subdirs
    this.dirs.forEach(d => {
      if (d.startsWith(dir + '/') && d.split('/').length === dir.split('/').length + 1) {
        items.push({ name: d.split('/').pop(), type: 'dir', path: d });
      }
    });
    return items;
  },

  mkdir(path) {
    if (!this.dirs.includes(path)) {
      this.dirs.push(path);
      if (this.onChange) this.onChange();
    }
  },

  rm(path) {
    if (this.files[path]) {
      delete this.files[path];
      if (this.onChange) this.onChange();
      return true;
    }
    return false;
  },

  installPackage(name) {
    if (!this.packages.includes(name)) {
      this.packages.push(name);
    }
  }
};

if (typeof module !== 'undefined') module.exports = FS;
