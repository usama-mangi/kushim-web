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
  domain: z.string().url("Must be a valid URL").includes("okta.com", { message: "Must be an okta.com domain" }),
  apiToken: z.string().min(10, "Token is too short"),
});

export function OktaConnectionForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domain: "",
      apiToken: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsTesting(true);
    setConnectionStatus("idle");
    setErrorMessage("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      console.log("Saving Okta credentials:", values);
      
      setConnectionStatus("success");
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (error) {
      setConnectionStatus("error");
      setErrorMessage("Failed to connect to Okta. Please check your domain and token.");
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
              Okta organization connected. We are syncing policies now.
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
              <FormLabel>Okta Domain</FormLabel>
              <FormControl>
                <Input placeholder="https://dev-123456.okta.com" {...field} />
              </FormControl>
              <FormDescription>
                Your Okta organization URL.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="apiToken"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Token</FormLabel>
              <FormControl>
                <Input type="password" placeholder="00..." {...field} />
              </FormControl>
              <FormDescription>
                An API token with read-only administrator permissions.
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
              "Connect Okta"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
