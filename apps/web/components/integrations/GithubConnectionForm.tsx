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
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  personalAccessToken: z.string().min(10, "Token is too short"),
  organization: z.string().min(1, "Organization name is required"),
});

export function GithubConnectionForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      personalAccessToken: "",
      organization: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsTesting(true);
    setConnectionStatus("idle");
    setErrorMessage("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      console.log("Saving GitHub credentials:", values);
      
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {connectionStatus === "success" && (
          <Alert className="bg-success/10 text-success border-success/20">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Connected Successfully</AlertTitle>
            <AlertDescription>
              GitHub organization connected. We are scanning your repositories now.
            </AlertDescription>
          </Alert>
        )}

        {connectionStatus === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Failed</AlertTitle>
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
              <FormDescription>
                A classic PAT with 'repo' and 'read:org' scopes.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="organization"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name</FormLabel>
              <FormControl>
                <Input placeholder="acme-inc" {...field} />
              </FormControl>
              <FormDescription>
                The GitHub organization handle content to monitor.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isTesting}>
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect GitHub"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
