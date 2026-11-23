# KG Taxi Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **PII Isolation**: `/users/{userId}`, `/users/{userId}/cards/{cardId}`, `/users/{userId}/trips/{tripId}`, and `/drivers/{driverId}` contain personal data (phone, email, bank cards, driver license) and MUST NEVER be readable by other regular users.
2. **Master Gate Relational Sync**: Every document in `/users/{userId}/cards/{cardId}` and `/users/{userId}/trips/{tripId}` requires the parent `/users/{userId}` document to exist. Every `/rides/{rideId}/bids/{bidId}` requires `/rides/{rideId}` to exist and be in `bidding` status.
3. **No Self-Approved Drivers**: A driver creating `/drivers/{driverId}` MUST set `uid == request.auth.uid` and `verificationStatus == 'pending'`. Only a verified admin (`isAdmin()`) may set `verificationStatus` to `'approved'` or `'rejected'`.
4. **Immutable Ownership & Timestamps**: `uid`, `passengerUid`, and `createdAt` MUST be immutable after creation. All `createdAt` on create and `updatedAt` on update MUST equal `request.time`.
5. **Terminal State Locking**: Once a `/rides/{rideId}` reaches `status` of `'completed'` or `'cancelled'`, non-admin users are strictly forbidden from modifying it.
6. **Admin-Only Fleet Controls**: Only verified admins may create or update `/fleet_settings/{cityId}`.
7. **Verified Auth Only**: All write operations require `request.auth != null && request.auth.token.email_verified == true`.
8. **Zero DB Lookups in List Queries**: `allow list` rules evaluate only `resource.data`, `request.auth.uid`, and verified admin email claims without `get()` or `exists()`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Shadow Field Injection on User Create**: Sending `isAdmin: true` in `/users/{uid}` -> MUST FAIL (`hasOnly`).
2. **Identity Spoofing on Ride Create**: Sending `passengerUid: "victim_uid"` while signed in as `attacker_uid` -> MUST FAIL (`incoming().passengerUid == request.auth.uid`).
3. **Self-Approving Driver Registration**: Creating `/drivers/{uid}` with `verificationStatus: "approved"` -> MUST FAIL (`verificationStatus == 'pending'`).
4. **Cross-User PII Read**: Reading `/users/victim_uid` as `attacker_uid` -> MUST FAIL (`isOwner`).
5. **Cross-User Driver Document Read**: Reading `/drivers/victim_driver` as `attacker_uid` -> MUST FAIL (`isOwner || isAdmin`).
6. **Unverified Admin Email Spoof**: Accessing `/fleet_settings/bishkek` write with admin email but `email_verified: false` -> MUST FAIL (`email_verified == true`).
7. **Terminal Ride Re-Opening**: Updating a `completed` ride back to `in_trip` as passenger or driver -> MUST FAIL (terminal state lock).
8. **Client-Forged Timestamp**: Creating a ride with `createdAt` != `request.time` -> MUST FAIL (temporal integrity).
9. **Resource Poisoning via Oversized ID**: Creating `/rides/${"a".repeat(200)}` -> MUST FAIL (`isValidId`).
10. **Value Poisoning on Ride Update**: Updating `fare` to `-500` or string `"free"` -> MUST FAIL (`isValidLiveRide`).
11. **Orphaned Bid Creation**: Creating `/rides/nonexistent_ride/bids/bid_1` -> MUST FAIL (`exists` Master Gate).
12. **Unauthorized Fleet Surge Tampering**: Non-admin user updating `/fleet_settings/bishkek` `surgeMultiplier: 0.1` -> MUST FAIL (`isAdmin`).
