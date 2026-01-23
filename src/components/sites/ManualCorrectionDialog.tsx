import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { FileUploadSession, RowResult } from "@/types/uploads";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface ManualCorrectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  subprojectId: string;
  sessionId: number | null;
  onCorrectionComplete?: () => void;
}

export default function ManualCorrectionDialog({
  open,
  onOpenChange,
  projectId,
  subprojectId,
  sessionId,
  onCorrectionComplete,
}: ManualCorrectionDialogProps) {
  const [session, setSession] = useState<FileUploadSession | null>(null);
  const [editedRows, setEditedRows] = useState<Record<number, Record<string, any>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && sessionId) {
      setIsLoading(true);
      setError(null);
      api
        .get(`/projects/${projectId}/subprojects/${subprojectId}/uploads/${sessionId}`)
        .then((res) => {
          const data = res.data as FileUploadSession;
          setSession(data);
          
          const initialEdits: Record<number, Record<string, any>> = {};
          if (Array.isArray(data.failedRows)) {
            data.failedRows.forEach((row: RowResult) => {
              if (row.rowData) {
                initialEdits[row.rowNumber] = { ...row.rowData };
              }
            });
          }
          setEditedRows(initialEdits);
        })
        .catch((e: any) => {
          setError("Failed to load session data. Please try again.");
          console.error(e);
        })
        .finally(() => setIsLoading(false));
    }
  }, [open, sessionId, projectId, subprojectId]);

  const handleCellChange = (rowNumber: number, key: string, value: string) => {
    setEditedRows((prev) => ({
      ...prev,
      [rowNumber]: {
        ...prev[rowNumber],
        [key]: value,
      },
    }));
  };

  const handleResubmit = async () => {
    if (!sessionId) return;

    setIsSubmitting(true);
    try {
      const res = await api.post(
        `/projects/${projectId}/subprojects/${subprojectId}/uploads/${sessionId}/correct`,
        editedRows
      );

      const { uploadResult } = res.data;
      toast.success(
        `Corrections submitted: ${uploadResult.saved} site(s) created successfully`
      );

      if (uploadResult.errors > 0) {
        // Refresh session to show updated failed rows
        const updatedSession = await api.get(
          `/projects/${projectId}/subprojects/${subprojectId}/uploads/${sessionId}`
        );
        setSession(updatedSession.data as FileUploadSession);
        
        const newEdits: Record<number, Record<string, any>> = {};
        if (Array.isArray(updatedSession.data.failedRows)) {
          updatedSession.data.failedRows.forEach((row: RowResult) => {
            if (row.rowData) {
              newEdits[row.rowNumber] = { ...row.rowData };
            }
          });
        }
        setEditedRows(newEdits);
        toast.warning(
          `${uploadResult.errors} row(s) still need correction`
        );
      } else {
        toast.success("All corrections completed!");
        onOpenChange(false);
        if (onCorrectionComplete) onCorrectionComplete();
      }
    } catch (e: any) {
      toast.error(
        e?.response?.data?.error || "Failed to submit corrections"
      );
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = async () => {
    if (!sessionId) return;

    setIsSubmitting(true);
    try {
      await api.post(
        `/projects/${projectId}/subprojects/${subprojectId}/uploads/${sessionId}/discard-failed`
      );
      toast.success("Failed rows discarded");
      onOpenChange(false);
      if (onCorrectionComplete) onCorrectionComplete();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to discard rows");
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const failedRowsCount = session?.failedRows?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Correct Failed Rows</DialogTitle>
          {session && (
            <DialogDescription>
              File: <span className="font-mono text-sm">{session.originalFilename}</span> • Status: <span className="font-semibold">{session.status}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading && !isSubmitting && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Loading correction data...</p>
          </div>
        )}

        {isSubmitting && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Submitting changes and creating sites...</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-md border border-destructive/20">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-destructive">Failed to load data</p>
              <p className="text-xs text-destructive/90">{error}</p>
            </div>
          </div>
        )}

        {session && !isLoading && !isSubmitting && !error && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {failedRowsCount === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-lg font-medium">No rows to correct</p>
                  <p className="text-sm text-muted-foreground">All rows have been processed successfully!</p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <p className="text-sm font-medium">
                    Showing <span className="font-semibold text-primary">{failedRowsCount}</span> row{failedRowsCount !== 1 ? "s" : ""} that need attention
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Edit the fields below and click "Resubmit" to create sites. Sites will be created for rows without errors.
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                  {session.failedRows?.map((row) => (
                    <div
                      key={row.rowNumber}
                      className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-semibold">
                            {row.rowNumber}
                          </span>
                          <span className="font-medium text-sm">
                            {row.siteCode || "(no site code)"}
                          </span>
                        </div>
                        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          row.isError
                            ? "bg-destructive/10 text-destructive"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                        }`}>
                          {row.isError ? "✕ Error" : "⚠ Warning"}
                        </div>
                      </div>

                      <div className="p-2 bg-muted/40 rounded text-xs text-muted-foreground border-l-2 border-muted-foreground/50">
                        {row.message}
                      </div>

                      {row.rowData && Object.keys(row.rowData).length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {Object.entries(row.rowData).map(([key, value]) => (
                            <div key={`${row.rowNumber}-${key}`} className="space-y-1.5">
                              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                                {key.replace(/_/g, " ")}
                              </label>
                              <input
                                type="text"
                                defaultValue={String(value || "")}
                                className="w-full px-2.5 py-1.5 border rounded-md bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                                onChange={(e) =>
                                  handleCellChange(row.rowNumber, key, e.target.value)
                                }
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter className="mt-6 flex flex-wrap justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting || isLoading}
          >
            Close
          </Button>
          <Button
            variant="destructive"
            onClick={handleDiscard}
            disabled={isSubmitting || isLoading || failedRowsCount === 0}
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
            Discard Failed Rows
          </Button>
          <Button
            onClick={handleResubmit}
            disabled={isSubmitting || isLoading || failedRowsCount === 0}
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
            Resubmit Corrections
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
