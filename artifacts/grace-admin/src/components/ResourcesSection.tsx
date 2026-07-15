import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useListResources,
  useListResourceCategories,
  getListResourcesQueryKey,
  getListResourceCategoriesQueryKey,
  createResource,
  updateResource,
  deleteResource,
  createResourceCategory,
  updateResourceCategory,
  deleteResourceCategory,
  requestUploadUrl,
  type Resource,
  type ResourceCategory,
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
import {
  Archive,
  ArchiveRestore,
  Download,
  FolderPlus,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

const STORAGE_PREFIX = "/api/storage";
const adminParams = { includeHidden: true } as const;
const LEVELS = ["All", "O-Level", "A-Level", "S1", "S2", "S3", "S4", "S5", "S6"];
/** Managed in the Applications tab — hide from Resources folder admin. */
const APPLICATIONS_SLUG = "application_form";

function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FormState {
  title: string;
  subject: string;
  categoryId: number | null;
  level: string;
  term: string;
  file: File | null;
}

function ResourceList({
  title,
  description,
  items,
  categories,
  emptyLabel,
  onEdit,
  onRemove,
  onToggleArchive,
  onMove,
}: {
  title: string;
  description: string;
  items: Resource[];
  categories: ResourceCategory[];
  emptyLabel: string;
  onEdit: (item: Resource) => void;
  onRemove: (id: number) => void;
  onToggleArchive: (item: Resource) => void;
  onMove: (item: Resource, categoryId: number) => void;
}) {
  const grouped = categories.map((cat) => ({
    ...cat,
    items: items.filter(
      (r) =>
        r.categoryId === cat.id ||
        (!r.categoryId && r.category === cat.slug),
    ),
  }));
  const uncategorized = items.filter(
    (r) =>
      !categories.some(
        (c) => r.categoryId === c.id || (!r.categoryId && r.category === c.slug),
      ),
  );

  return (
    <div className="space-y-3 rounded-lg border bg-white p-4">
      <div>
        <h3 className="text-sm font-semibold text-emerald-900">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <>
          {grouped.map((group) =>
            group.items.length === 0 ? null : (
              <div key={group.id} className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  {group.name}
                </h4>
                <ul className="divide-y rounded-md border">
                  {group.items.map((r) => (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-center gap-2 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1 basis-[12rem]">
                        <p className="truncate text-sm font-medium">{r.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[r.subject, r.level, r.term, formatSize(r.fileSize)]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      {!r.isVisible ? (
                        <Badge variant="secondary">Archived</Badge>
                      ) : null}
                      <Select
                        value={String(
                          r.categoryId ??
                            categories.find((c) => c.slug === r.category)?.id ??
                            "",
                        )}
                        onValueChange={(value) =>
                          onMove(r, Number(value))
                        }
                      >
                        <SelectTrigger className="h-8 w-[9.5rem] text-xs">
                          <SelectValue placeholder="Folder" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Badge variant="secondary">{r.fileName}</Badge>
                      <div className="flex items-center gap-1">
                        <a
                          href={`${STORAGE_PREFIX}${r.objectPath}?v=${encodeURIComponent(`${r.id}-${r.fileName}-${r.objectPath}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Download"
                          className="p-2 text-muted-foreground hover:text-foreground"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onToggleArchive(r)}
                          aria-label={
                            r.isVisible ? "Archive" : "Put back on website"
                          }
                          title={
                            r.isVisible
                              ? "Archive — hide from the public website"
                              : "Restore — show on the public website"
                          }
                        >
                          {r.isVisible ? (
                            <Archive className="h-4 w-4" />
                          ) : (
                            <ArchiveRestore className="h-4 w-4 text-emerald-700" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onEdit(r)}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onRemove(r.id)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}
          {uncategorized.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                Uncategorized
              </h4>
              <ul className="divide-y rounded-md border border-amber-200">
                {uncategorized.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-2 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                    </div>
                    <Select
                      value=""
                      onValueChange={(value) => onMove(r, Number(value))}
                    >
                      <SelectTrigger className="h-8 w-[9.5rem] text-xs">
                        <SelectValue placeholder="Move to folder" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(r)}
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemove(r.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export function ResourcesSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useListResources(adminParams);
  const categoriesQuery = useListResourceCategories();
  const queryKey = getListResourcesQueryKey(adminParams);
  const categoriesKey = getListResourceCategoriesQueryKey();

  const allCategories = categoriesQuery.data ?? [];
  const folders = useMemo(
    () => allCategories.filter((c) => c.slug !== APPLICATIONS_SLUG),
    [allCategories],
  );

  const items = useMemo(
    () =>
      (query.data ?? []).filter((r) => r.category !== APPLICATIONS_SLUG),
    [query.data],
  );
  const onWebsite = items.filter((r) => r.isVisible);
  const archived = items.filter((r) => !r.isVisible);

  const defaultCategoryId = folders[0]?.id ?? null;

  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<FormState>({
    title: "",
    subject: "",
    categoryId: null,
    level: "All",
    term: "",
    file: null,
  });
  const [uploading, setUploading] = useState(false);

  const [folderName, setFolderName] = useState("");
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey }),
      queryClient.invalidateQueries({ queryKey: categoriesKey }),
    ]);
  };

  const onError = (err: unknown) => {
    const { title, description } = toFriendlyError(err);
    toast({ title, description, variant: "destructive" });
  };

  const createMutation = useMutation({
    mutationFn: async (state: FormState) => {
      if (!state.file) throw new Error("Please choose a file to upload.");
      if (state.categoryId == null) throw new Error("Please choose a folder.");
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
        categoryId: state.categoryId,
        level: state.level,
        term: state.term.trim() || null,
        objectPath: upload.objectPath,
        fileName: state.file.name,
        fileSize: state.file.size,
        contentType: state.file.type || "application/octet-stream",
        isVisible: true,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, state }: { id: number; state: FormState }) => {
      if (state.categoryId == null) throw new Error("Please choose a folder.");
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
        categoryId: state.categoryId,
        level: state.level,
        term: state.term.trim() || null,
        ...fileFields,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteResource(id),
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, isVisible }: { id: number; isVisible: boolean }) =>
      updateResource(id, { isVisible }),
  });

  const createFolderMutation = useMutation({
    mutationFn: (name: string) => createResourceCategory({ name }),
  });

  const renameFolderMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      updateResourceCategory(id, { name }),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: number) => deleteResourceCategory(id),
  });

  const reset = () => {
    setEditingId(null);
    setForm({
      title: "",
      subject: "",
      categoryId: defaultCategoryId,
      level: "All",
      term: "",
      file: null,
    });
  };

  const startCreate = () => {
    setEditingId("new");
    setForm({
      title: "",
      subject: "",
      categoryId: defaultCategoryId,
      level: "All",
      term: "",
      file: null,
    });
  };

  const startEdit = (item: Resource) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      subject: item.subject,
      categoryId:
        item.categoryId ??
        folders.find((c) => c.slug === item.category)?.id ??
        defaultCategoryId,
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
    if (form.categoryId == null) {
      toast({
        title: "Folder required",
        description: "Create a folder first, then assign this file to it.",
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
        toast({ title: "Uploaded", description: "Resource added to the website." });
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
    if (
      !confirm(
        "Permanently delete this file? Prefer Archive if you may need it again.",
      )
    )
      return;
    try {
      await deleteMutation.mutateAsync(id);
      await invalidate();
      toast({ title: "Deleted", description: "Resource removed." });
    } catch (err) {
      onError(err);
    }
  };

  const toggleArchive = async (item: Resource) => {
    const nextVisible = !item.isVisible;
    try {
      await archiveMutation.mutateAsync({
        id: item.id,
        isVisible: nextVisible,
      });
      await invalidate();
      toast({
        title: nextVisible ? "Restored" : "Archived",
        description: nextVisible
          ? "This file is back on the public Download Centre."
          : "Hidden from the website. You can restore it anytime from Archive.",
      });
    } catch (err) {
      onError(err);
    }
  };

  const moveFile = async (item: Resource, categoryId: number) => {
    if (item.categoryId === categoryId) return;
    try {
      await updateResource(item.id, { categoryId });
      await invalidate();
      toast({ title: "Moved", description: "File moved to the selected folder." });
    } catch (err) {
      onError(err);
    }
  };

  const addFolder = async () => {
    const name = folderName.trim();
    if (!name) return;
    try {
      await createFolderMutation.mutateAsync(name);
      setFolderName("");
      await invalidate();
      toast({ title: "Folder created", description: `"${name}" is ready.` });
    } catch (err) {
      onError(err);
    }
  };

  const saveRename = async (id: number) => {
    const name = renameValue.trim();
    if (!name) return;
    try {
      await renameFolderMutation.mutateAsync({ id, name });
      setRenamingId(null);
      setRenameValue("");
      await invalidate();
      toast({ title: "Renamed", description: "Folder name updated." });
    } catch (err) {
      onError(err);
    }
  };

  const removeFolder = async (cat: ResourceCategory) => {
    if (
      !confirm(
        `Delete folder "${cat.name}"? It must be empty (move or delete its files first).`,
      )
    )
      return;
    try {
      await deleteFolderMutation.mutateAsync(cat.id);
      await invalidate();
      toast({ title: "Folder deleted" });
    } catch (err) {
      onError(err);
    }
  };

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
            Organise past papers and holiday work into folders. Archive older
            files so students only see what is “On the website.”
          </CardDescription>
        </div>
        {editingId === null ? (
          <Button size="sm" onClick={startCreate} disabled={folders.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 rounded-lg border border-emerald-100 bg-emerald-50/30 p-4">
          <div className="flex items-center gap-2">
            <FolderPlus className="h-4 w-4 text-emerald-800" />
            <h3 className="text-sm font-semibold text-emerald-900">Folders</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Create or rename folders shown on the public Download Centre.
            Application forms are managed under the Applications tab.
          </p>
          <div className="flex flex-wrap gap-2">
            <Input
              value={folderName}
              placeholder="e.g. Syllabus, Handouts"
              className="max-w-xs bg-white"
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void addFolder();
              }}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void addFolder()}
              disabled={!folderName.trim() || createFolderMutation.isPending}
            >
              {createFolderMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              New folder
            </Button>
          </div>
          {folders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No folders yet — create one above.
            </p>
          ) : (
            <ul className="divide-y rounded-md border bg-white">
              {folders.map((cat) => (
                <li
                  key={cat.id}
                  className="flex flex-wrap items-center gap-2 px-3 py-2"
                >
                  {renamingId === cat.id ? (
                    <>
                      <Input
                        value={renameValue}
                        className="max-w-xs"
                        autoFocus
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void saveRename(cat.id);
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                      />
                      <Button size="sm" onClick={() => void saveRename(cat.id)}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRenamingId(null)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 text-sm font-medium">
                        {cat.name}
                      </span>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {cat.slug}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Rename folder"
                        onClick={() => {
                          setRenamingId(cat.id);
                          setRenameValue(cat.name);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Delete folder"
                        onClick={() => void removeFolder(cat)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

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
                <Label>Folder</Label>
                <Select
                  value={form.categoryId != null ? String(form.categoryId) : ""}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, categoryId: Number(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a folder" />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
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

        {query.isLoading || categoriesQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <ResourceList
              title="On the website"
              description="These files appear in the public Download Centre folders."
              items={onWebsite}
              categories={folders}
              emptyLabel="No files on the website yet. Add one, or restore from Archive."
              onEdit={startEdit}
              onRemove={remove}
              onToggleArchive={toggleArchive}
              onMove={moveFile}
            />
            <ResourceList
              title="Archive"
              description="Hidden from students. Folders stay intact — restore anytime."
              items={archived}
              categories={folders}
              emptyLabel="Archive is empty. Use the archive button on a file when you want it off the public site."
              onEdit={startEdit}
              onRemove={remove}
              onToggleArchive={toggleArchive}
              onMove={moveFile}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
