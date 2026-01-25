"use client";

import { useState } from "react";
import { cn, formatCurrency, formatPercentage, explainAPR } from "@/lib/utils";
import { Calculator, Info, ChevronDown, ChevronUp } from "lucide-react";

interface APRExplainerProps {
  apr: number;
  principal?: number;
  className?: string;
}

export function APRExplainer({
  apr,
  principal = 10000,
  className,
}: APRExplainerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customPrincipal, setCustomPrincipal] = useState(principal);

  const explanation = explainAPR(apr, customPrincipal);

  return (
    <div className={cn("card overflow-hidden", className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pulse-pink-100 text-pulse-pink-600">
            <Calculator className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">APR Explained</h3>
            <p className="text-sm text-gray-500">
              What does {formatPercentage(apr)} APR actually mean?
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-4 animate-fade-in">
          {/* Principal Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your deposit amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                $
              </span>
              <input
                type="number"
                value={customPrincipal}
                onChange={(e) =>
                  setCustomPrincipal(Math.max(0, Number(e.target.value)))
                }
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 
                         focus:border-pulse-red-500 focus:ring-2 focus:ring-pulse-red-500/20
                         transition-all outline-none"
                placeholder="10000"
              />
            </div>
          </div>

          {/* Earnings Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-gradient-to-br from-pulse-red-50 to-pulse-pink-50">
              <p className="text-xs text-gray-500 mb-1">Daily Earnings</p>
              <p className="text-lg font-bold text-gray-900">
                ~{formatCurrency(explanation.yearlyEstimate / 365)}
              </p>
              <p className="text-xs text-gray-400">
                {formatPercentage(explanation.dailyRate, { decimals: 4 })}/day
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-pulse-red-50 to-pulse-pink-50">
              <p className="text-xs text-gray-500 mb-1">Monthly Earnings</p>
              <p className="text-lg font-bold text-gray-900">
                ~{formatCurrency(explanation.monthlyEstimate)}
              </p>
              <p className="text-xs text-gray-400">Before compounding</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-pulse-red-50 to-pulse-pink-50">
              <p className="text-xs text-gray-500 mb-1">Yearly Earnings</p>
              <p className="text-lg font-bold text-profit">
                ~{formatCurrency(explanation.yearlyEstimate)}
              </p>
              <p className="text-xs text-gray-400">
                {formatPercentage(explanation.compoundedApy)} APY compounded
              </p>
            </div>
          </div>

          {/* Info Note */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">What's the difference?</p>
              <p className="text-blue-600">
                <strong>APR</strong> is the simple interest rate.{" "}
                <strong>APY</strong> includes compound interest (earnings on your
                earnings). The more frequently rewards compound, the higher your
                actual returns.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
