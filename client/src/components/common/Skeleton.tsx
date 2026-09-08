import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const SkeletonBox: React.FC<SkeletonProps> = ({ className = '', style }) => {
  return (
    <div
      style={style}
      className={`bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse rounded-2xl ${className}`}
    />
  );
};

export const SkeletonBanner: React.FC = () => {
  return (
    <div className="px-2 mt-2">
      <SkeletonBox className="w-full h-[165px] rounded-2xl" />
      <div className="flex items-center justify-center gap-1.5 mt-2">
        <SkeletonBox className="w-[18px] h-1.5 rounded-full" />
        <SkeletonBox className="w-1.5 h-1.5 rounded-full" />
        <SkeletonBox className="w-1.5 h-1.5 rounded-full" />
      </div>
    </div>
  );
};

export const SkeletonCarousel: React.FC<{ count?: number; itemWidth?: number; itemHeight?: number }> = ({
  count = 4,
  itemWidth = 148,
  itemHeight = 210,
}) => {
  return (
    <div className="mt-6 px-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <SkeletonBox className="w-24 h-4 mb-1" />
          <SkeletonBox className="w-32 h-5" />
        </div>
        <SkeletonBox className="w-14 h-4" />
      </div>
      <div className="flex gap-3.5 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonBox
            key={i}
            className="shrink-0"
            style={{ width: itemWidth, height: itemHeight }}
          />
        ))}
      </div>
    </div>
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm space-y-3">
      <SkeletonBox className="w-full h-36 rounded-xl" />
      <div className="space-y-2">
        <SkeletonBox className="w-3/4 h-5" />
        <SkeletonBox className="w-1/2 h-4" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <SkeletonBox className="w-20 h-6" />
        <SkeletonBox className="w-24 h-9 rounded-xl" />
      </div>
    </div>
  );
};

export const MobileHomePageSkeleton: React.FC = () => {
  return (
    <div className="pb-32">
      {/* Header Skeleton */}
      <div className="bg-[#F1F5F9] border-b border-slate-200 px-4 pt-5 pb-6 rounded-b-[28px]">
        <div className="flex items-center justify-between">
          <SkeletonBox className="w-32 h-7" />
        </div>
        <div className="mt-5 flex items-center gap-3">
          <SkeletonBox className="w-11 h-11 rounded-full shrink-0" />
          <div className="space-y-1.5">
            <SkeletonBox className="w-36 h-5" />
            <SkeletonBox className="w-48 h-3.5" />
          </div>
        </div>
        <SkeletonBox className="mt-5 w-full h-14 rounded-2xl" />
      </div>

      {/* Hero Banner Skeleton */}
      <SkeletonBanner />

      {/* India Tours Carousel Skeleton */}
      <SkeletonCarousel count={3} itemWidth={155} itemHeight={200} />

      {/* International Tours Carousel Skeleton */}
      <SkeletonCarousel count={3} itemWidth={155} itemHeight={200} />

      {/* Specialization Themes Skeleton */}
      <SkeletonCarousel count={3} itemWidth={148} itemHeight={210} />

      {/* Trending Packages List Skeleton */}
      <div className="mt-6 px-4 space-y-4">
        <SkeletonBox className="w-44 h-6 mb-3" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
};
