"use client";

/**
 * Reusable skeleton loader components for consistent loading states.
 */

// Base skeleton box with pulse animation
export function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-[var(--bg-surface)] animate-pulse rounded ${className}`}
    />
  );
}

// Skeleton for table rows (used in leads page)
export function SkeletonTableRow() {
  return (
    <tr className="hover:bg-[var(--bg-hover)] transition-colors">
      <td className="p-4 border-r border-[var(--border-pencil)] border-dashed">
        <SkeletonBox className="h-6 w-32 mb-2" />
        <SkeletonBox className="h-3 w-16" />
      </td>
      <td className="p-4 border-r border-[var(--border-pencil)] border-dashed">
        <SkeletonBox className="h-5 w-24" />
      </td>
      <td className="p-4 border-r border-[var(--border-pencil)] border-dashed">
        <SkeletonBox className="h-4 w-32 mb-1" />
        <SkeletonBox className="h-4 w-28" />
      </td>
      <td className="p-4 border-r border-[var(--border-pencil)] border-dashed text-center">
        <SkeletonBox className="h-6 w-20 mx-auto" />
      </td>
      <td className="p-4 border-r border-[var(--border-pencil)] border-dashed text-center">
        <SkeletonBox className="h-6 w-20 mx-auto" />
      </td>
      <td className="p-4 text-center">
        <SkeletonBox className="h-7 w-24 mx-auto" />
      </td>
    </tr>
  );
}

// Skeleton for opportunity cards (used in pipeline)
export function SkeletonOpportunityCard() {
  return (
    <div className="bg-white border border-[var(--border-pencil)] p-4 shadow-sm hover:shadow-md transition-shadow">
      <SkeletonBox className="h-5 w-3/4 mb-3" />
      <SkeletonBox className="h-4 w-1/2 mb-2" />
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-[var(--border-pencil)] border-dashed">
        <SkeletonBox className="h-5 w-20" />
        <SkeletonBox className="h-4 w-12" />
      </div>
    </div>
  );
}

// Skeleton for activity items (used in opportunity detail modal)
export function SkeletonActivityItem() {
  return (
    <div className="relative pl-6">
      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[var(--bg-surface)]" />
      <div className="flex flex-col gap-1">
        <SkeletonBox className="h-5 w-3/4 mb-2" />
        <div className="flex items-center gap-2 mt-1">
          <SkeletonBox className="h-5 w-16" />
          <SkeletonBox className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}

// Skeleton for stat cards (used in dashboard)
export function SkeletonStatCard() {
  return (
    <div className="paper-card p-6 bg-white border border-[var(--border-pencil)] shadow-sm">
      <SkeletonBox className="h-4 w-24 mb-3" />
      <SkeletonBox className="h-8 w-16 mb-2" />
      <SkeletonBox className="h-3 w-20" />
    </div>
  );
}

// Skeleton for pipeline columns
export function SkeletonPipelineColumn() {
  return (
    <div className="w-80 shrink-0 h-full flex flex-col bg-[var(--bg-paper)]/50">
      {/* Header */}
      <div className="p-3 border-b-2 border-[var(--text-primary)] bg-[var(--bg-paper)]">
        <div className="flex justify-between items-center mb-1">
          <SkeletonBox className="h-6 w-32" />
          <SkeletonBox className="h-6 w-8 rounded-full" />
        </div>
        <div className="mt-2">
          <SkeletonBox className="h-4 w-24 ml-auto" />
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        <SkeletonOpportunityCard />
        <SkeletonOpportunityCard />
        <SkeletonOpportunityCard />
      </div>
    </div>
  );
}
