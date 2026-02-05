"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Github } from "lucide-react";
import { getGithubRepos, completeGithubSetup } from "@/lib/api/endpoints";
import { toast } from "sonner";

interface GitHubRepoSelectionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function GitHubRepoSelectionModal({
  isOpen,
  onOpenChange,
  onSuccess,
}: GitHubRepoSelectionModalProps) {
  const [repos, setRepos] = useState<string[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRepos();
    }
  }, [isOpen]);

  async function fetchRepos() {
    setIsLoading(true);
    try {
      const data = await getGithubRepos();
      setRepos(data);
    } catch (err) {
      toast.error("Failed to fetch repositories. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const toggleRepo = (repo: string) => {
    setSelectedRepos((prev) =>
      prev.includes(repo) ? prev.filter((r) => r !== repo) : [...prev, repo]
    );
  };

  async function handleSubmit() {
    if (selectedRepos.length === 0) {
      toast.warning("Please select at least one repository to audit.");
      return;
    }

    setIsSubmitting(true);
    try {
      await completeGithubSetup(selectedRepos);
      toast.success("GitHub audit successfully configured!");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to save repository selection.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Github className="h-6 w-6" />
            Selective Repository Auditing
          </DialogTitle>
          <DialogDescription>
            Kushim detected 34+ projects. To avoid security noise and rate limits, please select the top repositories you want to monitor for SOC 2 compliance.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">Scanning your GitHub account...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{repos.length} Repositories Discovered</span>
                <span className="text-muted-foreground">{selectedRepos.length} Selected</span>
              </div>
              <ScrollArea className="h-[300px] w-full rounded-xl border bg-card p-4">
                <div className="grid grid-cols-1 gap-2">
                  {repos.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-10">
                      No repositories found.
                    </p>
                  ) : (
                    repos.map((repo) => (
                      <div 
                        key={repo} 
                        className={`flex items-center space-x-3 p-2 rounded-lg transition-colors cursor-pointer hover:bg-muted/50 ${
                          selectedRepos.includes(repo) ? 'bg-primary/5 border-primary/20' : ''
                        }`}
                        onClick={() => toggleRepo(repo)}
                      >
                        <Checkbox
                          id={repo}
                          checked={selectedRepos.includes(repo)}
                          onCheckedChange={() => toggleRepo(repo)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <label
                          htmlFor={repo}
                          className="text-sm font-medium leading-none cursor-pointer flex-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {repo}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Setup Later
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || isLoading || selectedRepos.length === 0}
            className="px-8 shadow-lg shadow-primary/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Configuring...
              </>
            ) : (
              "Finalize Setup"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
