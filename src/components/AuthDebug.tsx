"use client";

import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/utils/supabase";
import { useState } from "react";

export function AuthDebug() {
  const { user, role, loading, isAuthenticated, isAdmin, isSeller, isUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [dbInfo, setDbInfo] = useState<any>(null);

  const checkDatabase = async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      const { data, error } = await supabase()
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setDbInfo({ data, error });
    } catch (err) {
      setDbInfo({ error: err });
    }
    setRefreshing(false);
  };

  if (!user) return null;

  return (
    <Card className="ultra-dark-card fixed bottom-4 right-4 z-50 max-w-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          Auth Debug
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={checkDatabase}
            disabled={refreshing}
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div>
          <span className="text-muted-foreground">Email:</span> {user?.email}
        </div>
        <div>
          <span className="text-muted-foreground">User ID:</span> {user?.id?.slice(0, 8)}...
        </div>
        <div>
          <span className="text-muted-foreground">Hook Role:</span> <Badge variant="outline">{role}</Badge>
        </div>
        <div>
          <span className="text-muted-foreground">Loading:</span> {loading ? "Yes" : "No"}
        </div>
        <div>
          <span className="text-muted-foreground">Authenticated:</span> {isAuthenticated ? "Yes" : "No"}
        </div>
        <div>
          <span className="text-muted-foreground">Admin:</span> {isAdmin ? "Yes" : "No"}
        </div>
        <div>
          <span className="text-muted-foreground">Seller:</span> {isSeller ? "Yes" : "No"}
        </div>
        <div>
          <span className="text-muted-foreground">User:</span> {isUser ? "Yes" : "No"}
        </div>
        
        {dbInfo && (
          <div className="border-t border-muted pt-2 mt-2">
            <div className="text-muted-foreground text-xs mb-1">Database Info:</div>
            {dbInfo.error ? (
              <div className="text-red-400 text-xs">Error: {JSON.stringify(dbInfo.error)}</div>
            ) : dbInfo.data ? (
              <div className="space-y-1">
                <div><span className="text-muted-foreground">DB Role:</span> <Badge variant="outline">{dbInfo.data.role}</Badge></div>
                <div><span className="text-muted-foreground">Created:</span> {new Date(dbInfo.data.created_at).toLocaleDateString()}</div>
                <div><span className="text-muted-foreground">Updated:</span> {new Date(dbInfo.data.updated_at).toLocaleDateString()}</div>
              </div>
            ) : (
              <div className="text-muted-foreground text-xs">No data</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
