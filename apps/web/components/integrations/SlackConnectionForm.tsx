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
  webhookUrl: z.string().url("Must be a valid URL").startsWith("https://hooks.slack.com/", { message: "Must be a Slack webhook URL" }),
  channel: z.string().min(1, "Channel name is required").startsWith("#", { message: "Channel must start with #" }),
});

export function SlackConnectionForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      webhookUrl: "",
      channel: "#compliance-alerts",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsTesting(true);
    setConnectionStatus("idle");
    setErrorMessage("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      console.log("Saving Slack credentials:", values);
      
      setConnectionStatus("success");
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (error) {
      setConnectionStatus("error");
      setErrorMessage("Failed to connect to Slack. Please check your webhook URL.");
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
              Slack connected. Test alert sent to channel.
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
          name="webhookUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Webhook URL</FormLabel>
              <FormControl>
                <Input placeholder="https://hooks.slack.com/services/..." {...field} />
              </FormControl>
              <FormDescription>
                Incoming Webhook URL for posting messages.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="channel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Channel Name</FormLabel>
              <FormControl>
                <Input placeholder="#compliance-alerts" {...field} />
              </FormControl>
              <FormDescription>
                The channel where alerts will be posted.
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
              "Connect Slack"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
