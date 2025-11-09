import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, createLogger } from '../logger';

describe('logger utilities', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleLogSpy: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleWarnSpy: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('logger', () => {
    it('should log debug messages with prefix', () => {
      logger.debug('test message', { data: 'value' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[DEBUG] test message',
        { data: 'value' }
      );
    });

    it('should log info messages with prefix', () => {
      logger.info('test message', { data: 'value' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[INFO] test message',
        { data: 'value' }
      );
    });

    it('should log warn messages with prefix', () => {
      logger.warn('test message', { data: 'value' });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[WARN] test message',
        { data: 'value' }
      );
    });

    it('should log error messages with prefix', () => {
      logger.error('test message', { data: 'value' });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ERROR] test message',
        { data: 'value' }
      );
    });

    it('should handle multiple arguments', () => {
      logger.debug('test', 'arg1', 'arg2', { key: 'value' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[DEBUG] test',
        'arg1',
        'arg2',
        { key: 'value' }
      );
    });

    it('should handle no additional arguments', () => {
      logger.info('simple message');

      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] simple message');
    });
  });

  describe('createLogger', () => {
    it('should create scoped logger with module name', () => {
      const scopedLogger = createLogger('MyModule');

      scopedLogger.debug('test message');

      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] [MyModule] test message');
    });

    it('should support all log levels with scope', () => {
      const scopedLogger = createLogger('TestModule');

      scopedLogger.debug('debug msg');
      scopedLogger.info('info msg');
      scopedLogger.warn('warn msg');
      scopedLogger.error('error msg');

      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] [TestModule] debug msg');
      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] [TestModule] info msg');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] [TestModule] warn msg');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] [TestModule] error msg');
    });

    it('should handle additional arguments in scoped logger', () => {
      const scopedLogger = createLogger('Module');

      scopedLogger.info('message', { data: 1 }, 'extra');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[INFO] [Module] message',
        { data: 1 },
        'extra'
      );
    });

    it('should create independent loggers for different modules', () => {
      const logger1 = createLogger('Module1');
      const logger2 = createLogger('Module2');

      logger1.debug('msg1');
      logger2.debug('msg2');

      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] [Module1] msg1');
      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] [Module2] msg2');
    });
  });

  describe('formatting', () => {
    it('should handle empty strings', () => {
      logger.debug('');

      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] ');
    });

    it('should handle special characters in messages', () => {
      logger.info('Message with \n newline');

      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] Message with \n newline');
    });

    it('should handle objects in message arguments', () => {
      const obj = { nested: { value: 'test' } };
      logger.debug('Object:', obj);

      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] Object:', obj);
    });

    it('should handle arrays in message arguments', () => {
      const arr = [1, 2, 3];
      logger.info('Array:', arr);

      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] Array:', arr);
    });

    it('should handle undefined and null', () => {
      logger.debug('Values:', undefined, null);

      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] Values:', undefined, null);
    });
  });
});
