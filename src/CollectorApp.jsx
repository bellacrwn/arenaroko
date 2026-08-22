import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  Banknote,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Coins,
  Crosshair,
  Eye,
  FileCheck2,
  Gauge,
  Headphones,
  Home,
  Leaf,
  LocateFixed,
  LogOut,
  Map,
  MapPin,
  Menu,
  Navigation,
  PackageCheck,
  Phone,
  Plus,
  ReceiptText,
  Recycle,
  Route,
  Search,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  Truck,
  UserRoundCheck,
  WalletCards,
  Weight,
  X,
  Zap,
} from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { collectorOrders, formatNaira, materials } from './data';
import LogoutDialog from './LogoutDialog';

const completedSeeds = [
  { id: 'RKO-2472', customer: 'Bisi M.', initials: 'BM', material: 'Plastic', weight: 31, actualWeight: 30.5, distance: 1.8, area: 'Ikeja', address: '15 Toyin Street, Ikeja', window: 'Completed · 11:42 AM', fee: 1550, status: 'Paid', customerPayout: 3965, completedAt: 'Today, 11:42 AM', items: 'Clean PET bottles' },
  { id: 'RKO-2459', customer: 'Studio North', initials: 'SN', material: 'Paper', weight: 48, actualWeight: 47, distance: 2.6, area: 'Maryland', address: '6 Mobolaji Bank Anthony Way', window: 'Completed · Yesterday', fee: 1850, status: 'Paid', customerPayout: 4700, completedAt: 'Yesterday, 4:18 PM', items: 'Cardboard and office paper' },
  { id: 'RKO-2441', customer: 'Tunde K.', initials: 'TK', material: 'Metal', weight: 22, actualWeight: 23.2, distance: 1.1, area: 'Opebi', address: '28 Opebi Road, Ikeja', window: 'Completed · 18 Aug', fee: 1420, status: 'Paid', customerPayout: 4872, completedAt: '18 Aug, 2:06 PM', items: 'Aluminium cans' },
];

function CollectorLogo({ light = false }) {
  return <span className="brand"><img src={light ? '/branding/reko-wordmark-light.svg' : '/branding/reko-wordmark.svg'} alt="REKO" /></span>;
}

function MaterialIcon({ name }) {
  const material = materials.find((item) => item.name === name);
  const Icon = material?.icon || Recycle;
  return <Icon />;
}

function CollectorPill({ children, light = false }) {
  return <span className={`collector-eyebrow ${light ? 'light' : ''}`}><Zap />{children}</span>;
}

const collectorNav = [
  { label: 'Overview', to: '/collector', icon: Home, end: true },
  { label: 'Nearby orders', to: '/collector/orders', icon: MapPin },
  { label: 'Active pickups', to: '/collector/active', icon: Truck },
  { label: 'Earnings', to: '/collector/earnings', icon: WalletCards },
];

export function CollectorShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [jobs, setJobs] = useState([...collectorOrders, ...completedSeeds]);
  const [online, setOnline] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [payoutJob, setPayoutJob] = useState(null);
  const pageTitle = collectorNav.find((item) => item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))?.label || 'Collector workspace';

  const acceptJob = (id) => {
    setJobs((current) => current.map((job) => job.id === id ? { ...job, status: 'Accepted', acceptedAt: 'Just now' } : job));
    setToast('Order accepted and added to your pickup queue.');
  };
  const updateJob = (id, changes, message) => {
    setJobs((current) => current.map((job) => job.id === id ? { ...job, ...changes } : job));
    if (message) setToast(message);
  };
  const approvePayout = (id, details) => {
    setJobs((current) => current.map((job) => job.id === id ? { ...job, ...details, status: 'Paid', completedAt: 'Just now' } : job));
    setPayoutJob(null);
    setToast(`${formatNaira(details.customerPayout)} payout approved. Pickup completed.`);
  };

  const activeCount = jobs.filter((job) => ['Accepted', 'En route', 'Arrived'].includes(job.status)).length;
  const availableCount = jobs.filter((job) => job.status === 'Available').length;

  return <div className="collector-shell">
    <aside className={`collector-sidebar ${mobileOpen ? 'open' : ''}`}>
      <div className="collector-sidebar-brand"><Link to="/collector"><CollectorLogo light /></Link><button onClick={() => setMobileOpen(false)}><X /></button></div>
      <div className="online-control"><span><i className={online ? 'on' : ''} /><div><b>{online ? 'You’re online' : 'You’re offline'}</b><small>{online ? 'Receiving nearby orders' : 'Orders are paused'}</small></div></span><button className={online ? 'on' : ''} onClick={() => setOnline(!online)}><i /></button></div>
      <nav>{collectorNav.map(({ label, to, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)}><Icon /><span>{label}</span>{label === 'Nearby orders' && availableCount > 0 && <em>{availableCount}</em>}{label === 'Active pickups' && activeCount > 0 && <em>{activeCount}</em>}</NavLink>)}</nav>
      <section className="service-zone-card"><div><Crosshair /><span><small>YOUR SERVICE ZONE</small><b>Ikeja · 8 km radius</b></span></div><div className="zone-map-mini"><i /><i /><span /></div><Link to="/collector/orders">Adjust service area <ArrowRight /></Link></section>
      <div className="collector-sidebar-bottom"><NavLink to="/collector/help"><CircleHelp /><span>Help & safety</span></NavLink><button className="collector-sidebar-logout" onClick={() => setLogoutOpen(true)}><LogOut /><span>Sign out</span></button><div className="collector-profile"><span>MA</span><div><b>Musa Adebayo</b><small><Star /> 4.9 · Verified collector</small></div><ChevronRight /></div></div>
    </aside>

    <div className="collector-main">
      <header className="collector-topbar"><button className="collector-mobile-menu" onClick={() => setMobileOpen(true)}><Menu /></button><div><span>Collector workspace</span><b>{pageTitle}</b></div><label><Search /><input placeholder="Search orders…" /></label><button className="collector-locate" onClick={() => setToast('Location refreshed — accuracy 8 metres.')}><LocateFixed /> Ikeja, Lagos</button><button className="collector-alert" onClick={() => setToast('No new alerts. You’re all caught up.')}><Bell /><i /></button><div className="collector-profile-menu"><button className="collector-top-avatar" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen} aria-label="Open collector account menu">MA</button>{profileOpen && <div className="collector-account-dropdown"><header><span>MA</span><div><b>Musa Adebayo</b><small>Verified collector</small></div></header><NavLink to="/collector/help" onClick={() => setProfileOpen(false)}><CircleHelp /> Help & safety</NavLink><button onClick={() => { setProfileOpen(false); setLogoutOpen(true); }}><LogOut /> Sign out</button></div>}</div><button className="collector-mobile-logout" onClick={() => setLogoutOpen(true)} aria-label="Sign out"><LogOut /></button></header>
      {!online && <div className="offline-banner"><span><Bell /></span><div><b>You’re currently offline</b><small>Go online to receive orders near your current location.</small></div><button onClick={() => setOnline(true)}>Go online</button></div>}
      <Outlet context={{ jobs, online, acceptJob, updateJob, openPayout: setPayoutJob, notify: setToast }} />
    </div>

    <nav className="collector-mobile-nav">{collectorNav.map(({ label, to, icon: Icon, end }) => <NavLink key={to} to={to} end={end}><Icon /><span>{label}</span></NavLink>)}</nav>
    <PayoutApprovalModal job={payoutJob} onClose={() => setPayoutJob(null)} onApprove={approvePayout} />
    <LogoutDialog open={logoutOpen} role="Collector" onCancel={() => setLogoutOpen(false)} onConfirm={() => navigate('/login?role=collector', { replace: true })} />
    {toast && <div className="collector-toast" role="status"><span><Check /></span><p>{toast}</p><button onClick={() => setToast('')}><X /></button></div>}
  </div>;
}

function CollectorStat({ icon: Icon, label, value, note, tone }) {
  return <article className="collector-stat"><span className={tone}><Icon /></span><div><small>{label}</small><strong>{value}</strong><p>{note}</p></div></article>;
}

export function CollectorDashboard() {
  const { jobs, online, acceptJob, updateJob, openPayout, notify } = useOutletContext();
  const available = jobs.filter((job) => job.status === 'Available').sort((a, b) => a.distance - b.distance);
  const active = jobs.find((job) => ['Accepted', 'En route', 'Arrived'].includes(job.status));
  const todayPaid = jobs.filter((job) => job.status === 'Paid' && (job.completedAt?.includes('Today') || job.completedAt === 'Just now'));
  const todayEarnings = todayPaid.reduce((sum, job) => sum + job.fee, 0);
  const todayKg = todayPaid.reduce((sum, job) => sum + Number(job.actualWeight || job.weight), 0);

  return <main className="collector-page">
    <div className="collector-heading"><div><CollectorPill>Friday, 21 August</CollectorPill><h1>Ready to collect, Musa?</h1><p>{online ? `${available.length} orders are waiting inside your service area.` : 'Go online when you’re ready to receive orders.'}</p></div><Link className="collector-primary-button" to="/collector/orders"><MapPin /> Find nearby orders <ArrowRight /></Link></div>

    <section className="collector-stats"><CollectorStat icon={Coins} label="Today’s earnings" value={formatNaira(todayEarnings)} note="+18% from yesterday" tone="mint" /><CollectorStat icon={MapPin} label="Orders nearby" value={String(available.length).padStart(2, '0')} note="Closest is 0.8 km away" tone="pine" /><CollectorStat icon={Weight} label="Collected today" value={`${todayKg.toFixed(1)} kg`} note="2 completed pickups" tone="kraft" /><CollectorStat icon={Star} label="Your rating" value="4.9" note="From 328 pickups" tone="gold" /></section>

    <div className="collector-dashboard-grid">
      <section className="collector-panel collector-order-map"><header><div><h2>Orders around you</h2><p>Live requests sorted by travel distance.</p></div><Link to="/collector/orders">Open map <ArrowRight /></Link></header><div className="collector-map-canvas"><div className="collector-map-roads" /><span className="collector-you"><Navigation /></span>{available.slice(0, 5).map((job, index) => <i key={job.id} style={{ left: `${job.x}%`, top: `${job.y}%` }}><b>{index + 1}</b></i>)}<article><Crosshair /><div><b>Location is accurate</b><small>Last updated just now</small></div></article></div><div className="map-order-list">{available.slice(0, 3).map((job, index) => <OrderListRow key={job.id} job={job} index={index + 1} onAccept={acceptJob} />)}</div></section>

      <aside className="collector-dashboard-side">
        <section className="collector-panel current-route-card"><header><div><span className="collector-live"><i /> Current pickup</span><h2>{active ? active.customer : 'No active pickup'}</h2></div>{active && <span className="route-eta">{active.distance} km</span>}</header>{active ? <><div className="route-customer"><span>{active.initials}</span><div><b>{active.address}</b><small><Clock3 /> {active.window}</small></div><button onClick={() => notify(`Calling ${active.customer}…`)}><Phone /></button></div><div className="route-line"><span className="done"><i><Check /></i><b>Accepted</b></span><span className={active.status !== 'Accepted' ? 'done' : 'current'}><i><Truck /></i><b>On route</b></span><span className={active.status === 'Arrived' ? 'current' : ''}><i><MapPin /></i><b>Arrived</b></span><span><i><ReceiptText /></i><b>Pay</b></span></div><div className="route-material"><span><MaterialIcon name={active.material} /></span><div><small>EXPECTED LOAD</small><b>{active.material} · ~{active.weight} kg</b><p>{active.items}</p></div></div><JobAction job={active} updateJob={updateJob} openPayout={openPayout} /></> : <div className="no-route"><span><Route /></span><h3>Your route is clear</h3><p>Accept a nearby order to start collecting.</p><Link to="/collector/orders">Browse orders</Link></div>}</section>
        <section className="collector-wallet-card"><div><span><WalletCards /> Collector wallet</span><Eye /></div><strong>{formatNaira(18740)}</strong><small>Available to withdraw</small><footer><span><TrendingUp /> {formatNaira(todayEarnings)} today</span><Link to="/collector/earnings">View earnings <ArrowRight /></Link></footer></section>
      </aside>
    </div>

    <section className="collector-panel nearby-preview"><header><div><h2>Nearest available orders</h2><p>Accept requests that fit your route and capacity.</p></div><div><span><i /> Live</span><Link to="/collector/orders">View all <ArrowRight /></Link></div></header><div className="nearby-order-grid">{available.slice(0, 3).map((job) => <NearbyOrderCard key={job.id} job={job} onAccept={acceptJob} compact />)}</div></section>
  </main>;
}

function OrderListRow({ job, index, onAccept }) {
  return <article className="order-list-row"><span>{index}</span><div><b>{job.material} · ~{job.weight} kg</b><small>{job.area} · {job.distance} km away</small></div><strong>{formatNaira(job.fee)}<small> fee</small></strong><button onClick={() => onAccept(job.id)}>Accept</button></article>;
}

function NearbyOrderCard({ job, onAccept, compact = false }) {
  const material = materials.find((item) => item.name === job.material);
  return <article className={`nearby-order-card ${compact ? 'compact' : ''}`}><div className="order-card-top"><span className="order-material-icon" style={{ '--order-color': material?.color }}><MaterialIcon name={job.material} /></span><div><span className="new-order-dot"><i /> {job.posted}</span><b>{job.material} pickup</b></div><em><MapPin /> {job.distance} km</em></div><div className="order-customer"><span>{job.initials}</span><div><b>{job.customer}</b><small>{job.area}</small></div><span><Star /> 4.8</span></div><dl><div><dt>Estimated load</dt><dd>~{job.weight} kg</dd></div><div><dt>Pickup window</dt><dd>{job.window.replace('Today · ', '')}</dd></div><div><dt>Collector fee</dt><dd className="fee">{formatNaira(job.fee)}</dd></div></dl>{!compact && <p><PackageCheck /> {job.items}</p>}<div className="order-card-actions"><button className="order-details-button">View details</button><button className="accept-order-button" onClick={() => onAccept(job.id)}>Accept order <ArrowRight /></button></div></article>;
}

function JobAction({ job, updateJob, openPayout }) {
  if (job.status === 'Accepted') return <button className="route-action-button" onClick={() => updateJob(job.id, { status: 'En route' }, 'Trip started. The customer can now track your arrival.')}><Navigation /> Start trip <ArrowRight /></button>;
  if (job.status === 'En route') return <button className="route-action-button" onClick={() => updateJob(job.id, { status: 'Arrived' }, 'Arrival confirmed. You can now inspect and weigh the materials.')}><MapPin /> Mark as arrived <ArrowRight /></button>;
  if (job.status === 'Arrived') return <button className="route-action-button payout" onClick={() => openPayout(job)}><Weight /> Weigh & approve payout <ArrowRight /></button>;
  return null;
}

export function NearbyOrdersPage() {
  const { jobs, online, acceptJob, notify } = useOutletContext();
  const [radius, setRadius] = useState(8);
  const [materialFilter, setMaterialFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(null);
  const available = useMemo(() => jobs.filter((job) => job.status === 'Available' && job.distance <= radius && (materialFilter === 'All' || job.material === materialFilter)).sort((a, b) => a.distance - b.distance), [jobs, radius, materialFilter]);
  const selected = available.find((job) => job.id === selectedId) || available[0];

  return <main className="collector-page"><div className="collector-heading"><div><CollectorPill>Location-aware matching</CollectorPill><h1>Nearby orders</h1><p>Requests are sorted from closest to farthest from your live location.</p></div><button className="collector-location-button" onClick={() => notify('Location refreshed — showing orders near Ikeja.')}><Crosshair /> Refresh location</button></div><div className="order-filter-bar"><label><Search /><input placeholder="Search area or request ID" /></label><label><span>Radius</span><select value={radius} onChange={(event) => setRadius(Number(event.target.value))}><option value="2">Within 2 km</option><option value="5">Within 5 km</option><option value="8">Within 8 km</option><option value="15">Within 15 km</option></select><ChevronDown /></label><label><span>Material</span><select value={materialFilter} onChange={(event) => setMaterialFilter(event.target.value)}><option>All</option>{materials.map((item) => <option key={item.id}>{item.name}</option>)}</select><ChevronDown /></label><div><i className={online ? 'on' : ''} /><span><b>{available.length} orders found</b><small>Sorted by distance</small></span></div></div>
    <div className="orders-explorer"><section className="orders-list"><div className="orders-list-title"><span>Nearest first</span><button>Recommended <ChevronDown /></button></div>{available.length ? available.map((job) => <div key={job.id} onMouseEnter={() => setSelectedId(job.id)}><NearbyOrderCard job={job} onAccept={acceptJob} /></div>) : <div className="collector-empty"><MapPin /><h3>No orders in this range</h3><p>Increase your service radius or try another material.</p></div>}</section><section className="orders-map"><div className="collector-map-roads" /><span className="collector-you large"><Navigation /><b>You are here</b></span>{available.map((job, index) => <button className={selected?.id === job.id ? 'selected' : ''} onClick={() => setSelectedId(job.id)} key={job.id} style={{ left: `${job.x}%`, top: `${job.y}%` }}><MapPin /><span>{index + 1}</span></button>)}<div className="map-radius-ring" /><article className="selected-map-order"><span style={{ '--order-color': materials.find((item) => item.name === selected?.material)?.color }}><MaterialIcon name={selected?.material} /></span><div><small>CLOSEST MATCH</small><b>{selected?.material || 'No'} pickup · {selected?.distance || 0} km</b><p>{selected?.area}</p></div>{selected && <button onClick={() => acceptJob(selected.id)}>Accept · {formatNaira(selected.fee)}</button>}</article></section></div>
  </main>;
}

export function ActivePickupsPage() {
  const { jobs, updateJob, openPayout } = useOutletContext();
  const active = jobs.filter((job) => ['Accepted', 'En route', 'Arrived'].includes(job.status));
  const completed = jobs.filter((job) => job.status === 'Paid').slice(0, 4);
  return <main className="collector-page"><div className="collector-heading"><div><CollectorPill>Pickup workflow</CollectorPill><h1>Active pickups</h1><p>Move each order from accepted to weighed and paid.</p></div><Link className="collector-primary-button" to="/collector/orders"><Plus /> Add another order</Link></div>{active.length ? <section className="active-job-grid">{active.map((job) => <article className="collector-panel active-job-card" key={job.id}><header><div><span className={`job-status job-status-${job.status.toLowerCase().replace(' ', '-')}`}><i /> {job.status}</span><code>{job.id}</code></div><strong>{formatNaira(job.fee)}<small> collector fee</small></strong></header><div className="active-job-customer"><span>{job.initials}</span><div><b>{job.customer}</b><small><MapPin /> {job.address}</small></div><button><Phone /></button><button><Navigation /></button></div><div className="active-job-material"><span><MaterialIcon name={job.material} /></span><div><small>MATERIAL</small><b>{job.material} · ~{job.weight} kg</b><p>{job.items}</p></div><span><Clock3 /> {job.window}</span></div><div className="active-job-steps"><span className="done"><Check /> Accepted</span><i className={job.status !== 'Accepted' ? 'done' : ''} /><span className={job.status !== 'Accepted' ? 'done' : ''}><Truck /> On route</span><i className={job.status === 'Arrived' ? 'done' : ''} /><span className={job.status === 'Arrived' ? 'current' : ''}><MapPin /> Arrived</span><i /><span><ReceiptText /> Paid</span></div><JobAction job={job} updateJob={updateJob} openPayout={openPayout} /></article>)}</section> : <section className="collector-panel collector-empty large"><Route /><h2>No active pickups</h2><p>Accept a nearby order and it will appear here.</p><Link to="/collector/orders">Find orders <ArrowRight /></Link></section>}<section className="collector-panel completed-pickups"><header><div><h2>Recently completed</h2><p>Payouts approved and customer payments released.</p></div><Link to="/collector/earnings">View earnings <ArrowRight /></Link></header><div>{completed.map((job) => <article key={job.id}><span><Check /></span><div><b>{job.material} pickup for {job.customer}</b><small><code>{job.id}</code> · {job.actualWeight || job.weight} kg · {job.completedAt}</small></div><span><small>Customer payout</small><b>{formatNaira(job.customerPayout)}</b></span><strong>+{formatNaira(job.fee)}</strong></article>)}</div></section></main>;
}

export function CollectorEarningsPage() {
  const { jobs, notify } = useOutletContext();
  const completed = jobs.filter((job) => job.status === 'Paid');
  const totalFees = completed.reduce((sum, job) => sum + job.fee, 0);
  return <main className="collector-page"><div className="collector-heading"><div><CollectorPill>Collector finances</CollectorPill><h1>Earnings</h1><p>Track service fees from every completed pickup.</p></div><button className="collector-location-button"><ReceiptText /> Download statement</button></div><div className="collector-earnings-top"><section className="collector-balance-card"><div><CollectorLogo light /><Eye /></div><small>AVAILABLE TO WITHDRAW</small><strong>{formatNaira(18740, 2)}</strong><p><TrendingUp /> +{formatNaira(totalFees)} from completed pickups</p><button onClick={() => notify('Collector withdrawal flow opened.')}>Withdraw earnings <ArrowUpRight /></button><footer><ShieldCheck /> Secured payout wallet <b>•••• 4072</b></footer></section><section className="collector-panel collector-earnings-chart"><header><div><h2>Weekly earnings</h2><p>Service fees for the last seven days.</p></div><span><TrendingUp /> 18.4%</span></header><div className="earnings-summary"><div><small>This week</small><b>{formatNaira(12820)}</b></div><div><small>Completed pickups</small><b>14</b></div><div><small>Average per pickup</small><b>{formatNaira(916)}</b></div></div><div className="collector-bars">{[{d:'Mon',v:40},{d:'Tue',v:63},{d:'Wed',v:52},{d:'Thu',v:82},{d:'Fri',v:96},{d:'Sat',v:70},{d:'Sun',v:30}].map((bar) => <div key={bar.d}><span><i style={{height:`${bar.v}%`}} /></span><small>{bar.d}</small></div>)}</div></section></div><section className="collector-panel collector-transaction-list"><header><div><h2>Completed pickup earnings</h2><p>Each fee is released after you approve the customer payout.</p></div><button>All activity <ChevronDown /></button></header><div>{completed.map((job) => <article key={job.id}><span className="earning-icon"><ArrowDownLeft /></span><div><b>Pickup fee · {job.material}</b><small>{job.customer} · <code>{job.id}</code> · {job.completedAt}</small></div><span><small>Customer received</small><b>{formatNaira(job.customerPayout)}</b></span><strong>+{formatNaira(job.fee)}</strong><button><ChevronRight /></button></article>)}</div></section></main>;
}

function PayoutApprovalModal({ job, onClose, onApprove }) {
  const [actualWeight, setActualWeight] = useState(job?.weight || 0);
  const [quality, setQuality] = useState('Clean & sorted');
  const [confirmed, setConfirmed] = useState(false);
  React.useEffect(() => { if (job) { setActualWeight(job.weight); setQuality('Clean & sorted'); setConfirmed(false); } }, [job]);
  if (!job) return null;
  const material = materials.find((item) => item.name === job.material);
  const factor = quality === 'Clean & sorted' ? 1 : quality === 'Mixed quality' ? .9 : .75;
  const customerPayout = Math.round(Number(actualWeight || 0) * (material?.rate || 0) * factor);
  const approve = () => onApprove(job.id, { actualWeight: Number(actualWeight), quality, customerPayout, payoutApprovedAt: new Date().toISOString() });

  return <div className="collector-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="payout-modal" role="dialog" aria-modal="true" aria-label="Approve customer payout"><header><div><span><ReceiptText /></span><div><b>Finish pickup & approve payout</b><small>{job.id} · {job.customer}</small></div></div><button onClick={onClose}><X /></button></header><div className="payout-progress"><span className="done"><Check /> Arrived</span><i /><span className="active"><Weight /> Verify weight</span><i /><span><Banknote /> Approve money</span></div><div className="payout-modal-body"><CollectorPill>Final verification</CollectorPill><h2>Confirm what you collected.</h2><p>Enter the measured weight with the customer present. REKO calculates their final payout automatically.</p><div className="weighbridge-card"><div><span className="payout-material-icon" style={{ '--order-color': material?.color }}><MaterialIcon name={job.material} /></span><div><small>MATERIAL</small><b>{job.material}</b><p>{job.items}</p></div><span><small>Estimated</small><b>{job.weight} kg</b></span></div><label><span>Verified weight</span><div><Weight /><input type="number" min="0.1" step="0.1" value={actualWeight} onChange={(event) => setActualWeight(event.target.value)} autoFocus /><b>kg</b></div></label><label><span>Material quality</span><div><PackageCheck /><select value={quality} onChange={(event) => setQuality(event.target.value)}><option>Clean & sorted</option><option>Mixed quality</option><option>Needs sorting</option></select><ChevronDown /></div></label></div><div className="payout-calculation"><header><span><Coins /></span><div><small>CUSTOMER WILL RECEIVE</small><strong>{formatNaira(customerPayout, 2)}</strong><p>{actualWeight} kg × {formatNaira(material?.rate || 0)}/kg {factor < 1 ? `× ${Math.round(factor * 100)}% quality` : ''}</p></div><span className="secure-calc"><ShieldCheck /> Secure</span></header><dl><div><dt>Material value</dt><dd>{formatNaira(Number(actualWeight || 0) * (material?.rate || 0))}</dd></div>{factor < 1 && <div><dt>Quality adjustment</dt><dd>−{formatNaira(Number(actualWeight || 0) * (material?.rate || 0) * (1 - factor))}</dd></div>}<div><dt>Your collector fee</dt><dd className="collector-fee">+{formatNaira(job.fee)}</dd></div></dl></div><label className="payout-confirm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span><b>The customer has seen and agreed to the weight.</b><small>Approving releases their money and completes this pickup.</small></span></label></div><footer><button className="payout-cancel" onClick={onClose}>Cancel</button><button className="approve-payout-button" disabled={!confirmed || Number(actualWeight) <= 0} onClick={approve}><ShieldCheck /> Approve {formatNaira(customerPayout)} payout <ArrowRight /></button></footer></section></div>;
}
