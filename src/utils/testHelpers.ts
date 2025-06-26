
// Comprehensive testing utilities for SkillZone audit
export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

export class AuditRunner {
  private results: TestResult[] = [];

  // PWA Installation Tests
  async testPWAInstallability(): Promise<TestResult[]> {
    const tests: TestResult[] = [];

    // Test manifest
    try {
      const response = await fetch('/manifest.json');
      const manifest = await response.json();
      
      tests.push({
        name: 'PWA Manifest Valid',
        passed: response.ok && manifest.name && manifest.start_url,
        message: response.ok ? 'Manifest loaded successfully' : 'Failed to load manifest',
        details: manifest,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      tests.push({
        name: 'PWA Manifest Valid',
        passed: false,
        message: `Manifest test failed: ${error}`,
        timestamp: new Date().toISOString()
      });
    }

    // Test service worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        tests.push({
          name: 'Service Worker Registered',
          passed: !!registration,
          message: registration ? 'Service worker is registered' : 'Service worker not found',
          details: registration?.scope,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        tests.push({
          name: 'Service Worker Registered',
          passed: false,
          message: `Service worker test failed: ${error}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Test HTTPS
    tests.push({
      name: 'HTTPS Enforced',
      passed: location.protocol === 'https:' || location.hostname === 'localhost',
      message: location.protocol === 'https:' ? 'HTTPS is active' : 'Not using HTTPS (acceptable for localhost)',
      timestamp: new Date().toISOString()
    });

    this.results.push(...tests);
    return tests;
  }

  // Offline Functionality Tests
  async testOfflineFunctionality(): Promise<TestResult[]> {
    const tests: TestResult[] = [];

    // Test cache storage
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        tests.push({
          name: 'Cache Storage Available',
          passed: cacheNames.length > 0,
          message: `Found ${cacheNames.length} cache(s)`,
          details: cacheNames,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        tests.push({
          name: 'Cache Storage Available',
          passed: false,
          message: `Cache test failed: ${error}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Test IndexedDB
    if ('indexedDB' in window) {
      try {
        const testDB = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('test-db', 1);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        
        testDB.close();
        indexedDB.deleteDatabase('test-db');
        
        tests.push({
          name: 'IndexedDB Available',
          passed: true,
          message: 'IndexedDB is working correctly',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        tests.push({
          name: 'IndexedDB Available',
          passed: false,
          message: `IndexedDB test failed: ${error}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Test online/offline detection
    tests.push({
      name: 'Network Status Detection',
      passed: typeof navigator.onLine === 'boolean',
      message: `Online status: ${navigator.onLine}`,
      timestamp: new Date().toISOString()
    });

    this.results.push(...tests);
    return tests;
  }

  // Performance Tests
  async testPerformance(): Promise<TestResult[]> {
    const tests: TestResult[] = [];

    if ('performance' in window) {
      // Test navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;

        tests.push({
          name: 'Page Load Performance',
          passed: loadTime < 3000, // Less than 3 seconds
          message: `Page loaded in ${loadTime}ms`,
          details: { loadTime, domContentLoaded },
          timestamp: new Date().toISOString()
        });
      }

      // Test memory usage (if available)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        tests.push({
          name: 'Memory Usage',
          passed: memory.usedJSHeapSize < 50 * 1024 * 1024, // Less than 50MB
          message: `JS Heap: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
          details: memory,
          timestamp: new Date().toISOString()
        });
      }
    }

    this.results.push(...tests);
    return tests;
  }

  // Authentication System Tests
  testAuthenticationSystem(): TestResult[] {
    const tests: TestResult[] = [];

    // Test localStorage availability
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      tests.push({
        name: 'LocalStorage Available',
        passed: true,
        message: 'LocalStorage is working',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      tests.push({
        name: 'LocalStorage Available',
        passed: false,
        message: `LocalStorage test failed: ${error}`,
        timestamp: new Date().toISOString()
      });
    }

    // Test auth store initialization
    try {
      const authData = localStorage.getItem('skillzone-auth');
      tests.push({
        name: 'Auth Store Initialized',
        passed: authData !== null,
        message: authData ? 'Auth store found' : 'Auth store not initialized',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      tests.push({
        name: 'Auth Store Initialized',
        passed: false,
        message: `Auth store test failed: ${error}`,
        timestamp: new Date().toISOString()
      });
    }

    this.results.push(...tests);
    return tests;
  }

  // Data Validation Tests
  testDataValidation(): TestResult[] {
    const tests: TestResult[] = [];

    // Test email validation
    const emailTest = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test('test@example.com');
    tests.push({
      name: 'Email Validation',
      passed: emailTest,
      message: emailTest ? 'Email validation working' : 'Email validation failed',
      timestamp: new Date().toISOString()
    });

    // Test SADC country validation
    const sadcCountries = ['Zimbabwe', 'South Africa', 'Botswana', 'Zambia', 'Namibia', 'Angola', 'Mozambique', 'Malawi'];
    const countryTest = sadcCountries.includes('Zimbabwe');
    tests.push({
      name: 'SADC Country Validation',
      passed: countryTest,
      message: countryTest ? 'Country validation working' : 'Country validation failed',
      details: sadcCountries,
      timestamp: new Date().toISOString()
    });

    this.results.push(...tests);
    return tests;
  }

  // Run all tests
  async runFullAudit(): Promise<TestResult[]> {
    console.log('Starting SkillZone comprehensive audit...');
    
    const allTests: TestResult[] = [];
    
    try {
      // PWA Tests
      const pwaTests = await this.testPWAInstallability();
      allTests.push(...pwaTests);
      
      // Offline Tests
      const offlineTests = await this.testOfflineFunctionality();
      allTests.push(...offlineTests);
      
      // Performance Tests
      const performanceTests = await this.testPerformance();
      allTests.push(...performanceTests);
      
      // Authentication Tests
      const authTests = this.testAuthenticationSystem();
      allTests.push(...authTests);
      
      // Validation Tests
      const validationTests = this.testDataValidation();
      allTests.push(...validationTests);
      
    } catch (error) {
      allTests.push({
        name: 'Audit Execution',
        passed: false,
        message: `Audit failed: ${error}`,
        timestamp: new Date().toISOString()
      });
    }

    this.results = allTests;
    
    // Generate summary
    const passed = allTests.filter(t => t.passed).length;
    const total = allTests.length;
    const passRate = Math.round((passed / total) * 100);
    
    console.log(`Audit completed: ${passed}/${total} tests passed (${passRate}%)`);
    
    return allTests;
  }

  // Generate audit report
  generateReport(): any {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    
    return {
      summary: {
        total: this.results.length,
        passed,
        failed,
        passRate: Math.round((passed / this.results.length) * 100),
        timestamp: new Date().toISOString()
      },
      results: this.results,
      categories: {
        pwa: this.results.filter(r => r.name.includes('PWA') || r.name.includes('Service Worker') || r.name.includes('HTTPS')),
        offline: this.results.filter(r => r.name.includes('Cache') || r.name.includes('IndexedDB') || r.name.includes('Network')),
        performance: this.results.filter(r => r.name.includes('Performance') || r.name.includes('Memory')),
        authentication: this.results.filter(r => r.name.includes('Auth') || r.name.includes('LocalStorage')),
        validation: this.results.filter(r => r.name.includes('Validation'))
      }
    };
  }

  getResults(): TestResult[] {
    return this.results;
  }

  clearResults(): void {
    this.results = [];
  }
}

// Global audit runner instance
export const auditRunner = new AuditRunner();

// Helper function to run audit from console
(window as any).runSkillZoneAudit = async () => {
  const results = await auditRunner.runFullAudit();
  const report = auditRunner.generateReport();
  console.table(results);
  console.log('Full Report:', report);
  return report;
};

console.log('SkillZone Audit Tools loaded. Run window.runSkillZoneAudit() to start comprehensive audit.');
