'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import { Heart, Plus, ExternalLink, Trash2, Loader2 } from 'lucide-react';
import { Navigation } from '@/components/Navigation';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  retailer: string;
  imageUrl: string;
  productUrl: string;
}

interface CollectionItem {
  id: string;
  product: Product;
}

interface Collection {
  id: string;
  name: string;
  isDefault: boolean;
  items: CollectionItem[];
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/collections');
      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections);
        if (data.collections.length > 0) {
          setSelectedCollection(data.collections[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    }
    setLoading(false);
  };

  const createCollection = async () => {
    if (newCollectionName.trim()) {
      try {
        const response = await fetch('/api/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCollectionName }),
        });

        if (response.ok) {
          await fetchCollections();
          setNewCollectionName('');
          setShowNewCollection(false);
        }
      } catch (error) {
        console.error('Failed to create collection:', error);
      }
    }
  };

  const removeItem = async (collectionId: string, itemId: string) => {
    try {
      const response = await fetch(`/api/collections/${collectionId}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCollections();
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-gray-900">My Collections</h1>
              <p className="text-gray-600 mt-2">Organize your favorite fashion finds</p>
            </div>
            <Button onClick={() => setShowNewCollection(true)} className="rounded-full px-6 py-6 text-base">
              <Plus className="mr-2 h-5 w-5" />
              New Collection
            </Button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Collections</h1>
          <Button onClick={() => setShowNewCollection(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Collection
          </Button>
        </div>

        {showNewCollection && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Collection name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createCollection()}
                />
                <Button onClick={createCollection}>Create</Button>
                <Button variant="outline" onClick={() => setShowNewCollection(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {collections.map((collection) => (
            <Button
              key={collection.id}
              variant={selectedCollection.id === collection.id ? 'default' : 'outline'}
              onClick={() => setSelectedCollection(collection)}
              className="whitespace-nowrap"
            >
              {collection.isDefault && <Heart className="mr-2 h-4 w-4" />}
              {collection.name}
              <span className="ml-2 text-xs">({collection.items.length})</span>
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {selectedCollection?.items.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition">
              <div className="relative h-80">
                <Image
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-1">{item.product.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{item.product.brand}</p>
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold text-lg">{formatPrice(item.product.price, item.product.currency)}</p>
                  <p className="text-sm text-gray-500">{item.product.retailer}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(item.product.productUrl, '_blank')}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Buy Now
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removeItem(selectedCollection.id, item.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedCollection && selectedCollection.items.length === 0 && (
          <div className="text-center py-16">
            <Heart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No items yet</h3>
            <p className="text-gray-500">
              Start swiping to add items to this collection
            </p>
          </div>
        )}
      </div>
    </div>
    <Navigation />
    </>
  );
}
