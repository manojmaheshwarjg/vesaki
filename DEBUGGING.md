# Console Logging Guide

All photo upload and profile management features now have comprehensive console logging for debugging.

## How to Debug

1. Open your browser's Developer Tools (F12 or Cmd+Option+I on Mac)
2. Go to the **Console** tab
3. Perform actions in the app

## Log Prefixes

All logs are prefixed with emojis and tags for easy filtering:

- `🔄 [PROFILE]` - Profile data loading
- `📸 [PROFILE]` - Photo upload started
- `⬆️ [PROFILE]` - Individual file upload
- `📡 [PROFILE]` - API response status
- `✅ [PROFILE]` - Success messages
- `❌ [PROFILE]` - Error messages
- `💾 [PROFILE]` - Saving data
- `🗑️ [PROFILE]` - Deleting photos
- `⭐ [PROFILE]` - Setting primary photo
- `🏁 [PROFILE]` - Process complete

## Onboarding Page Logs

The onboarding page (`/onboarding`) logs:
- Photo selection and preview creation
- Photo removal
- Upload progress for each file
- Profile data being saved
- API responses and errors
- Final redirect

## Profile Page Logs

The profile page (`/profile`) logs:
- Profile data fetch on load
- Photo upload with file details (name, size, type)
- Photo deletion
- Setting primary photo
- Preference updates
- All API responses

## What to Look For

### Photo Upload Issues
```
📸 [PROFILE] Starting upload for 2 file(s)
  File 1: photo.jpg (1024.50 KB, image/jpeg)
  File 2: selfie.png (856.23 KB, image/png)
⬆️ [PROFILE] Uploading file 1/2: photo.jpg
📡 [PROFILE] Upload response status: 200
✅ [PROFILE] File uploaded successfully (URL length: 45678 chars)
```

### Database Save Issues
```
💾 [PROFILE] Adding photos to user profile...
📡 [PROFILE] Add photos response status: 200
✅ [PROFILE] Photos added to profile: { success: true }
```

### Error Messages
```
❌ [PROFILE] Upload failed: File too large
❌ [PROFILE] Error details: { message: "...", stack: "..." }
```

## Tips

- Filter console by typing `[PROFILE]` in the console filter box
- Check network tab for failed API requests
- Look for red error messages
- Base64 image URLs will show their character length, not the full string
