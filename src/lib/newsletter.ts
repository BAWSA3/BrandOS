import supabase from './supabase';

export interface EmailSignup {
  id: string;
  email: string;
  source: string;
  createdAt: string;
}

export async function addEmailSignup(
  email: string,
  source: string = 'landing'
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const { data: existing } = await supabase
      .from('EmailSignup')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existing) {
      return { success: false, error: 'Email already registered' };
    }

    // Generate a cuid-like ID
    const id = `signup_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Add new signup with explicit id and createdAt
    const { error } = await supabase
      .from('EmailSignup')
      .insert({
        id,
        email: normalizedEmail,
        source,
        createdAt: new Date().toISOString(),
      });

    if (error) {
      console.error('[Newsletter] Supabase error:', error);
      return { success: false, error: `Failed to save signup: ${error.message}` };
    }

    return { success: true };
  } catch (error) {
    console.error('[Newsletter] Error adding signup:', error);
    return { success: false, error: 'Failed to save signup' };
  }
}

export async function getSignupCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('EmailSignup')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('[Newsletter] Error getting signup count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('[Newsletter] Error getting signup count:', error);
    return 0;
  }
}

export async function getAllSignups(): Promise<EmailSignup[]> {
  try {
    const { data, error } = await supabase
      .from('EmailSignup')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[Newsletter] Error getting all signups:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Newsletter] Error getting all signups:', error);
    return [];
  }
}

export async function getSignupsBySource(source: string): Promise<EmailSignup[]> {
  try {
    const { data, error } = await supabase
      .from('EmailSignup')
      .select('*')
      .eq('source', source)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[Newsletter] Error getting signups by source:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Newsletter] Error getting signups by source:', error);
    return [];
  }
}
