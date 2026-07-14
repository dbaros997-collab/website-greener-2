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

const CATEGORIES = [
  { value: "past_paper", label: "Past Paper" },
  { value: "holiday_work", label: "Holiday Work" },
];
const LEVELS = ["All", "O-Level", "A-Level", "S1", "S2", "S3", "S4", "S5", "S6"];

function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FormState {
  title: string;
  subject: string;
  category: string;
  level: string;
  term: string;
  file: File | null;
}

const EMPTY_FORM: FormState = {
  title: "",
  subject: "",
  category: "past_paper",
  level: "All",
  term: "",
  file: null,
};

export function ResourcesSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useListResources();
  const queryKey = getListResourcesQueryKey();
  const items = query.data ?? [];

  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const onError = (err: unknown) => {
    const { title, description } = toFriendlyError(err);
    toast({ title, description, variant: "destructive" });
  };

  const createMutation = useMutation({
    mutationFn: async (state: FormState) => {
      if (!state.file) throw new Error("Please choose a file to upload.");
      const upload = await requestUploadUrl({
        name: state.file.name,
        size: state.file.size,
        contentType: state.file.type || "application/octet-stream",
      });
      const putRes = await fetch(upload.uploadURL, {
        method: "PUT",
        headers: {
          "Content-Type": state.file.type || "application/octet-stream",
        },
        body: state.file,
        credentials: "include",
      });
      if (!putRes.ok) throw new Error(`Upload failed (${putRes.status})`);
      return createResource({
        title: state.title.trim(),
        subject: state.subject.trim(),
        category: state.category,
        level: state.level,
        term: state.term.trim() || null,
        objectPath: upload.objectPath,
        fileName: state.file.name,
        fileSize: state.file.size,
        contentType: state.file.type || "application/octet-stream",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, state }: { id: number; state: FormState }) => {
      let fileFields: {
        objectPath?: string;
        fileName?: string;
        fileSize?: number;
        contentType?: string;
      } = {};

      if (state.file) {
        const upload = await requestUploadUrl({
          name: state.file.name,
          size: state.file.size,
          contentType: state.file.type || "application/octet-stream",
        });
        const putRes = await fetch(upload.uploadURL, {
          method: "PUT",
          headers: {
            "Content-Type": state.file.type || "application/octet-stream",
          },
          body: state.file,
          credentials: "include",
        });
        if (!putRes.ok) throw new Error(`Upload failed (${putRes.status})`);
        fileFields = {
          objectPath: upload.objectPath,
          fileName: state.file.name,
          fileSize: state.file.size,
          contentType: state.file.type || "application/octet-stream",
        };
      }

      return updateResource(id, {
        title: state.title.trim(),
        subject: state.subject.trim(),
        category: state.category,
        level: state.level,
        term: state.term.trim() || null,
        ...fileFields,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteResource(id),
  });

  const reset = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const startCreate = () => {
    setEditingId("new");
    setForm(EMPTY_FORM);
  };

  const startEdit = (item: Resource) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      subject: item.subject,
      category: item.category,
      level: item.level || "All",
      term: item.term ?? "",
      file: null,
    });
  };

  const submit = async () => {
    if (!form.title.trim() || !form.subject.trim()) {
      toast({
        title: "Missing fields",
        description: "Title and subject are required.",
        variant: "destructive",
      });
      return;
    }
    if (editingId === "new" && !form.file) {
      toast({
        title: "File required",
        description: "Please choose a file to upload.",
        variant: "destructive",
      });
      return;
    }
    try {
      setUploading(true);
      if (editingId === "new") {
        await createMutation.mutateAsync(form);
        toast({ title: "Uploaded", description: "Resource added." });
      } else if (typeof editingId === "number") {
        await updateMutation.mutateAsync({ id: editingId, state: form });
        toast({ title: "Saved", description: "Resource updated." });
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
    if (!confirm("Delete this resource? This cannot be undone.")) return;
    try {
      await deleteMutation.mutateAsync(id);
      await invalidate();
      toast({ title: "Deleted", description: "Resource removed." });
    } catch (err) {
      onError(err);
    }
  };

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: items.filter((r: Resource) => r.category === cat.value),
  }));

  const editingExisting =
    typeof editingId === "number"
      ? items.find((r) => r.id === editingId)
      : undefined;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Resources</CardTitle>
          <CardDescription>
            Past papers and holiday work students can download. Edit any item to
            change details or replace the file — the website updates instantly.
          </CardDescription>
        </div>
        {editingId === null ? (
          <Button size="sm" onClick={startCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {editingId !== null ? (
          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {editingId === "new" ? "Add resource" : "Edit resource"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="res-title">
                  Title<span className="text-red-500"> *</span>
                </Label>
                <Input
                  id="res-title"
                  value={form.title}
                  placeholder="UACE Mathematics Paper 1, 2024"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="res-subject">
                  Subject<span className="text-red-500"> *</span>
                </Label>
                <Input
                  id="res-subject"
                  value={form.subject}
                  placeholder="Mathematics"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subject: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Level</Label>
                <Select
                  value={form.level}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, level: value }))
                  }
                >
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
                <Label htmlFor="res-term">Term (optional)</Label>
                <Input
                  id="res-term"
                  value={form.term}
                  placeholder="Term 1"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, term: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="res-file">
                  File
                  {editingId === "new" ? (
                    <span className="text-red-500"> *</span>
                  ) : (
                    <span className="text-muted-foreground">
                      {" "}
                      (optional — leave empty to keep{" "}
                      {editingExisting?.fileName ?? "current file"})
                    </span>
                  )}
                </Label>
                <Input
                  id="res-file"
                  type="file"
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      file: e.target.files?.[0] ?? null,
                    }))
                  }
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
          <p className="text-sm text-muted-foreground">No resources yet.</p>
        ) : (
          grouped.map((group) => (
            <div key={group.value} className="space-y-2">
              <h3 className="text-sm font-semibold text-emerald-900">
                {group.label}
              </h3>
              {group.items.length === 0 ? (
                <p className="text-xs text-muted-foreground">None yet.</p>
              ) : (
                <ul className="divide-y rounded-md border">
                  {group.items.map((r: Resource) => (
                    <li
                      key={r.id}
                      className="flex items-center gap-3 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {r.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[r.subject, r.level, r.term, formatSize(r.fileSize)]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <Badge variant="secondary">{r.fileName}</Badge>
                      <div className="flex items-center gap-2">
                        <a
                          href={`${STORAGE_PREFIX}${r.objectPath}`}
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
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
