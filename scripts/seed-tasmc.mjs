// TASMC 2026 seeder — idempotent (upserts, no destructive clears of
// registrations/payments/abstracts). Run:  node scripts/seed-tasmc.mjs
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';

const env = fs.readFileSync('.env.local', 'utf8');
const uri = env.match(/^MONGODB_URI=(.+)$/m)[1].trim();

const now = new Date();
const bank = {
  accountName: 'APPLE EVENTS',
  accountNumber: '80950200001310',
  ifscCode: 'BARB0VJMAKO',
  bankName: 'Bank of Baroda',
  branch: 'Manikonda - Jagir Branch, Hyderabad 500089',
  upiId: '',
  instructions:
    'Transfer the registration fee to the account above and enter the UTR/reference number in the form. Your registration is confirmed once the payment is verified.',
};

// tariff → pricing per tier, keyed by the config.registration category keys
const tier = (amounts) => ({
  'iasm-member': { amount: amounts.member, currency: 'INR', label: 'TASM Member' },
  'non-member': { amount: amounts.nonMember, currency: 'INR', label: 'Non-Member' },
  'postgraduate': { amount: amounts.student, currency: 'INR', label: 'Postgraduate / Student' },
  // guesses — FLAGGED for confirmation
  'faculty': { amount: amounts.member, currency: 'INR', label: 'Faculty' },
  'physiotherapist': { amount: amounts.nonMember, currency: 'INR', label: 'Physiotherapist / Allied Health' },
  'international': { amount: amounts.nonMember, currency: 'INR', label: 'International Delegate' },
});

const client = new MongoClient(uri);
await client.connect();
const db = client.db();
console.log('✅ connected:', db.databaseName);

// 1. Email config
await db.collection('configurations').updateOne(
  { key: 'email_settings' },
  { $set: { key: 'email_settings', 'value.fromName': 'TASMC 2026', 'value.fromEmail': 'contact@tasm2026.com', 'value.replyTo': 'contact@tasm2026.com', updatedAt: now }, $setOnInsert: { createdAt: now } },
  { upsert: true }
);
console.log('✅ email config → contact@tasm2026.com');

// 2. Admin + reviewer (PurpleHat operator)
const mkUser = async (email, role, firstName) => {
  const password = await bcrypt.hash('1234567890', 12);
  await db.collection('users').updateOne(
    { email },
    { $set: { email, password, role, profile: { firstName, lastName: 'Events', title: 'Mr.', phone: '9999999999' }, isVerified: true, isActive: true, activeSessions: [], updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );
  console.log(`✅ ${role}: ${email} / 1234567890`);
};
await mkUser('hello@purplehatevents.in', 'admin', 'PurpleHat');
await mkUser('reviewer@purplehatevents.in', 'reviewer', 'Reviewer');

// 3. Payment config — bank transfer (Bank of Baroda), gateway off
await db.collection('configurations').updateOne(
  { type: 'payment', key: 'methods' },
  { $set: { type: 'payment', key: 'methods', value: { gateway: false, bankTransfer: true, externalRedirect: false, externalRedirectUrl: '', bankDetails: { accountName: bank.accountName, accountNumber: bank.accountNumber, ifscCode: bank.ifscCode, bankName: bank.bankName, branch: bank.branch, qrCodeUrl: '' } }, isActive: true, updatedAt: now }, $setOnInsert: { createdAt: now } },
  { upsert: true }
);
await db.collection('payment_config').updateOne(
  { type: 'main' },
  { $set: { type: 'main', config: { bankTransfer: { enabled: true, ...bank }, razorpay: { enabled: false, keyId: '', keySecret: '' } }, updatedAt: now }, $setOnInsert: { createdAt: now } },
  { upsert: true }
);
console.log('✅ payment config → Bank of Baroda / APPLE EVENTS (bank transfer)');

// 4. Pricing tiers (tariff) — upsert by code
const tiers = [
  { name: 'Early Bird', code: 'EARLYBIRD', startDate: new Date('2026-06-23'), endDate: new Date('2026-07-31'), categories: tier({ member: 3500, nonMember: 4000, student: 3000 }) },
  { name: 'Regular', code: 'REGULAR', startDate: new Date('2026-08-01'), endDate: new Date('2026-09-04'), categories: tier({ member: 4000, nonMember: 4500, student: 3500 }) },
  { name: 'Spot Registration', code: 'SPOT', startDate: new Date('2026-09-05'), endDate: new Date('2026-09-06'), categories: tier({ member: 5000, nonMember: 5000, student: 4000 }) },
];
for (const t of tiers) {
  await db.collection('pricing_tiers').updateOne(
    { code: t.code },
    { $set: { ...t, discount: 0, active: true, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );
}
console.log('✅ pricing tiers → tariff (EARLYBIRD/REGULAR/SPOT)');

await client.close();
console.log('\n🎉 TASMC seed complete.');
