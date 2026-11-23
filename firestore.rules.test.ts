/**
 * Security Rules Specification Verification Suite (Dirty Dozen Payloads)
 * Documents the 12 adversarial payloads that must return PERMISSION_DENIED
 * against firestore.rules.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Shadow Field Injection on User Create (isAdmin: true)',
    operation: 'create',
    path: '/users/attacker_1',
    auth: { uid: 'attacker_1', email: 'a@example.com', email_verified: true },
    payload: { uid: 'attacker_1', name: 'Attacker', email: 'a@example.com', defaultCity: 'bishkek', isAdmin: true },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 2,
    name: 'Identity Spoofing on Ride Create',
    operation: 'create',
    path: '/rides/ride_spoof',
    auth: { uid: 'attacker_1', email: 'a@example.com', email_verified: true },
    payload: { passengerUid: 'victim_1', passengerName: 'Victim', cityId: 'bishkek', status: 'searching', fare: 150 },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 3,
    name: 'Self-Approving Driver Registration',
    operation: 'create',
    path: '/drivers/attacker_1',
    auth: { uid: 'attacker_1', email: 'a@example.com', email_verified: true },
    payload: { uid: 'attacker_1', name: 'Fake Driver', verificationStatus: 'approved', isOnline: true },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 4,
    name: 'Cross-User PII Read on /users',
    operation: 'get',
    path: '/users/victim_1',
    auth: { uid: 'attacker_1', email: 'a@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 5,
    name: 'Cross-User Private Driver Read on /drivers',
    operation: 'get',
    path: '/drivers/driver_victim',
    auth: { uid: 'attacker_1', email: 'a@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 6,
    name: 'Unverified Admin Email Spoof on /fleet_settings',
    operation: 'update',
    path: '/fleet_settings/bishkek',
    auth: { uid: 'spoof_admin', email: 'mr.amantur@gmail.com', email_verified: false },
    payload: { cityId: 'bishkek', surgeMultiplier: 2.0 },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 7,
    name: 'Terminal State Re-Opening on Completed Ride',
    operation: 'update',
    path: '/rides/completed_ride_1',
    auth: { uid: 'passenger_1', email: 'p@example.com', email_verified: true },
    payload: { status: 'in_trip' },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 8,
    name: 'Client-Forged Timestamp on Ride Create',
    operation: 'create',
    path: '/rides/forged_ts',
    auth: { uid: 'passenger_1', email: 'p@example.com', email_verified: true },
    payload: { passengerUid: 'passenger_1', createdAt: '1999-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 9,
    name: 'Resource Poisoning via Oversized Document ID',
    operation: 'create',
    path: `/rides/${'a'.repeat(160)}`,
    auth: { uid: 'passenger_1', email: 'p@example.com', email_verified: true },
    payload: { passengerUid: 'passenger_1', status: 'searching' },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 10,
    name: 'Value Poisoning (Negative Fare) on Ride Update',
    operation: 'update',
    path: '/rides/active_ride_1',
    auth: { uid: 'passenger_1', email: 'p@example.com', email_verified: true },
    payload: { fare: -500 },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 11,
    name: 'Orphaned Bid on Non-Existent Ride',
    operation: 'create',
    path: '/rides/nonexistent_ride/bids/bid_1',
    auth: { uid: 'driver_1', email: 'd@example.com', email_verified: true },
    payload: { rideId: 'nonexistent_ride', driverUid: 'driver_1', price: 200, status: 'pending' },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 12,
    name: 'Unauthorized Fleet Surge Tampering by Regular User',
    operation: 'update',
    path: '/fleet_settings/bishkek',
    auth: { uid: 'regular_user', email: 'u@example.com', email_verified: true },
    payload: { cityId: 'bishkek', surgeMultiplier: 0.1 },
    expected: 'PERMISSION_DENIED'
  }
];
