import { supabase } from '@/lib/supabase/client';

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  total_decks: number;
  public_decks: number;
  favorite_archetype: string | null;
  most_used_colors: string[];
  profile_views: number;
  follower_count: number;
  following_count: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
}

/**
 * Get current user's profile
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching current profile:', error);
    return null;
  }

  return data;
}

/**
 * Get profile by username
 */
export async function getProfileByUsername(username: string): Promise<Profile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', username)
    .single();

  if (error) {
    console.error('Error fetching profile by username:', error);
    return null;
  }

  // Increment profile views (fire and forget)
  void supabase.rpc('increment_profile_views', { profile_username: username });

  return data;
}

/**
 * Get profile by ID
 */
export async function getProfileById(id: string): Promise<Profile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching profile by ID:', error);
    return null;
  }

  return data;
}

/**
 * Update current user's profile
 */
export async function updateProfile(updates: UpdateProfileData): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Validate username format if provided
  if (updates.username) {
    if (updates.username.length < 3 || updates.username.length > 30) {
      return { success: false, error: 'Username must be 3-30 characters' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(updates.username)) {
      return { success: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }
  }

  // Validate bio length if provided
  if (updates.bio && updates.bio.length > 500) {
    return { success: false, error: 'Bio must be 500 characters or less' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    // Check for unique constraint violation on username
    if (error.code === '23505') {
      return { success: false, error: 'Username already taken' };
    }
    console.error('Error updating profile:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Upload avatar image to Supabase Storage
 */
export async function uploadAvatar(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return { success: false, error: 'Invalid file type. Please upload a JPEG, PNG, WEBP, or GIF image.' };
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: 'File size must be less than 2MB' };
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError);
    return { success: false, error: uploadError.message };
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  // Update profile with new avatar URL
  const updateResult = await updateProfile({ avatar_url: publicUrl });
  if (!updateResult.success) {
    return { success: false, error: updateResult.error };
  }

  return { success: true, url: publicUrl };
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  if (!supabase) return false;

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned (username available)
    console.error('Error checking username availability:', error);
    return false;
  }

  // Username is available if no data returned, or if the returned ID matches current user
  return !data || (user ? data.id === user.id : false);
}
