export interface RowResult {
  rowNumber: number;
  siteCode: string | null;
  status: "OK" | "WARN" | "ERROR";
  message: string;
  isError: boolean;
  rowData?: Record<string, any>;
}

export interface UploadResult {
  processed: number;
  saved: number;
  updated: number;
  warnings: number;
  errors: number;
  rowResults: RowResult[];
}

export interface UploadResponsePayload {
  sessionId: number;
  uploadResult: UploadResult;
}

export interface FileUploadSession {
  id: number;
  originalFilename: string;
  storedFilename: string;
  uploadTimestamp: string;
  status: "PENDING_CORRECTION" | "PROCESSING" | "COMPLETED" | "FAILED";
  failedRows?: RowResult[];
  fileType: string;
  subprojectId: number;
}
