'use client';

import { useState, useEffect } from 'react';
import { UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, X, Upload, Loader2, Bell, Shield } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import Image from 'next/image';

interface Photo {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  preferences: {
    sizes?: { top?: string; bottom?: string; shoes?: string };
    budgetRange?: [number, number];
  };
  photos: Photo[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preferences, setPreferences] = useState({
    topSize: '',
    bottomSize: '',
    budgetMin: '',
    budgetMax: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    console.log('🔄 [PROFILE] Fetching user profile...');
    try {
      // Add cache busting parameter to force fresh data
      const response = await fetch(`/api/user/profile?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      console.log('📡 [PROFILE] API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [PROFILE] Profile data received:', {
          userId: data.user.id,
          name: data.user.name,
          email: data.user.email,
          photosCount: data.user.photos?.length || 0,
          photoIds: data.user.photos?.map((p: any) => p.id.substring(0, 8)),
          preferences: data.user.preferences,
        });
        
        console.log('🔄 [PROFILE] Setting profile state with', data.user.photos?.length, 'photos');
        setProfile(data.user);
        
        // Set preferences from profile
        if (data.user.preferences) {
          const prefs = {
            topSize: data.user.preferences.sizes?.top || '',
            bottomSize: data.user.preferences.sizes?.bottom || '',
            budgetMin: data.user.preferences.budgetRange?.[0]?.toString() || '',
            budgetMax: data.user.preferences.budgetRange?.[1]?.toString() || '',
          };
          console.log('⚙️ [PROFILE] Setting preferences:', prefs);
          setPreferences(prefs);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ [PROFILE] Failed to fetch profile:', errorText);
      }
    } catch (error) {
      console.error('❌ [PROFILE] Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      console.log('⚠️ [PROFILE] No files selected');
      return;
    }

    let files = Array.from(e.target.files);
    const currentCount = profile?.photos?.length || 0;
    const remaining = Math.max(0, 5 - currentCount);
    if (files.length > remaining) {
      alert(`You can only add ${remaining} more photo${remaining !== 1 ? 's' : ''}. We'll upload the first ${remaining}.`);
      files = files.slice(0, remaining);
    }

    console.log(`📸 [PROFILE] Starting upload for ${files.length} file(s)`);
    files.forEach((file, i) => {
      console.log(`  File ${i + 1}: ${file.name} (${(file.size / 1024).toFixed(2)} KB, ${file.type})`);
    });
    
    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`⬆️ [PROFILE] Uploading file ${i + 1}/${files.length}: ${file.name}`);
        
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        console.log(`📡 [PROFILE] Upload response status:`, response.status);
        
        if (response.ok) {
          const data = await response.json();
          const urlLength = data.url.length;
          console.log(`✅ [PROFILE] File uploaded successfully (URL length: ${urlLength} chars)`);
          uploadedUrls.push(data.url);
        } else {
          const errorText = await response.text();
          console.error(`❌ [PROFILE] Upload failed:`, errorText);
        }
      }

      console.log(`📦 [PROFILE] All uploads complete. Total URLs: ${uploadedUrls.length}`);

      // Add photos to profile
      console.log('💾 [PROFILE] Adding photos to user profile...');
      const updateResponse = await fetch('/api/user/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrls: uploadedUrls }),
      });

      console.log('📡 [PROFILE] Add photos response status:', updateResponse.status);
      
      if (updateResponse.ok) {
        const result = await updateResponse.json();
        console.log('✅ [PROFILE] Photos added to profile:', result);
        await fetchProfile();
      } else {
        const errorText = await updateResponse.text();
        console.error('❌ [PROFILE] Failed to add photos:', errorText);
        alert('Failed to add photos. Please try again.');
      }
    } catch (error) {
      console.error('❌ [PROFILE] Error during photo upload:', error);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
      console.log('🏁 [PROFILE] Photo upload process complete');
    }
  };

  const handleRemovePhoto = async (photoId: string) => {
    const trimmed = (photoId || '').trim();
    console.log(`🗑️ [PROFILE] Removing photo: ${trimmed} (len=${trimmed.length})`);

    if (!trimmed) {
      console.error('❌ [PROFILE] Delete aborted: empty photo id');
      alert('Invalid photo. Please refresh and try again.');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this photo?')) {
      console.log('⚠️ [PROFILE] Delete cancelled by user');
      return;
    }
    
    try {
      const encodedId = encodeURIComponent(trimmed);
      const response = await fetch(`/api/user/photos/${encodedId}`, {
        method: 'DELETE',
      });

      console.log('📡 [PROFILE] Delete response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ [PROFILE] Photo deleted successfully');
        console.log('✅ [PROFILE] Server response:', result);
        console.log('✅ [PROFILE] Rows affected:', result.rowsAffected);
        
        // Immediately update UI by filtering out the deleted photo
        if (profile) {
          console.log('🔄 [PROFILE] Current photos before filter:', profile.photos.map(p => p.id.substring(0, 8)));
          console.log('🔄 [PROFILE] Filtering out photoId:', trimmed.substring(0, 8));
          
          const updatedPhotos = profile.photos.filter(p => {
            const keep = p.id !== trimmed;
            console.log(`  Photo ${p.id.substring(0, 8)}: ${keep ? 'KEEP' : 'REMOVE'}`);
            return keep;
          });
          
          console.log('🔄 [PROFILE] Photos after filter:', updatedPhotos.map(p => p.id.substring(0, 8)));
          console.log('🔄 [PROFILE] Setting new profile state with', updatedPhotos.length, 'photos');
          
          setProfile({
            ...profile,
            photos: updatedPhotos,
          });
          
          console.log('✅ [PROFILE] State update triggered, remaining photos:', updatedPhotos.length);
        }
        
        // Also fetch fresh data from server to be sure
        console.log('🔄 [PROFILE] Fetching fresh profile data from server...');
        setTimeout(async () => {
          await fetchProfile();
          console.log('✅ [PROFILE] Server refresh complete');
        }, 100);
      } else {
        const errorText = await response.text();
        console.error('❌ [PROFILE] Delete failed:', errorText);
        try {
          const { message } = JSON.parse(errorText);
          alert(message || 'Failed to remove photo. Please try again.');
        } catch (jsonParseError) {
          console.error('❌ [PROFILE] Failed to parse error response as JSON:', jsonParseError);
          alert(`Failed to remove photo. ${errorText ? `Details: ${errorText.substring(0, 100)}${errorText.length > 100 ? '...' : ''}` : 'Please try again.'}`);
        }
      }
    } catch (error) {
      console.error('❌ [PROFILE] Error removing photo:', error);
      alert('Failed to remove photo. Please try again.');
    }
  };

  const handleReplacePhoto = async (photoId: string, file: File) => {
    try {
      setUploading(true);
      // 1) Upload file to get URL
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        const t = await uploadRes.text();
        throw new Error(`Upload failed: ${t}`);
      }
      const { url } = await uploadRes.json();
      // 2) Replace the photo URL
      const putRes = await fetch(`/api/user/photos/${encodeURIComponent(photoId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!putRes.ok) {
        const t = await putRes.text();
        throw new Error(`Replace failed: ${t}`);
      }
      await fetchProfile();
    } catch (err) {
      console.error('❌ [PROFILE] Error replacing photo:', err);
      alert('Failed to replace photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    console.log(`⭐ [PROFILE] Setting photo as primary: ${photoId}`);
    try {
      const response = await fetch(`/api/user/photos/${photoId}/primary`, {
        method: 'PUT',
      });

      console.log('📡 [PROFILE] Set primary response status:', response.status);
      
      if (response.ok) {
        console.log('✅ [PROFILE] Primary photo updated');
        await fetchProfile();
      } else {
        const errorText = await response.text();
        console.error('❌ [PROFILE] Failed to set primary:', errorText);
      }
    } catch (error) {
      console.error('❌ [PROFILE] Error setting primary photo:', error);
    }
  };

  const handleSavePreferences = async () => {
    console.log('💾 [PROFILE] Saving preferences:', preferences);
    setSaving(true);
    try {
      const prefsData = {
        preferences: {
          sizes: {
            top: preferences.topSize,
            bottom: preferences.bottomSize,
          },
          budgetRange:
            preferences.budgetMin && preferences.budgetMax
              ? [parseInt(preferences.budgetMin), parseInt(preferences.budgetMax)]
              : undefined,
        },
      };
      
      console.log('📤 [PROFILE] Sending preferences:', prefsData);
      
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefsData),
      });

      console.log('📡 [PROFILE] Save preferences response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ [PROFILE] Preferences saved:', result);
        alert('Preferences saved successfully!');
        await fetchProfile();
      } else {
        const errorText = await response.text();
        console.error('❌ [PROFILE] Failed to save preferences:', errorText);
        alert('Failed to save preferences. Please try again.');
      }
    } catch (error) {
      console.error('❌ [PROFILE] Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
      console.log('🏁 [PROFILE] Save preferences complete');
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
    <div className="min-h-screen bg-gray-50 p-6 pb-24 lg:pb-8 lg:pl-72">
      <div className="lg:px-8 lg:py-8 max-w-6xl space-y-6">
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between mb-8 bg-white rounded-3xl p-8 border border-gray-200">
          <div>
            <h1 className="text-4xl font-black text-gray-900">Profile & Settings</h1>
            <p className="text-gray-600 mt-2">Manage your account and preferences</p>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between">
          <h1 className="text-3xl font-bold">Profile & Settings</h1>
          <UserButton afterSignOutUrl="/" />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Photos</CardTitle>
                <CardDescription>Manage your photos for virtual try-on (max 5 photos)</CardDescription>
              </div>
              {profile?.photos && profile.photos.length < 5 && (
                <label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Button disabled={uploading} size="sm">
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Add Photos
                      </>
                    )}
                  </Button>
                </label>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {(!profile?.photos || profile.photos.length === 0) ? (
              <div className="text-center py-12">
                <Camera className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">No photos yet. Upload photos for virtual try-on.</p>
                <label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Button disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Your First Photo
                      </>
                    )}
                  </Button>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {profile.photos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 group">
                      <img
                        src={photo.url}
                        alt="Profile photo"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => {
                          console.log('🖱️ [PROFILE] Delete button clicked for:', photo.id);
                          handleRemovePhoto(photo.id);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition hover:bg-red-600 z-10"
                        title="Delete photo"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      {/* Replace photo */}
                      <label className="absolute top-2 left-2 bg-white/80 text-gray-900 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer z-10">
                        Replace
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleReplacePhoto(photo.id, f);
                          }}
                          disabled={uploading}
                        />
                      </label>

                      {photo.isPrimary ? (
                        <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          ⭐ Primary
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSetPrimary(photo.id)}
                          className="absolute bottom-2 left-2 bg-gray-900/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition hover:bg-gray-900"
                          title="Set as primary"
                        >
                          Set as Primary
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {profile.photos.length < 5 && (
                    <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-primary hover:bg-gray-50 transition cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      {uploading ? (
                        <>
                          <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-2" />
                          <span className="text-xs text-gray-500">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-xs text-gray-500">Add Photo</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  💡 Tip: Hover over photos to delete or set as primary. You can upload up to {5 - profile.photos.length} more photo{5 - profile.photos.length !== 1 ? 's' : ''}.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Style Preferences</CardTitle>
            <CardDescription>Update your sizing and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="topSize">Top Size</Label>
                <Input
                  id="topSize"
                  value={preferences.topSize}
                  onChange={(e) => setPreferences({ ...preferences, topSize: e.target.value })}
                  placeholder="S, M, L, XL"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="bottomSize">Bottom Size</Label>
                <Input
                  id="bottomSize"
                  value={preferences.bottomSize}
                  onChange={(e) => setPreferences({ ...preferences, bottomSize: e.target.value })}
                  placeholder="28, 30, 32"
                  className="mt-2"
                />
              </div>
            </div>
            <div>
              <Label>Budget Range</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Input
                  value={preferences.budgetMin}
                  onChange={(e) => setPreferences({ ...preferences, budgetMin: e.target.value })}
                  placeholder="Min ($)"
                  type="number"
                />
                <Input
                  value={preferences.budgetMax}
                  onChange={(e) => setPreferences({ ...preferences, budgetMax: e.target.value })}
                  placeholder="Max ($)"
                  type="number"
                />
              </div>
            </div>
            <Button onClick={handleSavePreferences} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Bell className="inline mr-2 h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email notifications</p>
                <p className="text-sm text-gray-600">Receive emails about new trends</p>
              </div>
              <Button variant="outline" size="sm">Toggle</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push notifications</p>
                <p className="text-sm text-gray-600">Get notified about new recommendations</p>
              </div>
              <Button variant="outline" size="sm">Toggle</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Shield className="inline mr-2 h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full">Change Password</Button>
            <Button variant="outline" className="w-full">Download My Data</Button>
            <Button variant="destructive" className="w-full">Delete Account</Button>
          </CardContent>
        </Card>
      </div>
    </div>
    <Navigation />
    </>
  );
}
