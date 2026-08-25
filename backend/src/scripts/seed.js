import bcrypt from 'bcryptjs';
import { store } from '../db/store.js';
import { id, publicPickupId } from '../lib/ids.js';

await store.reset();
const passwordHash = await bcrypt.hash('Demo123!', 12);
await store.transaction((database) => {
  const now = new Date().toISOString();
  const distributor = { id: id(), role: 'distributor', firstName: 'User', lastName: 'Ade', email: 'distributor@reko.demo', phone: '+2348000000001', passwordHash, active: true, onboardingSource: 'seed', createdAt: now, updatedAt: now };
  const collector = { id: id(), role: 'collector', firstName: 'Musa', lastName: 'Adebayo', email: 'collector@reko.demo', phone: '+2348000000002', businessName: 'Musa Collection Services', passwordHash, active: true, onboardingSource: 'seed', createdAt: now, updatedAt: now };
  database.users.push(distributor, collector);
  database.wallets.push(
    { id: id(), userId: distributor.id, currency: 'NGN', balance: 24560, availableBalance: 24560, provider: 'wema', providerAccountLast4: '4072', createdAt: now, updatedAt: now },
    { id: id(), userId: collector.id, currency: 'NGN', balance: 18740, availableBalance: 18740, provider: 'wema', providerAccountLast4: '1189', createdAt: now, updatedAt: now },
  );
  const examples = [
    { materialId: 'metal', weight: 28, latitude: 6.5887, longitude: 3.3636, area: 'Opebi, Ikeja' },
    { materialId: 'plastic', weight: 42, latitude: 6.6018, longitude: 3.3515, area: 'Allen Avenue, Ikeja' },
    { materialId: 'ewaste', weight: 16, latitude: 6.5732, longitude: 3.3675, area: 'Maryland, Lagos' },
  ];
  for (const example of examples) {
    const material = database.materials.find((item) => item.id === example.materialId);
    const pickup = {
      id: id(), publicId: publicPickupId(), customerId: distributor.id, collectorId: null,
      items: [{ materialId: example.materialId, estimatedWeight: example.weight, rateAtBooking: material.rate, estimatedPayout: example.weight * material.rate }],
      address: { label: example.area, latitude: example.latitude, longitude: example.longitude }, pickupWindow: 'Today · 2:00–4:00 PM',
      photos: [], customerNote: null, status: 'pending', estimatedWeight: example.weight, estimatedPayout: example.weight * material.rate,
      collectorFee: 1250, createdAt: now, updatedAt: now,
    };
    database.pickups.push(pickup);
  }
});
console.log('Seeded REKO backend.');
console.log('Distributor: distributor@reko.demo / Demo123!');
console.log('Collector:   collector@reko.demo / Demo123!');
