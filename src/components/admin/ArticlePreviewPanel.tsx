import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { NewsItem, Source, Category } from '@prisma/client';

type NewsItemWithRelations = NewsItem & {
  source: Source;
  category: Category | null;
};

interface ArticlePreviewPanelProps {
  item: NewsItemWithRelations | null;
  onClose: () => void;
}

export function ArticlePreviewPanel({ item, onClose }: ArticlePreviewPanelProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-800 z-50 overflow-y-auto flex flex-col transform transition-transform duration-300">
      <div className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between z-10">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Article Preview</h2>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="self-start text-xs font-bold px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md capitalize">
            {item.category?.name || 'Uncategorized'}
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            {item.title}
          </h1>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span>By <strong className="text-gray-700 dark:text-gray-300">{item.author || item.source.name}</strong></span>
            <span>&bull;</span>
            <span>{item.publishedAt ? new Date(item.publishedAt).toLocaleString() : new Date(item.discoveredAt).toLocaleString()}</span>
          </div>
        </div>

        {item.imageUrl && (
          <div className="relative w-full h-64 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={item.imageUrl} 
              alt={item.imageAlt || item.title} 
              className="object-cover w-full h-full"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="prose dark:prose-invert max-w-none">
          <h3 className="text-lg font-semibold">Description</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {item.description || 'No description available from source.'}
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Metadata</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="block text-gray-500 mb-1">Status</span>
              <span className="font-medium capitalize">{item.status.toLowerCase()}</span>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">Discovered At</span>
              <span className="font-medium">{new Date(item.discoveredAt).toLocaleString()}</span>
            </div>
            <div>
              <span className="block text-gray-500 mb-1">Content Hash</span>
              <span className="font-medium text-xs font-mono break-all">{item.contentHash}</span>
            </div>
          </div>
          
          <a 
            href={item.originalUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-white rounded-lg font-medium transition-colors"
          >
            Open Original Source
            <ExternalLink size={18} />
          </a>
        </div>
      </div>
    </div>
  );
}
