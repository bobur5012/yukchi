export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  threshold: number;
  resetTimeoutMs: number;
}

export class CircuitBreakerService {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly threshold: number;
  private readonly resetTimeoutMs: number;

  constructor(options: CircuitBreakerOptions) {
    this.threshold = options.threshold;
    this.resetTimeoutMs = options.resetTimeoutMs;
  }

  isOpen(): boolean {
    if (this.state === CircuitState.OPEN) {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed > this.resetTimeoutMs) {
        this.state = CircuitState.HALF_OPEN;
        console.log('[CircuitBreaker] Moving to HALF_OPEN state');
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    this.failureCount = 0;
    if (this.state !== CircuitState.CLOSED) {
      this.state = CircuitState.CLOSED;
      console.log('[CircuitBreaker] Circuit CLOSED — recovered');
    }
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = CircuitState.OPEN;
      console.error(
        `[CircuitBreaker] Circuit OPENED after ${this.failureCount} failures. ` +
          `Will try again in ${this.resetTimeoutMs / 1000}s`,
      );
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}
