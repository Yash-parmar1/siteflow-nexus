import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';

// ── Type definitions (match backend DTOs) ──────────────────────

export interface DashboardMetrics {
  activeSites: number;
  totalAcsUnits: number;
  openTickets: number;
  monthlyRevenue: number;
}

export interface SiteData {
  id: number;
  clientId: number;
  clientName: string;
  subprojectId: number;
  subprojectName: string;
  configurationId: number;
  siteCode: string;
  name: string;
  addressJson: string | null;
  siteType: string | null;
  regionType: string | null;
  preferredAcMake: string | null;
  stabilizerNumber: string | null;
  stabilizerOrderDate: string | null;
  stabilizerDeliveryDate: string | null;
  acOrderedDate: string | null;
  acDeliveredDate: string | null;
  installationScheduled: string | null;
  installationDone: string | null;
  importSource: string | null;
  currentStage: string;
  stageChangedAt: string;
  progress: number;
  hasDelay: boolean;
  expectedLiveDate: string | null;
  actualLiveDate: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  plannedAcsCount?: number;
  // Optional computed / related fields
  location?: string;
  acsPlanned?: number;
  acsInstalled?: number;
  delayDays?: number;
  projectId?: number;
  projectName?: string;
  configuredRent?: number;
  configuredTenure?: number;
  stage?: string;
}

export interface AssetData {
  id: number;
  serialNumber: string;
  manufacturer: string | null;
  model: string | null;
  purchaseCost: number | null;
  insuranceThreshold: number | null;
  maintenanceSupported: boolean;
  status: string;
  locationInSite: string | null;
  warrantyExpiryDate: string | null;
  nextMaintenanceDate: string | null;
  lastMaintenanceDate: string | null;
  modelNumber: string | null;
  sizeInTon: number | null;
  indoorAc: boolean;
  monthlyRent: number | null;
  firstMonthRent: number | null;
  siteId: number | null;
  siteName: string | null;
  subprojectId: number | null;
  subprojectName: string | null;
  projectId: number | null;
  projectName: string | null;
}

export interface InstallationData {
  id: number;
  siteId: number;
  siteName: string;
  acAssetId: number;
  acAssetSerial: string;
  bookingId: string | null;
  shipmentStatus: string;
  status: string | null;
  eta: string | null;
  installationDate: string | null;
  bookingDate: string | null;
  closedDate: string | null;
  receiverName: string | null;
  receiverNumber: string | null;
  remarks: string | null;
  serialNumberImageUrl: string | null;
  evidenceImagesJson: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface TicketData {
  id: number;
  siteId: number;
  siteName: string;
  acAssetId: number;
  acAssetSerial: string;
  title: string | null;
  description: string | null;
  priority: string;
  status: string;
  assignedTo?: string | null;
  visitingCharge: number | null;
  createdAt: string;
  updatedAt?: string | null;
  closedAt: string | null;
}

export interface FinanceSummary {
  monthlyRevenue: number;
  totalMaintenanceCost: number;
  totalInstallationCost: number;
  netProfit: number;
  collected?: number;
  outstanding?: number;
}

export interface FinancialTransactionData {
  id: number;
  transactionType: string;
  transactionRef: string;
  siteId?: number;
  siteName?: string;
  billingPeriod?: string;
  transactionDate: string;
  dueDate?: string;
  baseAmount: number;
  cgstAmount?: number;
  sgstAmount?: number;
  totalAmount: number;
  paymentStatus: string;
  paidAmount?: number;
  paymentDate?: string;
  paymentReference?: string;
  paymentMode?: string;
  invoiceNumber?: string;
  daysOverdue?: number;
  remarks?: string;
  createdAt?: string;
}

export interface AppData {
  dashboard: DashboardMetrics;
  sites: SiteData[];
  assets: AssetData[];
  installations: InstallationData[];
  maintenanceTickets: TicketData[];
  finance: FinanceSummary;
  financialTransactions: FinancialTransactionData[];
}

interface AppDataContextType {
  data: AppData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// ── Default empty state ────────────────────────────────────────
const EMPTY_APP_DATA: AppData = {
  dashboard: { activeSites: 0, totalAcsUnits: 0, openTickets: 0, monthlyRevenue: 0 },
  sites: [],
  assets: [],
  installations: [],
  maintenanceTickets: [],
  finance: { monthlyRevenue: 0, totalMaintenanceCost: 0, totalInstallationCost: 0, netProfit: 0 },
  financialTransactions: [],
};

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get('/app-data');
      setData(resp.data ?? EMPTY_APP_DATA);
    } catch (err: any) {
      console.error('[AppDataContext] fetch failed', err);
      setError(err?.message ?? 'Failed to load application data');
      // keep stale data if available
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch once when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchAppData();
    } else {
      setData(null);
    }
  }, [isAuthenticated, fetchAppData]);

  return (
    <AppDataContext.Provider value={{ data, loading, error, refresh: fetchAppData }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
