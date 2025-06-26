
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { PerformanceMonitor } from '@/utils/performanceMonitor'

// Initialize performance monitoring
PerformanceMonitor.measurePageLoad();

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available
                console.log('New service worker available');
                
                // Optionally show update notification
                if (confirm('A new version of SkillZone is available. Reload to update?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });

        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'SYNC_START') {
            console.log('Background sync started');
          } else if (event.data.type === 'SYNC_SUCCESS') {
            console.log('Background sync completed successfully');
          } else if (event.data.type === 'SYNC_ERROR') {
            console.error('Background sync failed:', event.data.error);
          }
        });

        // Register for background sync if supported
        if ('sync' in (window as any).ServiceWorkerRegistration.prototype) {
          (registration as any).sync?.register('skillzone-sync').catch(console.error);
        }

        // Register for periodic background sync if supported
        if ('periodicSync' in (window as any).ServiceWorkerRegistration.prototype) {
          (registration as any).periodicSync?.register('skillzone-periodic-sync', {
            minInterval: 24 * 60 * 60 * 1000, // 24 hours
          }).catch(console.error);
        }
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });

  // Handle service worker controller changes
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

// Request notification permission for push notifications
if ('Notification' in window && 'serviceWorker' in navigator) {
  if (Notification.permission === 'default') {
    // Don't request immediately, let user initiate
    console.log('Notification permission not granted yet');
  }
}

// Initialize app
const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(<App />);

// Add global error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent the default browser behavior
});

// Add performance observer for monitoring
if ('PerformanceObserver' in window) {
  try {
    // Monitor long tasks
    const longTaskObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 50) { // Tasks longer than 50ms
          console.warn('Long task detected:', entry.duration + 'ms');
          PerformanceMonitor.recordMetric('long-task', entry.duration, 'interaction');
        }
      });
    });
    longTaskObserver.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    console.warn('Long task observer not supported:', error);
  }
}

console.log('SkillZone PWA initialized successfully');
