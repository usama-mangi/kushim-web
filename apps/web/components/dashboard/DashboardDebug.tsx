'use client';

import { useEffect, useState } from 'react';
import { useDashboardStore } from '@/store/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Diagnostic component to debug dashboard data loading
 * Add this temporarily to the dashboard to see what's happening
 */
export function DashboardDebug() {
  const { 
    complianceScore, 
    controls, 
    isLoading, 
    error,
    lastRefresh 
  } = useDashboardStore();
  
  const [authStatus, setAuthStatus] = useState<string>('checking...');

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token') || localStorage.getItem('auth-storage');
    if (token) {
      setAuthStatus('✅ Token found');
    } else {
      setAuthStatus('❌ No token - not logged in');
    }
  }, []);

  return (
    <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
      <CardHeader>
        <CardTitle className="text-sm font-mono">🔍 Dashboard Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs font-mono">
        <div><strong>Auth:</strong> {authStatus}</div>
        <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
        <div><strong>Error:</strong> {error || 'None'}</div>
        <div><strong>Last Refresh:</strong> {lastRefresh?.toLocaleString() || 'Never'}</div>
        
        <div className="pt-2 border-t">
          <div><strong>Compliance Score:</strong></div>
          {complianceScore ? (
            <pre className="text-xs mt-1 p-2 bg-white dark:bg-black rounded">
{JSON.stringify({
  overall: complianceScore.overall,
  passing: complianceScore.passingControls,
  failing: complianceScore.failingControls,
  warning: complianceScore.warningControls,
  total: complianceScore.totalControls
}, null, 2)}
            </pre>
          ) : (
            <div className="text-red-600">❌ NULL - No data loaded</div>
          )}
        </div>

        <div className="pt-2 border-t">
          <div><strong>Controls Array:</strong> {controls.length} items</div>
          {controls.length > 0 && (
            <div>
              <div>First control: {controls[0].name} - {controls[0].status}</div>
            </div>
          )}
        </div>

        <div className="pt-2 border-t text-yellow-700 dark:text-yellow-400">
          <strong>💡 If you see "No token":</strong>
          <div>You need to log in first!</div>
          <div>Go to /auth/signin or /</div>
        </div>

        <div className="pt-2 border-t text-yellow-700 dark:text-yellow-400">
          <strong>💡 If complianceScore is NULL:</strong>
          <div>1. Check browser console for errors</div>
          <div>2. Check Network tab for failed API calls</div>
          <div>3. Try refreshing the page</div>
        </div>
      </CardContent>
    </Card>
  );
}
