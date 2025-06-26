
// Comprehensive error handling and reporting system
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NETWORK = 'network',
  DATABASE = 'database',
  SYNC = 'sync',
  UI = 'ui',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system'
}

export interface AppError {
  id: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: string;
  userId?: string;
  context?: Record<string, any>;
  stack?: string;
  resolved?: boolean;
}

class ErrorHandler {
  private static errors: AppError[] = [];
  private static maxErrors = 1000; // Prevent memory issues

  static handleError(
    error: Error | string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>
  ): AppError {
    const appError: AppError = {
      id: crypto.randomUUID(),
      message: typeof error === 'string' ? error : error.message,
      category,
      severity,
      timestamp: new Date().toISOString(),
      context,
      stack: typeof error === 'object' ? error.stack : undefined,
      resolved: false
    };

    // Add user context if available
    try {
      const authState = JSON.parse(localStorage.getItem('skillzone-auth') || '{}');
      if (authState.state?.user?.id) {
        appError.userId = authState.state.user.id;
      }
    } catch {
      // Ignore if auth state is not available
    }

    this.errors.push(appError);
    
    // Maintain error limit
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log to console based on severity
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        console.error('CRITICAL ERROR:', appError);
        break;
      case ErrorSeverity.HIGH:
        console.error('HIGH SEVERITY ERROR:', appError);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('ERROR:', appError);
        break;
      case ErrorSeverity.LOW:
        console.info('LOW SEVERITY ERROR:', appError);
        break;
    }

    // Store in IndexedDB for persistence
    this.persistError(appError);

    return appError;
  }

  private static async persistError(error: AppError): Promise<void> {
    try {
      const dbName = 'skillzone-errors';
      const request = indexedDB.open(dbName, 1);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('errors')) {
          const store = db.createObjectStore('errors', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('severity', 'severity');
          store.createIndex('category', 'category');
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['errors'], 'readwrite');
        const store = transaction.objectStore('errors');
        store.add(error);
      };
    } catch (dbError) {
      console.warn('Failed to persist error to IndexedDB:', dbError);
    }
  }

  static getErrors(filters?: {
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    userId?: string;
    resolved?: boolean;
  }): AppError[] {
    let filteredErrors = [...this.errors];

    if (filters) {
      if (filters.severity) {
        filteredErrors = filteredErrors.filter(e => e.severity === filters.severity);
      }
      if (filters.category) {
        filteredErrors = filteredErrors.filter(e => e.category === filters.category);
      }
      if (filters.userId) {
        filteredErrors = filteredErrors.filter(e => e.userId === filters.userId);
      }
      if (filters.resolved !== undefined) {
        filteredErrors = filteredErrors.filter(e => e.resolved === filters.resolved);
      }
    }

    return filteredErrors.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static markAsResolved(errorId: string): void {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
    }
  }

  static clearErrors(olderThan?: Date): void {
    if (olderThan) {
      this.errors = this.errors.filter(e => new Date(e.timestamp) > olderThan);
    } else {
      this.errors = [];
    }
  }

  // Helper methods for common error types
  static handleValidationError(message: string, context?: Record<string, any>): AppError {
    return this.handleError(message, ErrorCategory.VALIDATION, ErrorSeverity.MEDIUM, context);
  }

  static handleNetworkError(error: Error, context?: Record<string, any>): AppError {
    return this.handleError(error, ErrorCategory.NETWORK, ErrorSeverity.HIGH, context);
  }

  static handleAuthError(message: string, context?: Record<string, any>): AppError {
    return this.handleError(message, ErrorCategory.AUTHENTICATION, ErrorSeverity.HIGH, context);
  }

  static handleSyncError(error: Error, context?: Record<string, any>): AppError {
    return this.handleError(error, ErrorCategory.SYNC, ErrorSeverity.MEDIUM, context);
  }

  static handleCriticalError(error: Error, context?: Record<string, any>): AppError {
    return this.handleError(error, ErrorCategory.SYSTEM, ErrorSeverity.CRITICAL, context);
  }
}

// Global error boundary for unhandled errors
window.addEventListener('error', (event) => {
  ErrorHandler.handleCriticalError(
    new Error(event.message), 
    { 
      filename: event.filename, 
      lineno: event.lineno, 
      colno: event.colno 
    }
  );
});

window.addEventListener('unhandledrejection', (event) => {
  ErrorHandler.handleCriticalError(
    new Error(event.reason?.message || 'Unhandled Promise Rejection'),
    { reason: event.reason }
  );
});

export { ErrorHandler };
