import { useState } from "react";
import {
  type UseMutationResult,
  type UseQueryResult,
  useQueryClient,
} from "@tanstack/react-query";
import { requestUploadUrl } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "tags" | "boolean";
  required?: boolean;
  placeholder?: string;
}

interface BaseItem {
  id: number;
  isVisible: boolean;
  sortOrder: number;
}

function asRecord(item: unknown): Record<string, unknown> {
  return item as Record<string, unknown>;
}

// All generated mutation hooks share these structural signatures, so we type
// them loosely here and let the per-section wiring supply the concrete hooks.
type AnyMutation = UseMutationResult<any, unknown, any, unknown>;

export interface ContentSectionProps<T extends BaseItem> {
  title: string;
  description: string;
  fields: FieldDef[];
  primaryKey: keyof T & string;
  secondaryKey?: keyof T & string;
  query: UseQueryResult<T[], any> & { queryKey: readonly unknown[] };
  createMutation: AnyMutation;
  updateMutation: AnyMutation;
  deleteMutation: AnyMutation;
  reorderMutation: AnyMutation;
  imageUpload?: boolean;
}

type FormValues = Record<string, string>;

function buildInitialValues(
  fields: FieldDef[],
  item?: Record<string, unknown>,
): FormValues {
  const out: FormValues = {};
  for (const f of fields) {
    const raw = item?.[f.key];
    if (f.type === "tags") {
      out[f.key] = Array.isArray(raw) ? raw.join(", ") : "";
    } else if (f.type === "boolean") {
      out[f.key] = raw === true ? "true" : "false";
    } else {
      out[f.key] = raw == null ? "" : String(raw);
    }
  }
  return out;
}

function valuesToPayload(
  fields: FieldDef[],
  values: FormValues,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.type === "tags") {
      out[f.key] = values[f.key]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (f.type === "boolean") {
      out[f.key] = values[f.key] === "true";
    } else {
      out[f.key] = values[f.key];
    }
  }
  return out;
}

const STORAGE_PREFIX = `${import.meta.env.BASE_URL.replace(/admin\/?$/, "")}api/storage`;

function imageSrc(objectPath: string): string {
  return `${STORAGE_PREFIX}${objectPath}`;
}

export function ContentSection<T extends BaseItem>(
  props: ContentSectionProps<T>,
) {
  const {
    title,
    description,
    fields,
    primaryKey,
    secondaryKey,
    query,
    createMutation,
    updateMutation,
    deleteMutation,
    reorderMutation,
    imageUpload,
  } = props;

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [values, setValues] = useState<FormValues>({});
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const items = query.data ?? [];

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: query.queryKey });

  const onError = (err: unknown) => {
    const message =
      err instanceof Error ? err.message : "Something went wrong";
    toast({ title: "Error", description: message, variant: "destructive" });
  };

  const startCreate = () => {
    setEditingId("new");
    setValues(buildInitialValues(fields));
    setFile(null);
  };

  const startEdit = (item: T) => {
    setEditingId(item.id);
    setValues(buildInitialValues(fields, asRecord(item)));
    setFile(null);
  };

  const cancel = () => {
    setEditingId(null);
    setValues({});
    setFile(null);
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!file) return null;
    const res = await requestUploadUrl({
      name: file.name,
      size: file.size,
      contentType: file.type || "application/octet-stream",
    });
    const putRes = await fetch(res.uploadURL, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!putRes.ok) {
      throw new Error(`Upload failed (${putRes.status})`);
    }
    return res.objectPath;
  };

  const submit = async () => {
    try {
      const payload = valuesToPayload(fields, values);

      if (editingId === "new") {
        if (imageUpload) {
          if (!file) {
            toast({
              title: "Image required",
              description: "Please choose an image to upload.",
              variant: "destructive",
            });
            return;
          }
          setUploading(true);
          const objectPath = await uploadFile();
          setUploading(false);
          payload.objectPath = objectPath;
        }
        await createMutation.mutateAsync({ data: payload });
        toast({ title: "Created", description: `${title} item added.` });
      } else if (typeof editingId === "number") {
        if (imageUpload && file) {
          setUploading(true);
          const objectPath = await uploadFile();
          setUploading(false);
          payload.objectPath = objectPath;
        }
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast({ title: "Saved", description: `${title} item updated.` });
      }
      await invalidate();
      cancel();
    } catch (err) {
      setUploading(false);
      onError(err);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      await invalidate();
      toast({ title: "Deleted", description: `${title} item removed.` });
    } catch (err) {
      onError(err);
    }
  };

  const toggleVisible = async (item: T) => {
    try {
      await updateMutation.mutateAsync({
        id: item.id,
        data: { isVisible: !item.isVisible },
      });
      await invalidate();
    } catch (err) {
      onError(err);
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const reordered = [...items];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);
    try {
      await reorderMutation.mutateAsync({
        data: { ids: reordered.map((i) => i.id) },
      });
      await invalidate();
    } catch (err) {
      onError(err);
    }
  };

  const renderForm = () => (
    <Card className="border-emerald-200 bg-emerald-50/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {editingId === "new" ? `Add ${title} item` : `Edit ${title} item`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label htmlFor={f.key}>
              {f.label}
              {f.required ? <span className="text-red-500"> *</span> : null}
            </Label>
            {f.type === "boolean" ? (
              <div className="pt-1">
                <Switch
                  id={f.key}
                  checked={values[f.key] === "true"}
                  onCheckedChange={(checked) =>
                    setValues((v) => ({
                      ...v,
                      [f.key]: checked ? "true" : "false",
                    }))
                  }
                />
              </div>
            ) : f.type === "textarea" ? (
              <Textarea
                id={f.key}
                value={values[f.key] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: e.target.value }))
                }
              />
            ) : (
              <Input
                id={f.key}
                value={values[f.key] ?? ""}
                placeholder={
                  f.placeholder ??
                  (f.type === "tags" ? "Comma-separated values" : undefined)
                }
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: e.target.value }))
                }
              />
            )}
          </div>
        ))}

        {imageUpload ? (
          <div className="space-y-1.5">
            <Label htmlFor="image-file">
              Image
              {editingId === "new" ? (
                <span className="text-red-500"> *</span>
              ) : (
                <span className="text-muted-foreground">
                  {" "}
                  (leave empty to keep current)
                </span>
              )}
            </Label>
            <Input
              id="image-file"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        ) : null}

        <div className="flex gap-2 pt-1">
          <Button
            onClick={submit}
            disabled={
              createMutation.isPending ||
              updateMutation.isPending ||
              uploading
            }
          >
            {uploading || createMutation.isPending || updateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save
          </Button>
          <Button variant="outline" onClick={cancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {editingId === null ? (
          <Button size="sm" onClick={startCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {editingId !== null ? renderForm() : null}

        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {items.map((item, index) => (
              <li
                key={item.id}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <div className="flex flex-col">
                  <button
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={index === 0 || reorderMutation.isPending}
                    onClick={() => move(index, -1)}
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={
                      index === items.length - 1 || reorderMutation.isPending
                    }
                    onClick={() => move(index, 1)}
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>

                {imageUpload &&
                typeof asRecord(item).objectPath === "string" ? (
                  <img
                    src={imageSrc(asRecord(item).objectPath as string)}
                    alt=""
                    className="h-12 w-16 rounded object-cover"
                  />
                ) : null}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {String(asRecord(item)[primaryKey] ?? "")}
                  </p>
                  {secondaryKey ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {String(asRecord(item)[secondaryKey] ?? "")}
                    </p>
                  ) : null}
                </div>

                {!item.isVisible ? (
                  <Badge variant="secondary">Hidden</Badge>
                ) : null}

                <div className="flex items-center gap-2">
                  <Switch
                    checked={item.isVisible}
                    onCheckedChange={() => toggleVisible(item)}
                    aria-label="Toggle visibility"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEdit(item)}
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(item.id)}
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
