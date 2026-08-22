import { Box, Cpu, FileText, Package, Recycle } from 'lucide-react';

export const materials = [
  { id: 'metal', name: 'Metal', rate: 210, trend: 4.8, icon: Recycle, color: '#1B4D3E', examples: 'Aluminium, copper, steel & cans' },
  { id: 'plastic', name: 'Plastic', rate: 130, trend: 2.1, icon: Package, color: '#4A7C59', examples: 'Clean PET bottles & containers' },
  { id: 'ewaste', name: 'E-waste', rate: 180, trend: 6.2, icon: Cpu, color: '#7A5C45', examples: 'Cables, phones & small devices' },
  { id: 'paper', name: 'Paper', rate: 100, trend: -1.3, icon: FileText, color: '#667085', examples: 'Cardboard, books & office paper' },
  { id: 'mixed', name: 'Mixed', rate: 80, trend: 1.4, icon: Box, color: '#8A6F4D', examples: 'Sorted household recyclables' },
];

export const requests = [
  { id: 'RKO-2408', material: 'Metal', weight: 25, amount: 5250, status: 'Collector arriving', date: 'Today, 10:30 AM', collector: 'Musa A.', eta: '12 min' },
  { id: 'RKO-2391', material: 'Plastic', weight: 18, amount: 2340, status: 'Paid', date: '18 Aug, 4:00 PM', collector: 'Tomi K.', eta: null },
  { id: 'RKO-2374', material: 'E-waste', weight: 12, amount: 2160, status: 'Paid', date: '11 Aug, 11:30 AM', collector: 'Idris O.', eta: null },
  { id: 'RKO-2355', material: 'Paper', weight: 31, amount: 3100, status: 'Paid', date: '02 Aug, 2:15 PM', collector: 'Amaka E.', eta: null },
];

export const transactions = [
  { id: 'TX-8124', name: 'Metal pickup', meta: 'RKO-2401 · 25 kg', amount: 5250, type: 'credit', date: '18 Aug' },
  { id: 'TX-8088', name: 'Bank withdrawal', meta: 'Wema Bank · •••• 4072', amount: 10000, type: 'debit', date: '14 Aug' },
  { id: 'TX-8012', name: 'Plastic pickup', meta: 'RKO-2391 · 18 kg', amount: 2340, type: 'credit', date: '11 Aug' },
  { id: 'TX-7977', name: 'E-waste pickup', meta: 'RKO-2374 · 12 kg', amount: 2160, type: 'credit', date: '05 Aug' },
];

export const stations = [
  { id: 1, name: 'REKO Ikeja Hub', area: 'Allen Avenue, Ikeja', distance: '0.6 km', hours: 'Open until 7 PM', materials: ['Metal', 'Plastic', 'Paper'], x: 56, y: 35 },
  { id: 2, name: 'GreenPoint VI', area: 'Akin Adesola, Victoria Island', distance: '1.2 km', hours: 'Open until 6 PM', materials: ['Plastic', 'E-waste'], x: 31, y: 62 },
  { id: 3, name: 'EcoDrop Opebi', area: 'Opebi Road, Ikeja', distance: '2.1 km', hours: 'Open until 5 PM', materials: ['Metal', 'Paper'], x: 73, y: 70 },
  { id: 4, name: 'Circular Lagos Yaba', area: 'Herbert Macaulay Way, Yaba', distance: '4.8 km', hours: 'Open until 6 PM', materials: ['All materials'], x: 82, y: 24 },
];

export const collectorOrders = [
  { id: 'RKO-2519', customer: 'Damilola A.', initials: 'DA', material: 'Metal', weight: 28, distance: 0.8, area: 'Opebi, Ikeja', address: '19 Opebi Road, Ikeja', window: 'Today · 1:00–3:00 PM', fee: 1450, posted: '4 min ago', x: 58, y: 37, status: 'Available', items: 'Aluminium cans and light steel' },
  { id: 'RKO-2521', customer: 'Kelechi N.', initials: 'KN', material: 'Plastic', weight: 42, distance: 1.4, area: 'Allen Avenue, Ikeja', address: '44 Allen Avenue, Ikeja', window: 'Today · 2:00–4:00 PM', fee: 1700, posted: '7 min ago', x: 37, y: 57, status: 'Available', items: 'Clean PET bottles in bags' },
  { id: 'RKO-2514', customer: 'Tolu & Co.', initials: 'TC', material: 'E-waste', weight: 16, distance: 2.2, area: 'Maryland, Lagos', address: '8 Ikorodu Road, Maryland', window: 'Today · 3:00–5:00 PM', fee: 2100, posted: '12 min ago', x: 73, y: 66, status: 'Available', items: 'Cables, keyboards and two monitors' },
  { id: 'RKO-2508', customer: 'Amaka E.', initials: 'AE', material: 'Paper', weight: 35, distance: 3.6, area: 'Alausa, Ikeja', address: '12 Secretariat Road, Alausa', window: 'Tomorrow · 9:00–11:00 AM', fee: 1350, posted: '19 min ago', x: 78, y: 25, status: 'Available', items: 'Office paper and flattened cartons' },
  { id: 'RKO-2499', customer: 'Green Basket', initials: 'GB', material: 'Mixed', weight: 55, distance: 5.1, area: 'Yaba, Lagos', address: '31 Herbert Macaulay Way, Yaba', window: 'Tomorrow · 11:00 AM–1:00 PM', fee: 2450, posted: '26 min ago', x: 22, y: 73, status: 'Available', items: 'Sorted plastic, cans and cardboard' },
  { id: 'RKO-2487', customer: 'Seyi O.', initials: 'SO', material: 'Metal', weight: 24, distance: 0.6, area: 'Ikeja GRA', address: '5 Joel Ogunnaike Street, Ikeja', window: 'Today · 10:00 AM', fee: 1400, posted: 'Accepted 18 min ago', x: 49, y: 45, status: 'En route', items: 'Aluminium frames and cans' },
];

export const formatNaira = (value, digits = 0) => `₦${Number(value).toLocaleString('en-NG', {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
})}`;
