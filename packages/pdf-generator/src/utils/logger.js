function ts() {
  return new Date().toISOString();
}

module.exports = {
  info: (msg, meta) => {
    // Keep JSON on one line for easy parsing
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ level: 'info', time: ts(), msg, ...(meta || {}) }));
  },
  warn: (msg, meta) => {
    // eslint-disable-next-line no-console
    console.warn(JSON.stringify({ level: 'warn', time: ts(), msg, ...(meta || {}) }));
  },
  error: (msg, meta) => {
    // eslint-disable-next-line no-console
    console.error(JSON.stringify({ level: 'error', time: ts(), msg, ...(meta || {}) }));
  }
};

