'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { Flame, Sparkles, Tag, Loader2 } from 'lucide-react';
import { Product } from '@/types';
import { Navigation } from '@/components/Navigation';

export default function FeedPage() {
  const [feedItems, setFeedItems] = useState<Product[]>([]);
  const [filter, setFilter] = useState<'all' | 'trending' | 'new' | 'editorial'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, [filter]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      if (filter === 'all') {
        // Fetch all types for 'all' filter
        const [trendingRes, newRes, editorialRes, randomRes] = await Promise.all([
          fetch('/api/products?filter=trending&count=5'),
          fetch('/api/products?filter=new&count=5'),
          fetch('/api/products?filter=editorial&count=5'),
          fetch('/api/products?count=15'),
        ]);

        const [trending, newItems, editorial, random] = await Promise.all([
          trendingRes.json(),
          newRes.json(),
          editorialRes.json(),
          randomRes.json(),
        ]);

        setFeedItems([
          ...trending.products,
          ...newItems.products,
          ...editorial.products,
          ...random.products,
        ]);
      } else {
        const response = await fetch(`/api/products?filter=${filter}&count=20`);
        if (response.ok) {
          const data = await response.json();
          setFeedItems(data.products);
        }
      }
    } catch (error) {
      console.error('Failed to load feed:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-16 lg:pb-0 lg:pl-72">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0 lg:pl-72">
      <div className="lg:px-8 lg:py-8 p-6">
        {/* Desktop Header */}
        <div className="hidden lg:block mb-8 bg-white rounded-3xl p-8 border border-gray-200">
          <h1 className="text-4xl font-black text-gray-900">Fashion Feed</h1>
          <p className="text-gray-600 mt-2">Trending styles curated for you</p>
        </div>

        {/* Mobile Header */}
        <h1 className="lg:hidden text-3xl font-bold mb-6">Your Feed</h1>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'trending' ? 'default' : 'outline'}
            onClick={() => setFilter('trending')}
          >
            <Flame className="mr-2 h-4 w-4" />
            Trending
          </Button>
          <Button
            variant={filter === 'new' ? 'default' : 'outline'}
            onClick={() => setFilter('new')}
          >
            <Tag className="mr-2 h-4 w-4" />
            New Arrivals
          </Button>
          <Button
            variant={filter === 'editorial' ? 'default' : 'outline'}
            onClick={() => setFilter('editorial')}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Editor's Pick
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {feedItems.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition cursor-pointer group">
              <div className="relative aspect-[3/4]">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition"
                />
                {item.trending && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    Trending
                  </div>
                )}
                {item.isNew && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    New
                  </div>
                )}
                {item.isEditorial && (
                  <div className="absolute top-2 left-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Editor's Pick
                  </div>
                )}
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
              <CardContent className="p-3">
                <h3 className="font-semibold text-sm mb-1 line-clamp-1">{item.name}</h3>
                <p className="text-xs text-gray-600 mb-1">{item.brand}</p>
                <p className="font-bold text-sm">{formatPrice(item.price, item.currency)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
    <Navigation />
    </>
  );
}
