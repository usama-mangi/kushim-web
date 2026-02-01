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
  domain: z.string().url("Must be a valid URL").includes("atlassian.net", { message: "Must be an atlassian.net domain" }),
  email: z.string().email("Must be a valid email"),
  apiToken: z.string().min(10, "Token is too short"),
  projectKey: z.string().min(2, "Project Key is required").max(10, "Project Key is too long"),
});

export function JiraConnectionForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domain: "",
      email: "",
      apiToken: "",
      projectKey: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsTesting(true);
    setConnectionStatus("idle");
    setErrorMessage("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      console.log("Saving Jira credentials:", values);
      
      setConnectionStatus("success");
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (error) {
      setConnectionStatus("error");
      setErrorMessage("Failed to connect to Jira. Please check your inputs.");
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
              Jira project connected. We will auto-create tickets for failed controls.
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
          name="domain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jira Domain</FormLabel>
              <FormControl>
                <Input placeholder="https://acme.atlassian.net" {...field} />
              </FormControl>
              <FormDescription>
                Your complete Jira Cloud URL.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="admin@acme.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="projectKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Key</FormLabel>
                <FormControl>
                  <Input placeholder="COMP" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="apiToken"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Token</FormLabel>
              <FormControl>
                <Input type="password" placeholder="ATATT..." {...field} />
              </FormControl>
              <FormDescription>
                Create an API token in your Atlassian account settings.
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
              "Connect Jira"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
