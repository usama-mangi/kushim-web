"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, CheckCircle2, AlertCircle, Github, Settings2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { connectIntegration, getOAuthAuthorizeUrl } from "@/lib/api/endpoints";
import { GitHubRepoSelectionModal } from "./GitHubRepoSelectionModal";
import { toast } from "sonner";

const formSchema = z.object({
  personalAccessToken: z.string().min(10, "Token is too short"),
  organization: z.string().min(1, "Organization name is required"),
  repo: z.string().optional(),
});

export function GithubConnectionForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isTesting, setIsTesting] = useState(false);
  const [isStartingOAuth, setIsStartingOAuth] = useState(false);
  const [showLegacyForm, setShowLegacyForm] = useState(false);
  const [isRepoModalOpen, setIsRepoModalOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      personalAccessToken: "",
      organization: "",
      repo: "",
    },
  });

  const handleOAuthConnect = async () => {
    try {
      setIsStartingOAuth(true);
      const { url } = await getOAuthAuthorizeUrl("github");
      window.location.href = url;
    } catch (error) {
      toast.error("Failed to start GitHub authorization.");
      setIsStartingOAuth(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsTesting(true);
    setConnectionStatus("idle");
    setErrorMessage("");

    try {
      await connectIntegration("GITHUB", values);
      setConnectionStatus("success");
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (error) {
      setConnectionStatus("error");
      setErrorMessage("Failed to connect to GitHub. Please check your token and organization.");
      console.error(error);
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border rounded-xl p-6 text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-background rounded-full flex items-center justify-center shadow-sm">
          <Github className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">GitHub App Selection</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            The easiest way to connect. Just authorize and select the specific repositories you want to monitor.
          </p>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button 
            className="w-full h-11" 
            onClick={handleOAuthConnect} 
            disabled={isStartingOAuth}
          >
            {isStartingOAuth ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Github className="mr-2 h-4 w-4" />
            )}
            Connect via GitHub OAuth
          </Button>

          <Button 
            variant="outline" 
            className="w-full h-11"
            onClick={() => setIsRepoModalOpen(true)}
          >
            <Settings2 className="mr-2 h-4 w-4" />
            Manage Monitored Repositories
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or legacy setup</span>
        </div>
      </div>

      {!showLegacyForm ? (
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-muted-foreground"
          onClick={() => setShowLegacyForm(true)}
        >
          Use Personal Access Token (Advanced)
        </Button>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {connectionStatus === "success" && (
              <Alert className="bg-success/10 text-success border-success/20">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>Connected via PAT.</AlertDescription>
              </Alert>
            )}

            {connectionStatus === "error" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="personalAccessToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Access Token</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="ghp_..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User/Org Name</FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isTesting}>
              {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect with PAT
            </Button>
          </form>
        </Form>
      )}

      <GitHubRepoSelectionModal 
        isOpen={isRepoModalOpen}
        onOpenChange={setIsRepoModalOpen}
        onSuccess={() => {
          if (onSuccess) onSuccess();
        }}
      />
    </div>
  );
}
