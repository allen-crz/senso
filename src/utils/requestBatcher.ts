/**
 * Request batching and deduplication utility
 * Optimizes API calls by batching multiple requests and preventing duplicate in-flight requests
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestBatcher {
  // Store in-flight requests to prevent duplicates
  private pendingRequests = new Map<string, PendingRequest<any>>();

  // Request cache TTL (how long to consider a request "in-flight")
  private readonly DEDUP_TTL = 100; // 100ms window for deduplication

  /**
   * Deduplicate identical requests that are in-flight
   * If the same request is made multiple times within a short window,
   * return the same promise instead of making multiple API calls
   */
  deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const pending = this.pendingRequests.get(key);

    // If we have a pending request that's still fresh, return it
    if (pending && (now - pending.timestamp) < this.DEDUP_TTL) {
      console.log(`[RequestBatcher] Deduplicating request: ${key}`);
      return pending.promise;
    }

    // Otherwise, create a new request
    const promise = requestFn()
      .finally(() => {
        // Clean up after request completes
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, {
      promise,
      timestamp: now
    });

    return promise;
  }

  /**
   * Execute multiple requests in parallel
   * Returns results in the same order as the input requests
   */
  async parallel<T extends readonly unknown[]>(
    requests: readonly [...{ [K in keyof T]: () => Promise<T[K]> }]
  ): Promise<T> {
    console.log(`[RequestBatcher] Executing ${requests.length} requests in parallel`);
    const startTime = Date.now();

    try {
      const results = await Promise.all(
        requests.map(fn => fn())
      );

      const duration = Date.now() - startTime;
      console.log(`[RequestBatcher] Parallel requests completed in ${duration}ms`);

      return results as T;
    } catch (error) {
      console.error('[RequestBatcher] Parallel request failed:', error);
      throw error;
    }
  }

  /**
   * Execute multiple requests in parallel with individual error handling
   * Failed requests return null instead of rejecting the entire batch
   */
  async parallelSettled<T>(
    requests: Array<() => Promise<T>>
  ): Promise<Array<T | null>> {
    console.log(`[RequestBatcher] Executing ${requests.length} requests in parallel (settled)`);
    const startTime = Date.now();

    const results = await Promise.allSettled(
      requests.map(fn => fn())
    );

    const duration = Date.now() - startTime;
    console.log(`[RequestBatcher] Parallel settled requests completed in ${duration}ms`);

    return results.map(result =>
      result.status === 'fulfilled' ? result.value : null
    );
  }

  /**
   * Batch multiple requests with a delay to collect more requests
   * Useful for scenarios where many requests come in rapid succession
   */
  private batchQueues = new Map<string, {
    requests: Array<{
      resolve: (value: any) => void;
      reject: (error: any) => void;
      data: any;
    }>;
    timeoutId: NodeJS.Timeout;
  }>();

  private readonly BATCH_DELAY = 50; // 50ms window to collect batch requests

  async batch<TInput, TOutput>(
    batchKey: string,
    input: TInput,
    batchFn: (inputs: TInput[]) => Promise<TOutput[]>
  ): Promise<TOutput> {
    return new Promise((resolve, reject) => {
      let batch = this.batchQueues.get(batchKey);

      if (!batch) {
        // Create new batch
        batch = {
          requests: [],
          timeoutId: setTimeout(() => {
            this.executeBatch(batchKey, batchFn);
          }, this.BATCH_DELAY)
        };
        this.batchQueues.set(batchKey, batch);
      }

      // Add request to batch
      batch.requests.push({ resolve, reject, data: input });
    });
  }

  private async executeBatch<TInput, TOutput>(
    batchKey: string,
    batchFn: (inputs: TInput[]) => Promise<TOutput[]>
  ) {
    const batch = this.batchQueues.get(batchKey);
    if (!batch) return;

    this.batchQueues.delete(batchKey);

    console.log(`[RequestBatcher] Executing batch: ${batchKey} (${batch.requests.length} requests)`);

    try {
      const inputs = batch.requests.map(req => req.data);
      const results = await batchFn(inputs);

      // Resolve each request with its corresponding result
      batch.requests.forEach((req, index) => {
        if (results[index] !== undefined) {
          req.resolve(results[index]);
        } else {
          req.reject(new Error('Batch result missing for request'));
        }
      });
    } catch (error) {
      // Reject all requests in the batch
      batch.requests.forEach(req => req.reject(error));
    }
  }

  /**
   * Clear all pending requests (useful for cleanup)
   */
  clear() {
    this.pendingRequests.clear();

    // Clear all batch timeouts
    for (const batch of this.batchQueues.values()) {
      clearTimeout(batch.timeoutId);
    }
    this.batchQueues.clear();
  }

  /**
   * Get statistics about pending requests
   */
  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      pendingBatches: this.batchQueues.size,
      batchSizes: Array.from(this.batchQueues.values()).map(b => b.requests.length)
    };
  }
}

// Global request batcher instance
export const requestBatcher = new RequestBatcher();

/**
 * Helper function for parallel data fetching
 * Automatically logs performance metrics
 */
export async function fetchParallel<T extends readonly unknown[]>(
  label: string,
  ...requests: readonly [...{ [K in keyof T]: () => Promise<T[K]> }]
): Promise<T> {
  console.log(`[fetchParallel] Starting: ${label}`);
  const startTime = Date.now();

  try {
    const results = await Promise.all(requests.map(fn => fn()));
    const duration = Date.now() - startTime;

    console.log(`[fetchParallel] Completed: ${label} in ${duration}ms`);

    return results as T;
  } catch (error) {
    console.error(`[fetchParallel] Failed: ${label}`, error);
    throw error;
  }
}

/**
 * Helper for parallel fetching with individual error handling
 */
export async function fetchParallelSettled<T>(
  label: string,
  ...requests: Array<() => Promise<T>>
): Promise<Array<T | null>> {
  console.log(`[fetchParallelSettled] Starting: ${label}`);
  const startTime = Date.now();

  const results = await Promise.allSettled(requests.map(fn => fn()));
  const duration = Date.now() - startTime;

  const successCount = results.filter(r => r.status === 'fulfilled').length;
  console.log(`[fetchParallelSettled] Completed: ${label} in ${duration}ms (${successCount}/${results.length} succeeded)`);

  return results.map(result =>
    result.status === 'fulfilled' ? result.value : null
  );
}
