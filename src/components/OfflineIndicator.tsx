
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, Wifi, Sync, AlertCircle, CheckCircle } from 'lucide-react';
import { useSyncStore } from '@/stores/syncStore';

const OfflineIndicator = () => {
  const { 
    isOnline, 
    isSyncing, 
    operations, 
    lastSyncAttempt,
    syncOperations,
    retryFailedOperations,
    clearCompletedOperations 
  } = useSyncStore();

  const pendingOps = operations.filter(op => op.status === 'pending');
  const failedOps = operations.filter(op => op.status === 'failed');
  const completedOps = operations.filter(op => op.status === 'completed');

  if (isOnline && pendingOps.length === 0 && failedOps.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className={`${!isOnline ? 'border-orange-300 bg-orange-50' : 'border-blue-300 bg-blue-50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-orange-600" />
            )}
            <Badge variant={isOnline ? "default" : "secondary"}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            {isSyncing && <Sync className="h-4 w-4 animate-spin text-blue-600" />}
          </div>

          {pendingOps.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <AlertCircle className="h-3 w-3" />
              <span>{pendingOps.length} pending sync{pendingOps.length > 1 ? 's' : ''}</span>
            </div>
          )}

          {failedOps.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-red-600 mb-1">
              <AlertCircle className="h-3 w-3" />
              <span>{failedOps.length} failed sync{failedOps.length > 1 ? 's' : ''}</span>
            </div>
          )}

          {completedOps.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600 mb-1">
              <CheckCircle className="h-3 w-3" />
              <span>{completedOps.length} completed sync{completedOps.length > 1 ? 's' : ''}</span>
            </div>
          )}

          {lastSyncAttempt && (
            <p className="text-xs text-gray-500 mb-2">
              Last sync: {new Date(lastSyncAttempt).toLocaleTimeString()}
            </p>
          )}

          <div className="flex gap-2">
            {isOnline && (pendingOps.length > 0 || failedOps.length > 0) && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={failedOps.length > 0 ? retryFailedOperations : syncOperations}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <>
                    <Sync className="h-3 w-3 mr-1 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Sync className="h-3 w-3 mr-1" />
                    {failedOps.length > 0 ? 'Retry' : 'Sync Now'}
                  </>
                )}
              </Button>
            )}

            {completedOps.length > 0 && (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={clearCompletedOperations}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineIndicator;
