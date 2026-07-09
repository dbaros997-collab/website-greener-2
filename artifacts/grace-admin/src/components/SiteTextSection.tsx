import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListSiteText,
  useUpdateSiteText,
  getListSiteTextQueryKey,
  type SiteText,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { toFriendlyError } from "@/lib/errors";
import { Loader2 } from "lucide-react";

export function SiteTextSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useListSiteText();
  const queryKey = getListSiteTextQueryKey();
  const update = useUpdateSiteText();

  const blocks = query.data ?? [];

  // Local draft values keyed by block key, seeded from the server response.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    if (!query.data) return;
    setDrafts((prev) => {
      const next = { ...prev };
      for (const b of query.data as SiteText[]) {
        if (!(b.key in next)) next[b.key] = b.value;
      }
      return next;
    });
  }, [query.data]);

  const save = async (block: SiteText) => {
    const value = drafts[block.key] ?? block.value;
    try {
      setSavingKey(block.key);
      await update.mutateAsync({ key: block.key, data: { value } });
      await queryClient.invalidateQueries({ queryKey });
      toast({ title: "Saved", description: `${block.label} updated.` });
    } catch (err) {
      const { title, description } = toFriendlyError(err);
      toast({ title, description, variant: "destructive" });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Section Text</CardTitle>
        <CardDescription>
          The fixed headings and intro paragraphs for the About, Programmes and
          Admissions sections.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No editable text blocks.
          </p>
        ) : (
          (blocks as SiteText[]).map((block) => {
            const value = drafts[block.key] ?? block.value;
            const dirty = value !== block.value;
            const inputId = `site-text-${block.key}`;
            return (
              <div key={block.key} className="space-y-1.5">
                <Label htmlFor={inputId}>{block.label}</Label>
                {block.multiline ? (
                  <Textarea
                    id={inputId}
                    rows={3}
                    value={value}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [block.key]: e.target.value }))
                    }
                  />
                ) : (
                  <Input
                    id={inputId}
                    value={value}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [block.key]: e.target.value }))
                    }
                  />
                )}
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    disabled={!dirty || savingKey === block.key}
                    onClick={() => save(block)}
                  >
                    {savingKey === block.key ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Save
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
