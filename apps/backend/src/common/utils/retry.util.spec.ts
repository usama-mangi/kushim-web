import { retryWithBackoff, CircuitBreaker, sleep } from './retry.util';

// Mock sleep to avoid waiting during tests
jest.mock('./retry.util', () => {
  const originalModule = jest.requireActual('./retry.util');
  return {
    ...originalModule,
    sleep: jest.fn(() => Promise.resolve()),
  };
});

describe('retry.util', () => {
  describe('retryWithBackoff', () => {
    it('should return result if function succeeds on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry and succeed if function fails then succeeds', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');
      
      const result = await retryWithBackoff(fn, 3, 10);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw error if function fails max number of times', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));
      
      await expect(retryWithBackoff(fn, 3, 10)).rejects.toThrow('fail');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('CircuitBreaker', () => {
    let breaker: CircuitBreaker;

    beforeEach(() => {
      breaker = new CircuitBreaker();
    });

    it('should start in CLOSED state', () => {
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should succeed when function succeeds', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await breaker.execute(fn);
      expect(result).toBe('success');
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should open after threshold failures', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));
      
      // Threshold is 5 by default
      for (let i = 0; i < 4; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow('fail');
        expect(breaker.getState()).toBe('CLOSED');
      }

      await expect(breaker.execute(fn)).rejects.toThrow('fail');
      expect(breaker.getState()).toBe('OPEN');
    });

    it('should fail fast when OPEN', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));
      
      // Open the breaker
      for (let i = 0; i < 5; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow('fail');
      }

      const newFn = jest.fn().mockResolvedValue('success');
      await expect(breaker.execute(newFn)).rejects.toThrow('Circuit breaker is OPEN');
      expect(newFn).not.toHaveBeenCalled();
    });

    it('should transition to HALF_OPEN and reset if successful after timeout', async () => {
      jest.useFakeTimers();
      const fn = jest.fn().mockRejectedValue(new Error('fail'));
      
      // Open the breaker
      for (let i = 0; i < 5; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow('fail');
      }

      // Advance time by 1 minute (resetTimeout)
      jest.advanceTimersByTime(60001);

      const successFn = jest.fn().mockResolvedValue('success');
      const result = await breaker.execute(successFn);
      
      expect(result).toBe('success');
      expect(breaker.getState()).toBe('CLOSED');
      expect(breaker.getFailureCount()).toBe(0);
      
      jest.useRealTimers();
    });
  });
});
