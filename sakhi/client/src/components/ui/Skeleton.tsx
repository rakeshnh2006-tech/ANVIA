import React from 'react'

interface LoadingSkeletonProps {
  className?: string
  rows?: number
}

export function LoadingSkeleton({ className = '', rows = 1 }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-4 w-full" style={{ width: `${100 - (i % 3) * 15}%` }} />
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="card space-y-4 animate-pulse">
      <div className="h-5 bg-gray-200 rounded-lg w-1/3" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="h-3 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  )
}

export function AvatarSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
      <div className="space-y-1.5">
        <div className="h-3 bg-gray-200 rounded w-24" />
        <div className="h-2.5 bg-gray-200 rounded w-16" />
      </div>
    </div>
  )
}
