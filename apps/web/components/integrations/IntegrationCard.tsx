import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ReactNode, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface IntegrationCardProps {
    id: string;
    name: string;
    description: string;
    icon: ReactNode;
    isConnected: boolean;
    healthScore?: number;
    lastSync?: Date;
    onDisconnect: () => Promise<void>;
    connectionForm: ReactNode;
}

export function IntegrationCard({
    id,
    name,
    description,
    icon,
    isConnected,
    healthScore,
    lastSync,
    onDisconnect,
    connectionForm
}: IntegrationCardProps) {
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [isConnectOpen, setIsConnectOpen] = useState(false);

    const handleDisconnect = async () => {
        setIsDisconnecting(true);
        try {
            await onDisconnect();
        } finally {
            setIsDisconnecting(false);
        }
    };

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <div className="p-2 bg-secondary rounded-lg">
                    {icon}
                </div>
                <div className="flex-1">
                    <CardTitle className="text-xl">{name}</CardTitle>
                    {isConnected && (
                        <Badge variant="outline" className="mt-1 bg-green-500/10 text-green-500 border-green-500/20">
                            Connected
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                <CardDescription>
                    {description}
                </CardDescription>
                
                {isConnected && (
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                            <span>Health Score</span>
                            <span className={healthScore && healthScore < 0.7 ? "text-red-500" : "text-green-500"}>
                                {healthScore !== undefined ? `${(healthScore * 100).toFixed(1)}%` : 'N/A'}
                            </span>
                        </div>
                        {lastSync && (
                            <div className="flex justify-between">
                                <span>Last Sync</span>
                                <span>{formatDistanceToNow(lastSync, { addSuffix: true })}</span>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
            <CardFooter>
                {isConnected ? (
                    <Button 
                        variant="destructive" 
                        className="w-full gap-2" 
                        onClick={handleDisconnect}
                        disabled={isDisconnecting}
                    >
                        {isDisconnecting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                        Disconnect
                    </Button>
                ) : (
                    <Dialog open={isConnectOpen} onOpenChange={setIsConnectOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full">Connect</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Connect {name}</DialogTitle>
                                <DialogDescription>
                                    Enter your credentials to connect {name} to Kushim.
                                </DialogDescription>
                            </DialogHeader>
                            {connectionForm}
                        </DialogContent>
                    </Dialog>
                )}
            </CardFooter>
        </Card>
    );
}
