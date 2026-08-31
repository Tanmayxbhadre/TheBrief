import React from 'react';
import { ExternalLink, Clock, Folder } from 'lucide-react';
import { NewsItem, Source, Category } from '@prisma/client';

type NewsItemWithRelations = NewsItem & {
  source: Source;
  category: Category | null;
};

interface NewsItemCardProps {
  item: NewsItemWithRelations;
  onClick: (item: NewsItemWithRelations) => void;
}

export function NewsItemCard({ item, onClick }: NewsItemCardProps) {
  // Calculate relative time
  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    return Math.floor(seconds) + ' seconds ago';
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-3"
      onClick={() => onClick(item)}
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-semibold text-lg leading-snug text-gray-900 dark:text-white line-clamp-2">
          {item.title}
        </h3>
        <span className="shrink-0 text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 capitalize">
          {item.status.toLowerCase()}
        </span>
      </div>
      
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-auto">
        {item.category && (
          <div className="flex items-center gap-1">
            <Folder size={14} />
            <span className="font-medium text-blue-600 dark:text-blue-400">{item.category.name}</span>
          </div>
        )}
        <div className="flex items-center gap-1 font-medium">
          {item.source.name}
        </div>
        <div className="flex items-center gap-1">
          <Clock size={14} />
          <span>{item.publishedAt ? timeAgo(item.publishedAt) : timeAgo(item.discoveredAt)}</span>
        </div>
      </div>
    </div>
  );
}
