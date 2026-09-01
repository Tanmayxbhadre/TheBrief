"use client";

import React, { useState } from 'react';
import { NewsItem, Source, Category } from '@prisma/client';
import { NewsItemCard } from './NewsItemCard';
import { ArticlePreviewPanel } from './ArticlePreviewPanel';
import { Search } from 'lucide-react';

type NewsItemWithRelations = NewsItem & {
  source: Source;
  category: Category | null;
};

interface AdminNewsClientProps {
  initialItems: NewsItemWithRelations[];
  categories: Category[];
}

export function AdminNewsClient({ initialItems, categories }: AdminNewsClientProps) {
  const items = initialItems;
  const [selectedItem, setSelectedItem] = useState<NewsItemWithRelations | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredItems = items.filter(item => {
    // Category filter
    if (filterCategory !== 'all' && item.category?.slug !== filterCategory) {
      return false;
    }
    
    // Status filter
    if (filterStatus !== 'all' && item.status.toLowerCase() !== filterStatus) {
      return false;
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = item.title.toLowerCase().includes(query);
      const matchesSource = item.source.name.toLowerCase().includes(query);
      const matchesCategory = item.category?.name.toLowerCase().includes(query);
      if (!matchesTitle && !matchesSource && !matchesCategory) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">THEBRIEF NEWS DESK</h1>
        
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search title, source, category..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg py-2 px-4 text-sm font-medium outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
            
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg py-2 px-4 text-sm font-medium outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="discovered">Discovered</option>
              <option value="review">Review</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 relative">
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-gray-700 dark:text-gray-300">
              New Stories ({filteredItems.length})
            </h2>
            <span className="text-sm text-gray-500">Newest first</span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No news items found matching your filters.
            </div>
          ) : (
            filteredItems.map(item => (
              <NewsItemCard 
                key={item.id} 
                item={item} 
                onClick={setSelectedItem} 
              />
            ))
          )}
        </div>
      </main>

      {/* Preview Panel Overlay */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40" 
          onClick={() => setSelectedItem(null)}
        />
      )}
      
      {/* Article Preview Panel */}
      <ArticlePreviewPanel 
        item={selectedItem} 
        onClose={() => setSelectedItem(null)} 
      />
    </div>
  );
}
