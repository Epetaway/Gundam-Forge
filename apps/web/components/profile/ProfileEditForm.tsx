'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { updateProfile, uploadAvatar, isUsernameAvailable, type Profile, type UpdateProfileData } from '@/lib/api/profiles';

interface ProfileEditFormProps {
  profile: Profile;
  onSave?: () => void;
  onCancel?: () => void;
}

export function ProfileEditForm({ profile, onSave, onCancel }: ProfileEditFormProps): JSX.Element {
  const [username, setUsername] = React.useState(profile.username || '');
  const [displayName, setDisplayName] = React.useState(profile.display_name || '');
  const [bio, setBio] = React.useState(profile.bio || '');
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState(profile.avatar_url || '');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [usernameChecking, setUsernameChecking] = React.useState(false);
  const [usernameError, setUsernameError] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Debounced username availability check
  React.useEffect(() => {
    if (username === profile.username) {
      setUsernameError('');
      return;
    }

    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameChecking(true);
      const available = await isUsernameAvailable(username);
      setUsernameChecking(false);
      
      if (!available) {
        setUsernameError('Username already taken');
      } else {
        setUsernameError('');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, profile.username]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (usernameError) {
      setError(usernameError);
      return;
    }

    setPending(true);

    try {
      // Upload avatar if changed
      let avatarUrl: string | undefined = profile.avatar_url || undefined;
      if (avatarFile) {
        const uploadResult = await uploadAvatar(avatarFile);
        if (!uploadResult.success) {
          setError(uploadResult.error || 'Failed to upload avatar');
          return;
        }
        avatarUrl = uploadResult.url;
      }

      // Update profile
      const updates: UpdateProfileData = {};
      if (username !== profile.username) updates.username = username;
      if (displayName !== profile.display_name) updates.display_name = displayName;
      if (bio !== profile.bio) updates.bio = bio;
      const currentAvatarUrl = profile.avatar_url || undefined;
      if (avatarUrl !== currentAvatarUrl && avatarUrl !== undefined) {
        updates.avatar_url = avatarUrl;
      }

      if (Object.keys(updates).length === 0) {
        setSuccess('No changes to save');
        return;
      }

      const result = await updateProfile(updates);
      
      if (!result.success) {
        setError(result.error || 'Failed to update profile');
        return;
      }

      setSuccess('Profile updated successfully!');
      
      // Call onSave callback after a short delay
      if (onSave) {
        setTimeout(() => {
          onSave();
        }, 1000);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>Update your public profile information</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-full bg-steel-200">
              {avatarPreview ? (
                <img
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                  src={avatarPreview}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-steel-500">
                  {username[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
                ref={fileInputRef}
                type="file"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                size="sm"
                type="button"
                variant="secondary"
              >
                Change Avatar
              </Button>
              <p className="mt-1 text-xs text-steel-600">
                JPEG, PNG, WEBP, or GIF. Max 2MB.
              </p>
            </div>
          </div>

          {/* Username */}
          <div>
            <Input
              id="username"
              label="Username"
              maxLength={30}
              minLength={3}
              onChange={(e) => setUsername(e.target.value)}
              required
              type="text"
              value={username}
            />
            {usernameChecking && (
              <p className="mt-1 text-xs text-steel-600">Checking availability...</p>
            )}
            {usernameError && (
              <p className="mt-1 text-xs text-red-600">{usernameError}</p>
            )}
            {!usernameChecking && !usernameError && username !== profile.username && (
              <p className="mt-1 text-xs text-green-600">Username available!</p>
            )}
          </div>

          {/* Display Name */}
          <Input
            id="display-name"
            label="Display Name"
            maxLength={50}
            onChange={(e) => setDisplayName(e.target.value)}
            type="text"
            value={displayName}
          />

          {/* Bio */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="bio">
              Bio
            </label>
            <textarea
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-steel-500 focus:border-cobalt-500 focus:outline-none focus:ring-1 focus:ring-cobalt-500"
              id="bio"
              maxLength={500}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              value={bio}
            />
            <p className="mt-1 text-xs text-steel-600">
              {bio.length}/500 characters
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {success}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              className="flex-1"
              disabled={pending || !!usernameError}
              type="submit"
            >
              {pending ? 'Saving...' : 'Save Changes'}
            </Button>
            {onCancel && (
              <Button
                onClick={onCancel}
                type="button"
                variant="secondary"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
