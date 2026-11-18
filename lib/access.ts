import 'server-only';
import { randomBytes } from 'crypto';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/** The trip, if it exists and belongs to the signed-in user; otherwise null. */
export async function getOwnedTrip(tripId: string) {
  if (!isUuid(tripId)) return null;
  const user = await getCurrentUser();
  if (!user) return null;
  return db.trip.findFirst({ where: { id: tripId, userId: user.id } });
}

/** Same as getOwnedTrip, but throws for use inside server actions. */
export async function requireOwnedTrip(tripId: string) {
  const trip = await getOwnedTrip(tripId);
  if (!trip) throw new Error('Trip not found.');
  return trip;
}

/** The member (with trip) behind a personal share link, or null. */
export async function getMemberByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  return db.member.findUnique({ where: { shareToken: token }, include: { trip: true } });
}

export function newShareToken() {
  return randomBytes(18).toString('base64url');
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
