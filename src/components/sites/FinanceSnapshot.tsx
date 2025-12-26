import { DollarSign, TrendingUp, TrendingDown, Calendar, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinanceData {
  rentStartDate?: string;
  monthlyRent: number;
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
}

interface FinanceSnapshotProps {
  data: FinanceData;
}

export function FinanceSnapshot({ data }: FinanceSnapshotProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const isProfitable = data.netProfit > 0;

  return (
    <div className="data-card">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-foreground">Finance Snapshot</h2>
        <button className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors">
          View Details
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {data.rentStartDate ? (
        <>
          {/* Rent Start */}
          <div className="flex items-center gap-2 mb-5 p-3 bg-status-success/10 rounded-lg">
            <Calendar className="w-4 h-4 text-status-success" />
            <span className="text-sm">
              <span className="text-muted-foreground">Rent started: </span>
              <span className="font-medium text-foreground">{data.rentStartDate}</span>
            </span>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">
                  Monthly Rent
                </span>
              </div>
              <div className="metric-value">{formatCurrency(data.monthlyRent)}</div>
            </div>

            <div className="p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-status-success" />
                <span className="text-xs text-muted-foreground font-medium">
                  Total Revenue
                </span>
              </div>
              <div className="metric-value text-status-success">
                {formatCurrency(data.totalRevenue)}
              </div>
            </div>

            <div className="p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-status-error" />
                <span className="text-xs text-muted-foreground font-medium">
                  Total Costs
                </span>
              </div>
              <div className="metric-value text-status-error">
                {formatCurrency(data.totalCosts)}
              </div>
            </div>

            <div
              className={cn(
                "p-3 rounded-lg",
                isProfitable ? "bg-status-success/10" : "bg-status-error/10"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                {isProfitable ? (
                  <TrendingUp className="w-4 h-4 text-status-success" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-status-error" />
                )}
                <span className="text-xs text-muted-foreground font-medium">
                  Net Profit
                </span>
              </div>
              <div
                className={cn(
                  "metric-value",
                  isProfitable ? "text-status-success" : "text-status-error"
                )}
              >
                {formatCurrency(data.netProfit)}
              </div>
            </div>
          </div>

          {/* Profit Margin */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Profit Margin</span>
              <span
                className={cn(
                  "font-semibold",
                  isProfitable ? "text-status-success" : "text-status-error"
                )}
              >
                {data.profitMargin}%
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isProfitable ? "bg-status-success" : "bg-status-error"
                )}
                style={{ width: `${Math.min(Math.abs(data.profitMargin), 100)}%` }}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 mb-3 rounded-full bg-muted flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            Rent not started
          </p>
          <p className="text-xs text-muted-foreground">
            Financial data will appear once site goes live
          </p>
        </div>
      )}
    </div>
  );
}
