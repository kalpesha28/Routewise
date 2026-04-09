import { supabase } from './supabase';
import { Driver, DeliverySession, Stop, StopInput } from '@/types';

export async function getOrCreateDriver(
  userId: string,
  email: string
): Promise<Driver | null> {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    const { data: newDriver, error: createError } = await supabase
      .from('drivers')
      .insert({ id: userId, phone: email, name: '', vehicle_type: 'bike' })
      .select()
      .single();
    if (createError) { console.error(createError); return null; }
    return newDriver;
  }
  if (error) { console.error(error); return null; }
  return data;
}

export async function updateDriver(
  userId: string,
  updates: Partial<Pick<Driver, 'name' | 'vehicle_type'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('drivers')
    .update(updates)
    .eq('id', userId);
  if (error) { console.error(error); return false; }
  return true;
}

export async function createSession(driverId: string): Promise<DeliverySession | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('delivery_sessions')
    .insert({
      driver_id: driverId,
      date: today,
      status: 'planning',
      total_distance_km: 0,
      optimized_distance_km: 0,
      fuel_saved_inr: 0,
    })
    .select()
    .single();
  if (error) { console.error(error); return null; }
  return { ...data, stops: [] };
}

export async function getSession(sessionId: string): Promise<DeliverySession | null> {
  const { data, error } = await supabase
    .from('delivery_sessions')
    .select('*, stops(*)')
    .eq('id', sessionId)
    .single();
  if (error) { console.error(error); return null; }
  const stops = (data.stops as Stop[]).sort((a, b) => a.order_index - b.order_index);
  return { ...data, stops };
}

export async function getTodaySession(driverId: string): Promise<DeliverySession | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('delivery_sessions')
    .select('*, stops(*)')
    .eq('driver_id', driverId)
    .eq('date', today)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) { console.error(error); return null; }
  if (!data) return null;
  const stops = (data.stops as Stop[]).sort((a, b) => a.order_index - b.order_index);
  return { ...data, stops };
}

export async function updateSession(
  sessionId: string,
  updates: Partial<DeliverySession>
): Promise<boolean> {
  const { stops, ...rest } = updates as any;
  const { error } = await supabase
    .from('delivery_sessions')
    .update(rest)
    .eq('id', sessionId);
  if (error) { console.error(error); return false; }
  return true;
}

export async function getPastSessions(driverId: string): Promise<DeliverySession[]> {
  const { data, error } = await supabase
    .from('delivery_sessions')
    .select('*, stops(*)')
    .eq('driver_id', driverId)
    .eq('status', 'completed')
    .order('date', { ascending: false })
    .limit(30);
  if (error) { console.error(error); return []; }
  return (data ?? []).map(s => ({
    ...s,
    stops: (s.stops as Stop[]).sort((a, b) => a.order_index - b.order_index),
  }));
}

export async function addStop(
  sessionId: string,
  stopData: StopInput,
  orderIndex: number
): Promise<Stop | null> {
  const { data, error } = await supabase
    .from('stops')
    .insert({
      session_id: sessionId,
      order_index: orderIndex,
      status: 'pending',
      ...stopData,
    })
    .select()
    .single();
  if (error) { console.error(error); return null; }
  return data;
}

export async function deleteStop(stopId: string): Promise<boolean> {
  const { error } = await supabase.from('stops').delete().eq('id', stopId);
  if (error) { console.error(error); return false; }
  return true;
}

export async function updateStopOrder(
  stops: { id: string; order_index: number }[]
): Promise<boolean> {
  const updates = stops.map(s =>
    supabase.from('stops').update({ order_index: s.order_index }).eq('id', s.id)
  );
  const results = await Promise.all(updates);
  return results.every(r => !r.error);
}

export async function markStopDelivered(
  stopId: string,
  proofPhotoUrl?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('stops')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
      proof_photo_url: proofPhotoUrl ?? null,
    })
    .eq('id', stopId);
  if (error) { console.error(error); return false; }
  return true;
}

export async function markStopFailed(stopId: string): Promise<boolean> {
  const { error } = await supabase
    .from('stops')
    .update({ status: 'failed' })
    .eq('id', stopId);
  if (error) { console.error(error); return false; }
  return true;
}