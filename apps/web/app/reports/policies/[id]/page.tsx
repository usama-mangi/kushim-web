"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft,
  FileText,
  Download,
  Clock,
  User,
  CheckCircle2,
  MessageSquare,
  Send,
  History,
  FileDown,
  Edit,
  Eye
} from "lucide-react";
import { toast } from "sonner";

interface PolicyVersion {
  version: string;
  date: string;
  author: string;
  changes: string;
  status: "approved" | "pending" | "rejected";
}

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

// StatusBadge component - defined outside of PolicyDetailPage
function StatusBadge({ status }: { status: PolicyVersion["status"] }) {
  const styles = {
    approved: "border-[var(--pass)] text-[var(--pass)]",
    pending: "border-[var(--warn)] text-[var(--warn)]",
    rejected: "border-[var(--fail)] text-[var(--fail)]",
  };
  
  return (
    <Badge variant="outline" className={`rounded-none ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// Mock policy data
const mockPolicy = {
  id: "access-control-policy",
  title: "Access Control Policy",
  category: "Security",
  framework: "SOC 2",
  status: "approved" as const,
  lastUpdated: "2024-01-15",
  owner: "Jane Smith",
  reviewDue: "2024-07-15",
  content: `# Access Control Policy

## 1. Purpose

This policy establishes the requirements for access control to information systems and data within the organization. It ensures that access to systems and data is granted based on the principle of least privilege and business need.

## 2. Scope

This policy applies to:
- All employees, contractors, and third-party users
- All information systems and applications
- All data stored, processed, or transmitted by the organization

## 3. Policy Statements

### 3.1 Access Request Process

All access requests must:
1. Be submitted through the official access request system
2. Include business justification
3. Be approved by the data owner and manager
4. Be reviewed and provisioned by IT within 5 business days

### 3.2 Authentication Requirements

- Multi-factor authentication (MFA) is required for all remote access
- Passwords must meet complexity requirements (minimum 12 characters)
- Service accounts must use API keys or certificates

### 3.3 Access Reviews

- User access must be reviewed quarterly
- Privileged access must be reviewed monthly
- Access must be revoked within 24 hours of termination

## 4. Enforcement

Violations of this policy may result in disciplinary action up to and including termination.

## 5. Related Controls

- CC6.1 - Logical Access Security
- CC6.2 - System Account Management
- CC6.3 - Access Provisioning

---
*Document Classification: Internal*
*Next Review Date: July 2024*
`,
};

const mockVersions: PolicyVersion[] = [
  { version: "3.0", date: "2024-01-15", author: "Jane Smith", changes: "Updated MFA requirements", status: "approved" },
  { version: "2.1", date: "2023-10-01", author: "John Doe", changes: "Added service account guidelines", status: "approved" },
  { version: "2.0", date: "2023-06-15", author: "Jane Smith", changes: "Major revision for SOC 2 compliance", status: "approved" },
  { version: "1.0", date: "2023-01-01", author: "Admin", changes: "Initial policy creation", status: "approved" },
];

const mockComments: Comment[] = [
  { id: "1", author: "John Doe", content: "Should we increase password length to 14 characters?", timestamp: "2024-01-14T10:30:00Z" },
  { id: "2", author: "Jane Smith", content: "Good point. Let's discuss in the next security review.", timestamp: "2024-01-14T14:15:00Z" },
];

export default function PolicyDetailPage() {
  const params = useParams();
  const router = useRouter();
  // const policyId = params.id as string; // Available for future use with API
  
  const [isEditing, setIsEditing] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>(mockComments);

  const handleExport = (format: string) => {
    toast.success(`Exporting as ${format}...`);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      author: "Current User",
      content: newComment,
      timestamp: new Date().toISOString(),
    };
    
    setComments([...comments, comment]);
    setNewComment("");
    toast.success("Comment added");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push("/policies")}
            className="rounded-none mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="secondary" className="rounded-none font-mono">
                {mockPolicy.framework}
              </Badge>
              <Badge variant="outline" className="rounded-none">
                {mockPolicy.category}
              </Badge>
              <StatusBadge status={mockPolicy.status} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight font-mono">{mockPolicy.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {mockPolicy.owner}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Updated {formatDate(mockPolicy.lastUpdated)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(!isEditing)}
              className="rounded-none"
            >
              {isEditing ? <Eye className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
              {isEditing ? "Preview" : "Edit"}
            </Button>
            <Button variant="outline" size="sm" className="rounded-none" onClick={() => handleExport("PDF")}>
              <FileDown className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar - Version History */}
          <aside className="lg:col-span-3 order-2 lg:order-1">
            <Card className="rounded-none shadow-sm sticky top-24">
              <CardHeader className="flex flex-row items-center gap-2">
                <History className="h-5 w-5" />
                <CardTitle className="font-mono text-base">Version History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 p-0">
                {mockVersions.map((version, index) => (
                  <div 
                    key={version.version}
                    className={`p-4 border-b last:border-b-0 ${index === 0 ? "bg-muted/50" : ""} hover:bg-muted/30 cursor-pointer transition-colors`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-sm">v{version.version}</span>
                      <StatusBadge status={version.status} />
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {formatDate(version.date)} by {version.author}
                    </div>
                    <div className="text-xs">{version.changes}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>

          {/* Main Content - Document Viewer */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <Card className="rounded-none shadow-sm">
              <CardContent className="p-8">
                {isEditing ? (
                  <Textarea 
                    className="min-h-[600px] font-mono text-sm rounded-none"
                    defaultValue={mockPolicy.content}
                  />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <div className="font-mono text-sm whitespace-pre-wrap leading-relaxed">
                      {mockPolicy.content.split('\n').map((line, i) => {
                        if (line.startsWith('# ')) {
                          return <h1 key={i} className="text-2xl font-bold mt-0 mb-4 font-mono">{line.slice(2)}</h1>;
                        }
                        if (line.startsWith('## ')) {
                          return <h2 key={i} className="text-xl font-bold mt-8 mb-3 font-mono">{line.slice(3)}</h2>;
                        }
                        if (line.startsWith('### ')) {
                          return <h3 key={i} className="text-lg font-bold mt-6 mb-2 font-mono">{line.slice(4)}</h3>;
                        }
                        if (line.startsWith('- ')) {
                          return <li key={i} className="ml-4">{line.slice(2)}</li>;
                        }
                        if (line.match(/^\d+\. /)) {
                          return <li key={i} className="ml-4">{line}</li>;
                        }
                        if (line.startsWith('---')) {
                          return <hr key={i} className="my-6" />;
                        }
                        if (line.startsWith('*') && line.endsWith('*')) {
                          return <p key={i} className="text-muted-foreground italic text-xs">{line.slice(1, -1)}</p>;
                        }
                        if (line.trim() === '') {
                          return <div key={i} className="h-4" />;
                        }
                        return <p key={i} className="mb-2">{line}</p>;
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Actions & Comments */}
          <aside className="lg:col-span-3 order-3 space-y-6">
            {/* Approval Workflow */}
            <Card className="border-l-4 border-l-[var(--pass)] rounded-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-mono text-base">Approval Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Legal Review</span>
                  <CheckCircle2 className="h-5 w-5 text-[var(--pass)]" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Security Review</span>
                  <CheckCircle2 className="h-5 w-5 text-[var(--pass)]" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Management Approval</span>
                  <CheckCircle2 className="h-5 w-5 text-[var(--pass)]" />
                </div>
                <div className="pt-3 border-t text-xs text-muted-foreground">
                  Next review due: {formatDate(mockPolicy.reviewDue)}
                </div>
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card className="rounded-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-mono text-base">Export Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start rounded-none"
                  onClick={() => handleExport("PDF")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as PDF
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start rounded-none"
                  onClick={() => handleExport("DOCX")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export as Word
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start rounded-none"
                  onClick={() => handleExport("MD")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export as Markdown
                </Button>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card className="rounded-none shadow-sm">
              <CardHeader className="flex flex-row items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <CardTitle className="font-mono text-base">Comments ({comments.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-l-2 border-muted pl-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{comment.author}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                  </div>
                ))}
                
                <div className="pt-3 border-t">
                  <Textarea 
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="rounded-none text-sm mb-2"
                    rows={2}
                  />
                  <Button 
                    size="sm" 
                    className="rounded-none"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Post Comment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
