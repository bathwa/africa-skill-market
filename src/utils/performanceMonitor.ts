
// Performance monitoring and optimization utilities
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: string;
  category: 'load' | 'interaction' | 'navigation' | 'resource';
}

class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static maxMetrics = 500;

  static recordMetric(name: string, value: number, category: PerformanceMetric['category']) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date().toISOString(),
      category
    };

    this.metrics.push(metric);
    
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log significant performance issues
    if (this.isPerformanceIssue(name, value)) {
      console.warn(`Performance issue detected: ${name} = ${value}ms`);
    }
  }

  private static isPerformanceIssue(name: string, value: number): boolean {
    const thresholds: Record<string, number> = {
      'page-load': 3000,
      'component-render': 100,
      'api-call': 5000,
      'database-query': 1000,
      'image-load': 2000
    };

    return thresholds[name] && value > thresholds[name];
  }

  static measurePageLoad() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          
          if (perfData) {
            this.recordMetric('dom-content-loaded', perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart, 'load');
            this.recordMetric('page-load', perfData.loadEventEnd - perfData.loadEventStart, 'load');
            this.recordMetric('first-paint', perfData.domContentLoadedEventEnd - perfData.fetchStart, 'load');
          }

          // Core Web Vitals
          this.measureWebVitals();
        }, 0);
      });
    }
  }

  private static measureWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('lcp', lastEntry.startTime, 'load');
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.recordMetric('fid', entry.processingStart - entry.startTime, 'interaction');
          });
        });
        fidObserver.observe({ type: 'first-input', buffered: true });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.recordMetric('cls', clsValue * 1000, 'load'); // Convert to ms for consistency
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (error) {
        console.warn('Performance observer not supported:', error);
      }
    }
  }

  static measureComponentRender(componentName: string, renderTime: number) {
    this.recordMetric(`component-render-${componentName}`, renderTime, 'interaction');
  }

  static measureApiCall(endpoint: string, duration: number) {
    this.recordMetric(`api-${endpoint}`, duration, 'resource');
  }

  static measureNavigation(from: string, to: string, duration: number) {
    this.recordMetric(`navigation-${from}-to-${to}`, duration, 'navigation');
  }

  static getMetrics(category?: PerformanceMetric['category']): PerformanceMetric[] {
    if (category) {
      return this.metrics.filter(m => m.category === category);
    }
    return [...this.metrics];
  }

  static getAverageMetric(name: string): number {
    const matchingMetrics = this.metrics.filter(m => m.name === name);
    if (matchingMetrics.length === 0) return 0;
    
    const sum = matchingMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / matchingMetrics.length;
  }

  static generateReport(): Record<string, any> {
    const report: Record<string, any> = {
      timestamp: new Date().toISOString(),
      totalMetrics: this.metrics.length,
      categories: {} as Record<string, any>
    };

    // Group by category
    ['load', 'interaction', 'navigation', 'resource'].forEach(category => {
      const categoryMetrics = this.getMetrics(category as PerformanceMetric['category']);
      report.categories[category] = {
        count: categoryMetrics.length,
        averages: {} as Record<string, number>
      };

      // Calculate averages for each metric name in this category
      const metricNames = [...new Set(categoryMetrics.map(m => m.name))];
      metricNames.forEach(name => {
        report.categories[category].averages[name] = this.getAverageMetric(name);
      });
    });

    return report;
  }
}

// Higher-order component for measuring render performance
export function withPerformanceMonitoring<T extends {}>(
  WrappedComponent: React.ComponentType<T>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: T) {
    const startTime = performance.now();
    
    React.useEffect(() => {
      const endTime = performance.now();
      PerformanceMonitor.measureComponentRender(componentName, endTime - startTime);
    });

    return React.createElement(WrappedComponent, props);
  };
}

// Hook for measuring function performance
export function usePerformanceTimer(operationName: string) {
  const startTimer = React.useCallback(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      PerformanceMonitor.recordMetric(operationName, endTime - startTime, 'interaction');
    };
  }, [operationName]);

  return startTimer;
}

// Initialize performance monitoring
PerformanceMonitor.measurePageLoad();

export { PerformanceMonitor };
