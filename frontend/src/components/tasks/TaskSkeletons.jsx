import React from "react";

export const TaskRowSkeleton = () => {
  return (
    <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-[#E7EAF0] flex items-center justify-between gap-3 animate-pulse shadow-xs">
      <div className="flex items-center gap-3 flex-1">
        {/* Checkbox Skeleton */}
        <div className="w-5 h-5 rounded-md bg-[#EAECF0] shrink-0" />

        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Title Skeleton */}
            <div className="h-4 bg-[#EAECF0] rounded-md w-1/3 min-w-[140px]" />
            {/* Badge Skeleton */}
            <div className="h-4 bg-[#F2F4F7] rounded-full w-14" />
            <div className="h-4 bg-[#F2F4F7] rounded-full w-16" />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-3 bg-[#F2F4F7] rounded w-16" />
            <div className="h-3 bg-[#F2F4F7] rounded w-20" />
            <div className="h-3 bg-[#F2F4F7] rounded w-14" />
          </div>
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-[#EAECF0]" />
        <div className="w-7 h-7 rounded-lg bg-[#EAECF0]" />
      </div>
    </div>
  );
};

export const TaskListSkeleton = ({ count = 4 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <TaskRowSkeleton key={i} />
      ))}
    </div>
  );
};

export default TaskListSkeleton;
