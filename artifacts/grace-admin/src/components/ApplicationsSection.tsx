import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useListResources,
  getListResourcesQueryKey,
  createResource,
  updateResource,
  deleteResource,
  requestUploadUrl,
  type Resource,
} from "@workspace/api-client-react";
import { SubmissionsSection } from "@/components/SubmissionsSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { toFriendlyError } from "@/lib/errors";
import { Download, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

const STORAGE_PREFIX = "/api/storage";
const LEVELS = ["All", "S1", "S2", "S3", "S4", "S5", "S6", "O-Level", "A-Level"];

function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function BlankFormsCard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useListResources({ includeHidden: true });
  const queryKey = getListResourcesQueryKey({ includeHidden: true });
  const items = (query.data ?? []).filter(
    (r: Resource) => r.category === "application_form",
  );

  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("All");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const onError = (err: unknown) => {
    const friendly = toFriendlyError(err);
    toast({
      title: friendly.title,
      description: friendly.description,
      variant: "destructive",
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteResource(id),
  });

  const reset = () => {
    setEditingId(null);
    setTitle("");
    setLevel("All");
    setFile(null);
  };

  const startEdit = (item: Resource) => {
    setEditingId(item.id);
    setTitle(item.title);
    setLevel(item.level || "All");
    setFile(null);
  };

  const submit = async () => {
    if (!title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter a title for the form.",
        variant: "destructive",
      });
      return;
    }
    if (editingId === "new" && !file) {
      toast({
        title: "File required",
        description: "Please choose a file to upload.",
        variant: "destructive",
      });
      return;
    }
    try {
      setUploading(true);
      let fileFields: {
        objectPath?: string;
        fileName?: string;
        fileSize?: number;
        contentType?: string;
      } = {};
      if (file) {
        const upload = await requestUploadUrl({
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        });
        const putRes = await fetch(upload.uploadURL, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
          credentials: "include",
        });
        if (!putRes.ok) throw new Error(`Upload failed (${putRes.status})`);
        fileFields = {
          objectPath: upload.objectPath,
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type || "application/octet-stream",
        };
      }

      if (editingId === "new") {
        await createResource({
          title: title.trim(),
          subject: "Application Form",
          category: "application_form",
          level,
          term: null,
          objectPath: fileFields.objectPath!,
          fileName: fileFields.fileName!,
          fileSize: fileFields.fileSize,
          contentType: fileFields.contentType,
        });
        toast({ title: "Uploaded", description: "Application form added." });
      } else if (typeof editingId === "number") {
        await updateResource(editingId, {
          title: title.trim(),
          subject: "Application Form",
          category: "application_form",
          level,
          term: null,
          ...fileFields,
        });
        toast({ title: "Saved", description: "Application form updated." });
      }
      await invalidate();
      reset();
    } catch (err) {
      onError(err);
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this form? This cannot be undone.")) return;
    try {
      await deleteMutation.mutateAsync(id);
      await invalidate();
      toast({ title: "Deleted", description: "Form removed." });
    } catch (err) {
      onError(err);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Blank application forms</CardTitle>
          <CardDescription>
            The empty forms students download, print and fill in. These show up in
            the &ldquo;Application Forms&rdquo; group on the website.
          </CardDescription>
        </div>
        {editingId === null ? (
          <Button size="sm" onClick={() => setEditingId("new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add form
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {editingId !== null ? (
          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {editingId === "new"
                  ? "Add application form"
                  : "Edit application form"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="form-title">
                  Title<span className="text-red-500"> *</span>
                </Label>
                <Input
                  id="form-title"
                  value={title}
                  placeholder="S1 Application Form 2026"
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Entry class</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="form-file">
                  File
                  {editingId === "new" ? (
                    <span className="text-red-500"> *</span>
                  ) : (
                    <span className="text-muted-foreground">
                      {" "}
                      (optional — leave empty to keep current file)
                    </span>
                  )}
                </Label>
                <Input
                  id="form-file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={submit} disabled={uploading}>
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Save
                </Button>
                <Button variant="outline" onClick={reset}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No blank application forms yet. Add one so students can download it.
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {items.map((r: Resource) => (
              <li key={r.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[r.level, formatSize(r.fileSize)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <Badge variant="secondary">{r.fileName}</Badge>
                <div className="flex items-center gap-2">
                  <a
                    href={`${STORAGE_PREFIX}${r.objectPath}?v=${encodeURIComponent(`${r.id}-${r.fileName}-${r.objectPath}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Download"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEdit(r)}
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(r.id)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function ApplicationsSection() {
  return (
    <div className="space-y-6">
      <SubmissionsSection
        filterType="application"
        title="Completed forms received"
        description="Application forms students filled in and sent through the “Submit Your Completed Form” box on the website. Open any attachment, or download everything as a spreadsheet."
        emptyText="No completed application forms yet. They will appear here as soon as a student submits one."
        csvPrefix="grace-applications"
      />
      <BlankFormsCard />
    </div>
  );
}
