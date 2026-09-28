import { supabase } from '../api/supabase';

export const photoStorage = {
  /**
   * Upload an activity photo to Supabase storage.
   * If online, returns the public web URL.
   * If offline or error occurs, falls back gracefully to the local URI.
   */
  async uploadActivityPhoto(athleteId: string, localUri: string): Promise<string> {
    try {
      const response = await fetch(localUri);
      const blob = await response.blob();
      
      const fileExt = localUri.split('.').pop()?.toLowerCase() || 'jpg';
      const cleanExt = fileExt === 'png' ? 'png' : 'jpeg';
      const fileName = `${athleteId || 'anonymous'}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('activity-photos')
        .upload(fileName, blob, {
          contentType: `image/${cleanExt}`,
          upsert: true,
        });

      if (error) {
        console.warn('Supabase storage upload error, using localUri fallback:', error.message);
        return localUri;
      }

      const { data: publicUrlData } = supabase.storage
        .from('activity-photos')
        .getPublicUrl(fileName);

      return publicUrlData?.publicUrl || localUri;
    } catch (err: any) {
      console.warn('photoStorage.uploadActivityPhoto failed, fallback to localUri:', err?.message || err);
      return localUri;
    }
  },
};
