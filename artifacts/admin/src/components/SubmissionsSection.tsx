import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useListSubmissions,
  getListSubmissionsQueryKey,
  updateSubmission,
  deleteSubmission,
  type Submission,
  type UpdateSubmissionInputStatus,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
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
import { Download, FileText, Mail, Phone, Trash2 } from "lucide-react";

const STORAGE_PREFIX = `${import.meta.env.BASE_URL.replace(/admin\/?$/, "")}api/storage`;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

function downloadCsv(items: Submission[]) {
  const headers = [
    "Date",
    "Type",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Applying For",
    "Message",
    "Attached File",
    "Status",
  ];
  const rows = items.map((s) =>
    [
      formatDate(s.createdAt),
      s.type,
      s.firstName,
      s.lastName,
      s.email,
      s.phone,
      s.level,
      s.message,
      s.fileName ?? (s.fileUrl ? "attached" : ""),
      s.status,
    ]
      .map(csvCell)
      .join(","),
  );
  const csv = [headers.map(csvCell).join(","), ...rows].join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `grace-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function SubmissionsSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useListSubmissions();
  const queryKey = getListSubmissionsQueryKey();
  const items = (query.data ?? []) as Submission[];

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const onError = (err: unknown) => {
    const { title, description } = toFriendlyError(err);
    toast({ title, description, variant: "destructive" });
  };

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: UpdateSubmissionInputStatus;
    }) => updateSubmission(id, { status }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSubmission(id),
  });

  const toggleRead = async (s: Submission) => {
    try {
      await updateMutation.mutateAsync({
        id: s.id,
        status: s.status === "new" ? "read" : "new",
      });
      await invalidate();
    } catch (err) {
      onError(err);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this submission? This cannot be undone.")) return;
    try {
      await deleteMutation.mutateAsync(id);
      await invalidate();
      toast({ title: "Deleted", description: "Submission removed." });
    } catch (err) {
      onError(err);
    }
  };

  const newCount = items.filter((s) => s.status === "new").length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>
            Enquiries &amp; Applications
            {newCount > 0 ? (
              <Badge className="ml-2 bg-emerald-600">{newCount} new</Badge>
            ) : null}
          </CardTitle>
          <CardDescription>
            Enquiries from the &ldquo;Enquire / Apply Now&rdquo; form and completed
            application forms students upload via &ldquo;Submit Your Completed
            Form&rdquo;. Open any attached form, or download everything as a
            spreadsheet for your records.
          </CardDescription>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={items.length === 0}
          onClick={() => downloadCsv(items)}
        >
          <Download className="mr-2 h-4 w-4" />
          Download CSV
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No submissions yet. They will appear here as soon as someone fills in
            the form on the website.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((s) => (
              <li
                key={s.id}
                className={`rounded-md border p-3 ${
                  s.status === "new"
                    ? "border-emerald-300 bg-emerald-50/40"
                    : "bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">
                      {[s.firstName, s.lastName].filter(Boolean).join(" ")}
                    </p>
                    {s.level ? (
                      <Badge variant="secondary">Applying: {s.level}</Badge>
                    ) : null}
                    {s.status === "new" ? (
                      <Badge className="bg-emerald-600">New</Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(s.createdAt)}
                  </p>
                </div>

                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {s.phone ? (
                    <a
                      href={`tel:${s.phone}`}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {s.phone}
                    </a>
                  ) : null}
                  {s.email ? (
                    <a
                      href={`mailto:${s.email}`}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {s.email}
                    </a>
                  ) : null}
                </div>

                {s.message ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                    {s.message}
                  </p>
                ) : null}

                {s.fileUrl ? (
                  <a
                    href={`${STORAGE_PREFIX}${s.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {s.fileName ?? "Download completed form"}
                  </a>
                ) : null}

                <div className="mt-2 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleRead(s)}
                  >
                    Mark as {s.status === "new" ? "read" : "new"}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(s.id)}
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
