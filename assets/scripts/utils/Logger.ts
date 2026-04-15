import { error, log, warn } from 'cc';

const LOG_ENABLED = true;

export class Logger {
  static info(tag: string, ...args: unknown[]): void {
    if (!LOG_ENABLED) return;
    log(tag, ...args);
  }

  static warn(tag: string, ...args: unknown[]): void {
    if (!LOG_ENABLED) return;
    warn(tag, ...args);
  }

  static error(tag: string, ...args: unknown[]): void {
    if (!LOG_ENABLED) return;
    error(tag, ...args);
  }
}

