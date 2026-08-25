export function createInitialDatabase() {
  const now = new Date().toISOString();
  return {
    meta: { schemaVersion: 1, createdAt: now, updatedAt: now },
    users: [],
    wallets: [],
    transactions: [],
    pickups: [],
    wemaChallenges: [],
    notifications: [],
    auditLogs: [],
    materials: [
      { id: 'metal', name: 'Metal', rate: 210, trend: 4.8, active: true, examples: 'Aluminium, copper, steel and cans', updatedAt: now },
      { id: 'plastic', name: 'Plastic', rate: 130, trend: 2.1, active: true, examples: 'Clean PET bottles and containers', updatedAt: now },
      { id: 'ewaste', name: 'E-waste', rate: 180, trend: 6.2, active: true, examples: 'Cables, phones and small devices', updatedAt: now },
      { id: 'paper', name: 'Paper', rate: 100, trend: -1.3, active: true, examples: 'Cardboard, books and office paper', updatedAt: now },
      { id: 'mixed', name: 'Mixed', rate: 80, trend: 1.4, active: true, examples: 'Sorted household recyclables', updatedAt: now }
    ],
    stations: [
      { id: 'station-ikeja', name: 'REKO Ikeja Hub', area: 'Allen Avenue, Ikeja', address: '44 Allen Avenue, Ikeja, Lagos', latitude: 6.6018, longitude: 3.3515, hours: '08:00-19:00', active: true, materials: ['metal', 'plastic', 'paper'] },
      { id: 'station-vi', name: 'GreenPoint VI', area: 'Victoria Island', address: 'Akin Adesola Street, Victoria Island, Lagos', latitude: 6.4281, longitude: 3.4219, hours: '08:00-18:00', active: true, materials: ['plastic', 'ewaste'] },
      { id: 'station-opebi', name: 'EcoDrop Opebi', area: 'Opebi, Ikeja', address: 'Opebi Road, Ikeja, Lagos', latitude: 6.5887, longitude: 3.3636, hours: '09:00-17:00', active: true, materials: ['metal', 'paper'] },
      { id: 'station-yaba', name: 'Circular Lagos Yaba', area: 'Yaba', address: 'Herbert Macaulay Way, Yaba, Lagos', latitude: 6.5158, longitude: 3.3707, hours: '08:00-18:00', active: true, materials: ['metal', 'plastic', 'ewaste', 'paper', 'mixed'] }
    ]
  };
}
