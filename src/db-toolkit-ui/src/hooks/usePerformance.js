import { useCallback, useMemo, useRef } from 'react';

// Request deduplication hook
export function useRequestDeduplication() {
  const pendingRequests = useRef(new Map());
  
  const dedupedRequest = useCallback(async (key, requestFn) => {
    // If request is already pending, return the existing promise
    if (pendingRequests.current.has(key)) {
      return pendingRequests.current.get(key);
    }
    
    // Create new request
    const promise = requestFn().finally(() => {
      // Clean up after request completes
      pendingRequests.current.delete(key);
    });
    
    pendingRequests.current.set(key, promise);
    return promise;
  }, []);
  
  const clearPendingRequests = useCallback(() => {
    pendingRequests.current.clear();
  }, []);
  
  return { dedupedRequest, clearPendingRequests };
}

// Memoized callback hook with dependency optimization
export function useOptimizedCallback(callback, deps) {
  return useCallback(callback, deps);
}

// Memoized value hook with deep comparison
export function useOptimizedMemo(factory, deps) {
  return useMemo(factory, deps);
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  
  renderCount.current += 1;
  const currentTime = Date.now();
  const timeSinceLastRender = currentTime - lastRenderTime.current;
  lastRenderTime.current = currentTime;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`${componentName} render #${renderCount.current}, time since last: ${timeSinceLastRender}ms`);
  }
  
  return {
    renderCount: renderCount.current,
    timeSinceLastRender
  };
}