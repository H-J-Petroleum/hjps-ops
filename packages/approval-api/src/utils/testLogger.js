/**
 * Test Logger Utility
 * Enhanced logging for test environments with detailed error context
 */

const winston = require('winston');

// Test-specific log levels with verbose debugging
const testLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

// Colorized output for test readability
const testColors = {
  error: 'red bold',
  warn: 'yellow bold',
  info: 'cyan',
  http: 'magenta',
  verbose: 'blue',
  debug: 'white',
  silly: 'grey'
};

winston.addColors(testColors);

/**
 * Create a test logger instance
 * @param {Object} options - Logger options
 * @param {string} options.testName - Name of the test suite
 * @param {string} options.level - Log level (default: 'debug')
 * @param {boolean} options.silent - Suppress output (for CI)
 * @returns {Object} Winston logger instance
 */
function createTestLogger(options = {}) {
  const {
    testName = 'Test',
    level = process.env.TEST_LOG_LEVEL || 'debug',
    silent = process.env.CI === 'true' || process.env.TEST_SILENT === 'true'
  } = options;

  const formats = [
    winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      // Format metadata
      const metaString = Object.keys(meta).length > 0
        ? `\n  ${JSON.stringify(meta, null, 2)}`
        : '';

      // Format stack trace
      const stackString = stack ? `\n  ${stack}` : '';

      return `[${timestamp}] [${testName}] ${level}: ${message}${metaString}${stackString}`;
    })
  ];

  const transports = [];

  // Console transport for local development
  if (!silent) {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize({ all: true }),
          ...formats
        )
      })
    );
  }

  // File transport for test logs (always on)
  transports.push(
    new winston.transports.File({
      filename: `logs/test-${testName.toLowerCase().replace(/\s+/g, '-')}.log`,
      format: winston.format.combine(
        winston.format.json(),
        winston.format.timestamp()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );

  // Error-only file for quick debugging
  transports.push(
    new winston.transports.File({
      filename: `logs/test-errors.log`,
      level: 'error',
      format: winston.format.combine(
        winston.format.json(),
        winston.format.timestamp()
      ),
      maxsize: 5242880,
      maxFiles: 3
    })
  );

  return winston.createLogger({
    level,
    levels: testLevels,
    transports,
    exitOnError: false
  });
}

/**
 * Create a mock logger for tests that need silent logging
 * @returns {Object} Mock logger with all methods as no-ops
 */
function createMockLogger() {
  const noop = () => {};
  return {
    error: noop,
    warn: noop,
    info: noop,
    http: noop,
    verbose: noop,
    debug: noop,
    silly: noop
  };
}

/**
 * Capture logger output for assertion in tests
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Capture controller
 */
function captureLoggerOutput(logger) {
  const logs = [];

  const transport = new winston.transports.Stream({
    stream: {
      write: (message) => {
        logs.push(message);
      }
    },
    format: winston.format.json()
  });

  logger.add(transport);

  return {
    logs,
    getLogs: () => logs,
    getLastLog: () => logs[logs.length - 1],
    getErrorLogs: () => logs.filter(log => {
      try {
        const parsed = JSON.parse(log);
        return parsed.level === 'error';
      } catch {
        return false;
      }
    }),
    clear: () => {
      logs.length = 0;
    },
    stop: () => {
      logger.remove(transport);
    }
  };
}

/**
 * Enhanced error logging helper for tests
 * @param {Object} logger - Logger instance
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
function logTestError(logger, error, context = {}) {
  const errorDetails = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: error.code,
    status: error.response?.status,
    responseData: error.response?.data,
    ...context
  };

  logger.error('Test error occurred', errorDetails);

  // Also log to console for immediate visibility
  if (process.env.TEST_LOG_LEVEL === 'debug') {
    console.error('\n━━━ TEST ERROR ━━━');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Context:', context);
    console.error('━━━━━━━━━━━━━━━━━\n');
  }
}

/**
 * Create test context logger with additional metadata
 * @param {Object} baseLogger - Base logger instance
 * @param {Object} context - Context to add to all logs
 * @returns {Object} Child logger with context
 */
function createContextLogger(baseLogger, context = {}) {
  return {
    error: (message, meta = {}) => baseLogger.error(message, { ...context, ...meta }),
    warn: (message, meta = {}) => baseLogger.warn(message, { ...context, ...meta }),
    info: (message, meta = {}) => baseLogger.info(message, { ...context, ...meta }),
    http: (message, meta = {}) => baseLogger.http(message, { ...context, ...meta }),
    verbose: (message, meta = {}) => baseLogger.verbose(message, { ...context, ...meta }),
    debug: (message, meta = {}) => baseLogger.debug(message, { ...context, ...meta }),
    silly: (message, meta = {}) => baseLogger.silly(message, { ...context, ...meta })
  };
}

module.exports = {
  createTestLogger,
  createMockLogger,
  captureLoggerOutput,
  logTestError,
  createContextLogger
};
