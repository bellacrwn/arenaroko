import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  Banknote,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Coins,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileText,
  Headphones,
  Home,
  Leaf,
  LocateFixed,
  LockKeyhole,
  LogOut,
  Mail,
  Map,
  MapPin,
  Menu,
  MessageCircle,
  Minus,
  Navigation,
  PackageCheck,
  Phone,
  Plus,
  Recycle,
  Route,
  Search,
  Send,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Trash2,
  Truck,
  Upload,
  User,
  WalletCards,
  Weight,
  X,
  Zap,
} from 'lucide-react';
import {
  formatNaira,
  materials,
  requests as requestData,
  stations,
  transactions,
} from './data';
import {
  ActivePickupsPage,
  CollectorDashboard,
  CollectorEarningsPage,
  CollectorShell,
  NearbyOrdersPage,
} from './CollectorApp';
import LogoutDialog from './LogoutDialog';
import { apiRequest, saveSession } from './api';
import { Signup, WelcomeTour } from './Signup';
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route as RouterRoute,
  Routes,
  useLocation,
  useNavigate,
  useOutletContext,
} from 'react-router-dom';

function Logo({ light = false, className = '' }) {
  return (
    <span className={`brand ${className}`}>
      <img src={light ? '/branding/reko-wordmark-light.svg' : '/branding/reko-wordmark.svg'} alt="REKO" />
    </span>
  );
}

function Pill({ children, light = false }) {
  return <span className={`eyebrow ${light ? 'eyebrow--light' : ''}`}><Sparkles />{children}</span>;
}

function MaterialGlyph({ material }) {
  const Icon = material?.icon || Recycle;
  return <Icon />;
}

function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [materialId, setMaterialId] = useState('metal');
  const [weight, setWeight] = useState(20);
  const material = materials.find((item) => item.id === materialId);
  const estimate = Math.max(0, Number(weight || 0)) * material.rate;

  return (
    <main className="marketing">
      <section className="marketing-hero">
        <header className="marketing-nav container">
          <Link to="/" aria-label="REKO home"><Logo light /></Link>
          <span className="powered-mark"><ShieldCheck /> Powered by Wema ALAT</span>
          <nav className={menuOpen ? 'open' : ''} aria-label="Main navigation">
            <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#rates" onClick={() => setMenuOpen(false)}>Live rates</a>
            <a href="#impact" onClick={() => setMenuOpen(false)}>Our impact</a>
            <a href="#collectors" onClick={() => setMenuOpen(false)}>For collectors</a>
          </nav>
          <Link className="btn btn--glass nav-signin" to="/login">Sign in</Link>
          <Link className="btn btn--mint nav-start" to="/login">Start recycling <ArrowRight /></Link>
          <button className="nav-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X /> : <Menu />}
          </button>
        </header>

        <div className="hero-backdrop" aria-hidden="true" />
        <div className="hero-grid container">
          <div className="hero-content">
            <Pill light>Recycling, finally rewarding</Pill>
            <h1>Turn what you discard into <em>what matters.</em></h1>
            <p>REKO picks up your recyclables, pays you fairly, and shows the difference every kilogram makes.</p>
            <div className="hero-buttons">
              <Link className="btn btn--mint btn--xl" to="/login">Book a free pickup <ArrowRight /></Link>
              <a className="btn btn--glass btn--xl" href="#how"><span className="play-dot"><ArrowRight /></span> See how it works</a>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack"><span>AO</span><span>TM</span><span>KI</span><span>+2k</span></div>
              <div><span><Star /><Star /><Star /><Star /><Star /></span><small>Loved by recyclers across Lagos</small></div>
            </div>
          </div>

          <div className="hero-side" aria-hidden="true">
            <article className="hero-payment-card">
              <span className="payment-icon"><Coins /></span>
              <div><small>Pickup paid</small><strong>+₦5,250</strong></div>
              <span className="verified-dot"><Check /></span>
            </article>
            <article className="hero-impact-card">
              <div className="mini-ring"><span>92%</span></div>
              <div><b>Monthly goal</b><small>184 of 200 kg recycled</small></div>
            </article>
          </div>
        </div>

        <div className="hero-estimator-wrap container">
          <section className="hero-estimator">
            <div className="estimator-intro"><span><Zap /></span><div><b>See what it’s worth</b><small>Get an instant market estimate</small></div></div>
            <label><span>Material</span><div className="select-shell"><Recycle />
              <select value={materialId} onChange={(event) => setMaterialId(event.target.value)}>
                {materials.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select><ChevronDown /></div>
            </label>
            <label><span>Estimated weight</span><div className="input-unit"><Weight /><input type="number" min="1" value={weight} onChange={(event) => setWeight(event.target.value)} /><b>kg</b></div></label>
            <div className="estimate-result"><span>Estimated payout</span><strong>{formatNaira(estimate)}</strong><small>at {formatNaira(material.rate)}/kg</small></div>
            <Link className="btn btn--pine" to="/login">Book pickup <ArrowRight /></Link>
          </section>
        </div>
      </section>

      <section className="trust-strip">
        <div className="container"><p>Built with communities. Trusted by organisations.</p><div><b>WEMA BANK</b><b>ALAT</b><b>LAGOS RECYCLES</b><b>GREENPOINT</b><b>CIRCULAR LAGOS</b></div></div>
      </section>

      <section className="section process-section" id="how">
        <div className="container">
          <div className="section-heading split-heading">
            <div><Pill>One simple loop</Pill><h2>From clutter to credit, without the guesswork.</h2></div>
            <p>No haggling. No wondering where your waste goes. Just a clear, trackable experience from your doorstep to your wallet.</p>
          </div>
          <div className="process-grid">
            <article><span className="process-number">01</span><div className="process-icon"><PackageCheck /></div><h3>Tell us what you have</h3><p>Choose your material, add an estimate, and pick a time that works.</p><span className="process-line" /></article>
            <article><span className="process-number">02</span><div className="process-icon"><Truck /></div><h3>We come to you</h3><p>A verified REKO collector arrives, weighs, and confirms your items.</p><span className="process-line" /></article>
            <article><span className="process-number">03</span><div className="process-icon"><WalletCards /></div><h3>Get paid, see impact</h3><p>Your wallet is credited and every kilogram is added to your impact record.</p></article>
          </div>
        </div>
      </section>

      <section className="section showcase-section" id="impact">
        <div className="container showcase-grid">
          <div className="showcase-copy">
            <Pill>Impact you can see</Pill>
            <h2>Your waste has a story after it leaves your hands.</h2>
            <p>REKO turns every pickup into a clear record of value created and emissions avoided—so doing good never feels abstract.</p>
            <ul>
              <li><span><Check /></span><div><b>Track every kilogram</b><small>See a verified history of what you’ve diverted.</small></div></li>
              <li><span><Check /></span><div><b>Understand your footprint</b><small>Translate recycling into simple CO₂ and community impact.</small></div></li>
              <li><span><Check /></span><div><b>Build better habits</b><small>Monthly goals and milestones keep the momentum going.</small></div></li>
            </ul>
            <Link to="/login" className="text-link">Explore your impact dashboard <ArrowRight /></Link>
          </div>
          <div className="impact-preview">
            <div className="preview-top"><div><small>YOUR REKO IMPACT</small><b>August overview</b></div><span><Leaf /> Live</span></div>
            <div className="impact-score-row">
              <div className="impact-ring"><div><strong>184</strong><small>kg recycled</small></div></div>
              <div className="impact-equivalents"><article><span><Leaf /></span><div><small>CO₂ avoided</small><b>92 kg</b></div></article><article><span><Zap /></span><div><small>Energy saved</small><b>368 kWh</b></div></article><article><span><Award /></span><div><small>Community rank</small><b>Top 8%</b></div></article></div>
            </div>
            <div className="impact-chart"><div className="chart-label"><b>Monthly recycling</b><span>+24% <TrendingUp /></span></div><div className="bars">{[35, 52, 43, 68, 58, 84, 72, 96, 64, 82, 100, 88].map((height, index) => <i style={{ height: `${height}%` }} key={index} />)}</div><div className="chart-months"><span>Sep</span><span>Dec</span><span>Mar</span><span>Jun</span><span>Aug</span></div></div>
            <article className="milestone-toast"><span><Award /></span><div><b>New milestone unlocked</b><small>150 kg kept in circulation</small></div><ArrowRight /></article>
          </div>
        </div>
      </section>

      <section className="section rates-section" id="rates">
        <div className="container">
          <div className="section-heading centered-heading"><Pill>Fair by design</Pill><h2>Know the rate before the pickup.</h2><p>Indicative prices update with the market. Final value is confirmed openly after weighing.</p></div>
          <div className="public-rate-grid">
            {materials.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return <article key={item.id}><div className="rate-card-top"><span style={{ '--material-color': item.color }}><Icon /></span><em className={item.trend < 0 ? 'down' : ''}>{item.trend < 0 ? <TrendingDown /> : <TrendingUp />}{Math.abs(item.trend)}%</em></div><h3>{item.name}</h3><p>{item.examples}</p><div><strong>{formatNaira(item.rate)}</strong><small>per kg</small></div></article>;
            })}
          </div>
          <div className="rate-assurance"><span><ShieldCheck /></span><div><b>No hidden deductions. No awkward bargaining.</b><p>You approve the confirmed weight and payout before the transaction is completed.</p></div><Link to="/login" className="btn btn--soft">View all rates <ArrowRight /></Link></div>
        </div>
      </section>

      <section className="section collector-section" id="collectors">
        <div className="container collector-banner">
          <div className="collector-visual"><img src="/reko-side.png" alt="REKO mark on recycled concrete" /><span><Truck /><b>427 pickups</b><small>completed this week</small></span></div>
          <div className="collector-message"><Pill light>For collection partners</Pill><h2>More routes. Less guesswork. Better business.</h2><p>Join a verified network with organised requests, clear materials, and tools designed to help independent collectors grow.</p><div className="collector-benefits"><span><Check /> Requests near you</span><span><Check /> Smarter route planning</span><span><Check /> Reliable records</span></div><Link to="/login?role=collector" className="btn btn--mint btn--xl">Become a REKO collector <ArrowRight /></Link></div>
        </div>
      </section>

      <section className="section stories-section">
        <div className="container">
          <div className="section-heading centered-heading"><Pill>Made for real life</Pill><h2>Small action. Tangible value.</h2></div>
          <div className="story-grid">
            <article className="story-feature"><span className="quote-mark">“</span><p>Our office used to store recyclables for weeks. Now we book on Friday, see the weight, and the money goes straight into our community fund.</p><div><span className="story-avatar">AO</span><div><b>Amara Okafor</b><small>Operations lead, Ikeja</small></div><span className="stars"><Star /><Star /><Star /><Star /><Star /></span></div></article>
            <div className="story-stats"><article><strong>4.9<span>/5</span></strong><p>Average pickup rating</p><div className="stars"><Star /><Star /><Star /><Star /><Star /></div></article><article><strong>96<span>%</span></strong><p>Pickups completed on time</p><div className="mini-progress"><i /></div></article></div>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="container"><div><Pill light>Your cleaner routine starts here</Pill><h2>There’s value waiting in what you’re throwing away.</h2><p>Book your first pickup in less than two minutes.</p></div><div><Link className="btn btn--mint btn--xl" to="/login">Start recycling free <ArrowRight /></Link><small><ShieldCheck /> Verified collectors · Secure wallet payouts</small></div></div>
      </section>

      <footer className="marketing-footer">
        <div className="container footer-grid"><div><Logo light /><p>Better value for your recyclables. Better outcomes for our communities.</p></div><div><b>Product</b><a href="#how">How it works</a><a href="#rates">Rates</a><Link to="/login">Drop stations</Link></div><div><b>Company</b><a href="#impact">Our impact</a><a href="#collectors">For collectors</a><a href="mailto:hello@reko.ng">Contact</a></div><div><b>Stay in the loop</b><p>Monthly rates and cleaner-living ideas.</p><label><input placeholder="Email address" /><button aria-label="Subscribe"><ArrowRight /></button></label></div></div>
        <div className="footer-bottom container"><span>issotope underdogs project</span><div><a href="#privacy">Privacy</a><a href="#terms">Terms</a><a href="#accessibility">Accessibility</a></div></div>
      </footer>
    </main>
  );
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialCollector = new URLSearchParams(location.search).get('role') === 'collector';
  const [role, setRole] = useState(initialCollector ? 'collector' : 'distributor');
  const [mode, setMode] = useState('email');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (mode !== 'email') {
      setError('Phone login is not available yet. Please use your email address.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      saveSession(result.data);
      navigate(result.data.user.role === 'collector' ? '/collector' : '/app');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <Link className="login-back" to="/"><ArrowLeft /> Back to REKO</Link>
      <section className="login-stage">
        <div className="login-visual">
          <img src="/images/reko-hero.jpg" alt="A REKO recycling professional at a modern recycling hub" />
          <div className="login-overlay"><Logo light /><div><Pill light>Welcome to the loop</Pill><h2>Your cleaner habits should pay you back.</h2><p>Manage pickups, earnings, and impact from one beautifully simple place.</p></div><article><span><ShieldCheck /></span><div><b>Trusted & transparent</b><small>Verified collectors. Confirmed weights. Secure payouts.</small></div></article></div>
        </div>
        <div className="login-form-wrap">
          <div className="login-mobile-brand"><Logo /></div>
          <div className="role-switch"><button className={role === 'distributor' ? 'active' : ''} onClick={() => setRole('distributor')}><Building2 /> Distributor</button><button className={role === 'collector' ? 'active' : ''} onClick={() => setRole('collector')}><Truck /> Collector</button></div>
          <Pill>{role === 'collector' ? 'Collector network' : 'Welcome back'}</Pill>
          <h1>{role === 'collector' ? 'Manage your routes.' : 'Good to see you again.'}</h1>
          <p>{role === 'collector' ? 'Sign in to view requests, routes, and earnings.' : 'Sign in to continue your recycling journey.'}</p>
          <div className="login-tabs"><button className={mode === 'email' ? 'active' : ''} onClick={() => setMode('email')}><Mail /> Email</button><button className={mode === 'phone' ? 'active' : ''} onClick={() => setMode('phone')}><Phone /> Phone</button></div>
          <form onSubmit={handleSubmit}>
            <label><span>{mode === 'email' ? 'Email address' : 'Phone number'}</span><div className="form-control">{mode === 'email' ? <Mail /> : <Phone />}<input required type={mode === 'email' ? 'email' : 'tel'} placeholder={mode === 'email' ? 'you@example.com' : '+234 800 000 0000'} value={email} onChange={(event) => setEmail(event.target.value)} /></div></label>
            <label><span>Password</span><div className="form-control"><LockKeyhole /><input required minLength="8" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
            <div className="login-options"><label className="checkbox"><input type="checkbox" defaultChecked /> Keep me signed in</label><button type="button">Forgot password?</button></div>
            {error && <p role="alert" className="login-error">{error}</p>}
            <button className="btn btn--pine btn--full btn--xl" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign in securely'} <ArrowRight /></button>
          </form>
          <div className="or-divider"><span>or</span></div>
          <button className="google-login"><b>G</b> Continue with Google</button>
          <p className="create-account">New to REKO? <button onClick={() => navigate(role === 'collector' ? '/signup?role=collector' : '/signup')}>Create your free account</button></p>
          <span className="form-security"><ShieldCheck /> Protected with bank-grade encryption</span>
        </div>
      </section>
    </main>
  );
}

const appNav = [
  { label: 'Overview', to: '/app', icon: Home, end: true },
  { label: 'Pickups', to: '/app/pickups', icon: PackageCheck },
  { label: 'Wallet', to: '/app/wallet', icon: WalletCards },
  { label: 'Live rates', to: '/app/rates', icon: TrendingUp },
  { label: 'Drop stations', to: '/app/stations', icon: MapPin },
  { label: 'My impact', to: '/app/impact', icon: Leaf },
];

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [allRequests, setAllRequests] = useState(requestData);
  const pageTitle = appNav.find((item) => item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))?.label || 'Overview';

  const addRequest = (request) => {
    setAllRequests((current) => [request, ...current]);
    setToast('Pickup booked — a collector match is underway.');
  };
  const addToCart = (materialId, weight = 5) => {
    const safeWeight = Math.max(1, Number(weight) || 1);
    setCart((current) => {
      const existing = current.find((item) => item.materialId === materialId);
      return existing
        ? current.map((item) => item.materialId === materialId ? { ...item, weight: item.weight + safeWeight } : item)
        : [...current, { materialId, weight: safeWeight }];
    });
    const item = materials.find((material) => material.id === materialId);
    setToast(`${item?.name || 'Material'} added to your pickup cart.`);
  };
  const updateCartItem = (materialId, weight) => setCart((current) => current.map((item) => item.materialId === materialId ? { ...item, weight: Math.max(1, Number(weight) || 1) } : item));
  const removeCartItem = (materialId) => setCart((current) => current.filter((item) => item.materialId !== materialId));
  const checkoutCart = (address, window) => {
    if (!cart.length) return;
    const stamp = String(Date.now()).slice(-4);
    const newRequests = cart.map((item, index) => {
      const material = materials.find((entry) => entry.id === item.materialId);
      return { id: `RKO-${stamp}${index + 1}`, material: material.name, weight: item.weight, amount: item.weight * material.rate, status: 'Matching collector', date: window, collector: 'Finding match…', eta: null, address, cartBooking: true };
    });
    setAllRequests((current) => [...newRequests, ...current]);
    setCart([]);
    setCartOpen(false);
    setToast(`${newRequests.length} cart item${newRequests.length > 1 ? 's' : ''} scheduled for pickup.`);
  };

  return (
    <div className="product-shell">
      <aside className={`app-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand"><Link to="/app"><Logo light /></Link><button onClick={() => setMobileOpen(false)}><X /></button></div>
        <button className="btn btn--mint sidebar-create" onClick={() => setPickupOpen(true)}><Plus /> New pickup</button>
        <button className="sidebar-cart-button" onClick={() => setCartOpen(true)}><ShoppingBasket /><span>Pickup cart</span>{cart.length > 0 && <em>{cart.length}</em>}</button>
        <nav>{appNav.map(({ label, to, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)}><Icon /><span>{label}</span>{label === 'Pickups' && <em>1</em>}</NavLink>)}</nav>
        <div className="sidebar-bottom">
          <article><div><Leaf /><span>August goal</span><b>184 / 200 kg</b></div><div className="sidebar-progress"><i /></div><small>Just 16 kg to your next badge</small></article>
          <NavLink to="/app/help"><CircleHelp /><span>Help & support</span></NavLink>
          <button className="sidebar-logout" onClick={() => setLogoutOpen(true)}><LogOut /><span>Sign out</span></button>
          <div className="sidebar-user"><span>UA</span><div><b>User Ade</b><small>Distributor account</small></div><ChevronRight /></div>
        </div>
      </aside>

      <div className="product-main">
        <header className="product-topbar">
          <button className="mobile-nav-trigger" onClick={() => setMobileOpen(true)}><Menu /></button>
          <div><span>REKO workspace</span><b>{pageTitle}</b></div>
          <label className="top-search"><Search /><input placeholder="Search requests, rates…" /><kbd>⌘ K</kbd></label>
          <button className="top-cart-button" onClick={() => setCartOpen(true)} aria-label={`Open pickup cart with ${cart.length} items`}><ShoppingBasket />{cart.length > 0 && <span>{cart.length}</span>}</button>
          <button className="top-icon" onClick={() => setToast('You’re all caught up — no new alerts.')}><Bell /><i /></button>
          <div className="profile-menu-wrap">
            <button className="top-profile" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen} aria-label="Open distributor account menu"><span>UA</span><ChevronDown /></button>
            {profileOpen && <div className="account-dropdown"><header><span>UA</span><div><b>User Ade</b><small>Distributor account</small></div></header><NavLink to="/app/help" onClick={() => setProfileOpen(false)}><CircleHelp /> Help & support</NavLink><button onClick={() => { setProfileOpen(false); setLogoutOpen(true); }}><LogOut /> Sign out</button></div>}
          </div>
          <button className="mobile-header-logout" onClick={() => setLogoutOpen(true)} aria-label="Sign out"><LogOut /></button>
        </header>
        <Outlet context={{ requests: allRequests, openPickup: () => setPickupOpen(true), notify: setToast, cart, addToCart, openCart: () => setCartOpen(true) }} />
      </div>

      <nav className="mobile-bottom-nav">
        {appNav.slice(0, 4).map(({ label, to, icon: Icon, end }) => <NavLink key={to} to={to} end={end}><Icon /><span>{label}</span></NavLink>)}
        <button onClick={() => setPickupOpen(true)}><Plus /></button>
      </nav>

      <CartDrawer open={cartOpen} cart={cart} onClose={() => setCartOpen(false)} onBrowse={() => { setCartOpen(false); navigate('/app/rates'); }} onUpdate={updateCartItem} onRemove={removeCartItem} onCheckout={checkoutCart} />
      <PickupModal open={pickupOpen} onClose={() => setPickupOpen(false)} onConfirm={addRequest} />
      <LogoutDialog open={logoutOpen} role="Distributor" onCancel={() => setLogoutOpen(false)} onConfirm={() => navigate('/login', { replace: true })} />
      {toast && <div className="app-toast" role="status"><span><Check /></span><p>{toast}</p><button onClick={() => setToast('')}><X /></button></div>}
    </div>
  );
}

function CartDrawer({ open, cart, onClose, onBrowse, onUpdate, onRemove, onCheckout }) {
  const [address, setAddress] = useState('12 Allen Avenue, Ikeja, Lagos');
  const [window, setWindow] = useState('Today · 4:00–6:00 PM');
  const detailedItems = cart.map((item) => ({ ...item, material: materials.find((material) => material.id === item.materialId) })).filter((item) => item.material);
  const totalWeight = detailedItems.reduce((sum, item) => sum + Number(item.weight), 0);
  const totalValue = detailedItems.reduce((sum, item) => sum + Number(item.weight) * item.material.rate, 0);

  if (!open) return null;
  return <div className="cart-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Pickup cart">
      <header><div><span><ShoppingBasket /></span><div><b>Pickup cart</b><small>{cart.length} material{cart.length === 1 ? '' : 's'} ready to schedule</small></div></div><button onClick={onClose} aria-label="Close cart"><X /></button></header>
      {detailedItems.length ? <>
        <div className="cart-progress"><span className="active"><ShoppingBasket /> Review items</span><i /><span><CalendarDays /> Schedule</span><i /><span><Check /> Confirm</span></div>
        <div className="cart-scroll">
          <section className="cart-items"><div className="cart-section-title"><div><h3>Your materials</h3><p>Adjust the estimated weight for each item.</p></div><span>{cart.length} items</span></div>{detailedItems.map((item) => { const Icon = item.material.icon; return <article key={item.materialId}><span className="cart-material-icon" style={{ '--cart-color': item.material.color }}><Icon /></span><div className="cart-item-copy"><b>{item.material.name}</b><small>{formatNaira(item.material.rate)}/kg · {item.material.examples}</small></div><div className="cart-weight-control"><button onClick={() => onUpdate(item.materialId, item.weight - 1)} aria-label={`Reduce ${item.material.name} weight`}><Minus /></button><label><input type="number" min="1" value={item.weight} onChange={(event) => onUpdate(item.materialId, event.target.value)} /><span>kg</span></label><button onClick={() => onUpdate(item.materialId, item.weight + 1)} aria-label={`Increase ${item.material.name} weight`}><Plus /></button></div><strong>{formatNaira(item.weight * item.material.rate)}</strong><button className="cart-remove" onClick={() => onRemove(item.materialId)} aria-label={`Remove ${item.material.name}`}><Trash2 /></button></article>; })}</section>
          <section className="cart-schedule"><div className="cart-section-title"><div><h3>One pickup for everything</h3><p>All cart items share this location and time.</p></div></div><label><span>Pickup address</span><div><MapPin /><input value={address} onChange={(event) => setAddress(event.target.value)} /><button><LocateFixed /></button></div></label><label><span>Pickup window</span><div><CalendarDays /><select value={window} onChange={(event) => setWindow(event.target.value)}><option>Today · 4:00–6:00 PM</option><option>Tomorrow · 9:00–11:00 AM</option><option>Tomorrow · 12:00–2:00 PM</option><option>Tomorrow · 3:00–5:00 PM</option></select><ChevronDown /></div></label></section>
          <section className="cart-note"><ShieldCheck /><div><b>One collector, multiple materials</b><p>We’ll match a collector equipped for every item in this cart. Final payout follows verified weights.</p></div></section>
        </div>
        <footer><div className="cart-total"><span><small>{cart.length} materials · {totalWeight} kg estimated</small><b>Estimated payout</b></span><strong>{formatNaira(totalValue)}</strong></div><button className="cart-checkout-button" onClick={() => onCheckout(address, window)} disabled={!address.trim()}><ShoppingBasket /> Schedule cart pickup <ArrowRight /></button></footer>
      </> : <div className="empty-cart"><span><ShoppingBasket /></span><h2>Your pickup cart is empty</h2><p>Add materials from Live Rates, then schedule them together in one collection.</p><button onClick={onBrowse}>Browse materials <ArrowRight /></button></div>}
    </aside>
  </div>;
}

function PickupModal({ open, onClose, onConfirm }) {
  const [step, setStep] = useState(1);
  const [materialId, setMaterialId] = useState('metal');
  const [weight, setWeight] = useState(20);
  const [address, setAddress] = useState('12 Allen Avenue, Ikeja, Lagos');
  const [slot, setSlot] = useState('Today · 2:00–4:00 PM');
  const material = materials.find((item) => item.id === materialId);
  const amount = material.rate * Math.max(0, Number(weight || 0));

  if (!open) return null;
  const close = () => { setStep(1); onClose(); };
  const confirm = () => {
    onConfirm({ id: `RKO-${2410 + Math.floor(Math.random() * 80)}`, material: material.name, weight: Number(weight), amount, status: 'Matching collector', date: slot, collector: 'Finding match…', eta: null });
    close();
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <section className="pickup-modal" role="dialog" aria-modal="true" aria-label="Book a pickup">
        <header><div><span className="modal-icon"><Truck /></span><div><b>Book a pickup</b><small>Usually takes under 2 minutes</small></div></div><button onClick={close}><X /></button></header>
        <div className="modal-progress">{[1, 2, 3, 4].map((item) => <React.Fragment key={item}><span className={step >= item ? 'active' : ''}>{step > item ? <Check /> : item}</span>{item < 4 && <i className={step > item ? 'active' : ''} />}</React.Fragment>)}</div>

        <div className="modal-body">
          {step === 1 && <div className="modal-step"><Pill>Step 1 of 4</Pill><h2>What are we picking up?</h2><p>Choose the material that makes up most of your items.</p><div className="modal-materials">{materials.map((item) => { const Icon = item.icon; return <button className={materialId === item.id ? 'active' : ''} key={item.id} onClick={() => setMaterialId(item.id)}><span><Icon /></span><div><b>{item.name}</b><small>{item.examples}</small></div><em>{formatNaira(item.rate)}/kg</em>{materialId === item.id && <i><Check /></i>}</button>; })}</div></div>}
          {step === 2 && <div className="modal-step"><Pill>Step 2 of 4</Pill><h2>Tell us roughly how much.</h2><p>Don’t worry—your collector will confirm the final weight.</p><label className="big-weight-input"><span><Weight /></span><input type="number" min="1" value={weight} onChange={(event) => setWeight(event.target.value)} autoFocus /><b>kilograms</b></label><div className="weight-chips">{[5, 10, 20, 50].map((value) => <button onClick={() => setWeight(value)} key={value}>{value} kg</button>)}</div><button className="photo-upload"><span><Camera /></span><div><b>Add photos</b><small>Help collectors prepare for your items</small></div><Upload /></button></div>}
          {step === 3 && <div className="modal-step"><Pill>Step 3 of 4</Pill><h2>Where and when?</h2><p>Choose a collection point and your preferred time.</p><label className="modal-field"><span>Pickup address</span><div><MapPin /><input value={address} onChange={(event) => setAddress(event.target.value)} /><button><LocateFixed /></button></div></label><label className="modal-field"><span>Preferred time</span><div><CalendarDays /><select value={slot} onChange={(event) => setSlot(event.target.value)}><option>Today · 2:00–4:00 PM</option><option>Today · 4:00–6:00 PM</option><option>Tomorrow · 9:00–11:00 AM</option><option>Tomorrow · 12:00–2:00 PM</option></select><ChevronDown /></div></label><div className="pickup-note"><ShieldCheck /><span><b>Safe, verified collection</b><small>You’ll see your collector’s name, rating, and vehicle before arrival.</small></span></div></div>}
          {step === 4 && <div className="modal-step review-step"><Pill>Final check</Pill><h2>Everything look right?</h2><p>Review your request before we find your collector.</p><div className="review-card"><div className="review-material"><span><MaterialGlyph material={material} /></span><div><small>Material</small><b>{material.name}</b></div><button onClick={() => setStep(1)}>Edit</button></div><dl><div><dt>Estimated weight</dt><dd>{weight} kg</dd></div><div><dt>Pickup window</dt><dd>{slot}</dd></div><div><dt>Pickup address</dt><dd>{address}</dd></div></dl><div className="review-payout"><span><small>Estimated payout</small><b>Based on {formatNaira(material.rate)}/kg</b></span><strong>{formatNaira(amount)}</strong></div></div><label className="confirm-check"><input type="checkbox" defaultChecked /> I understand final payout follows verified weight and quality.</label></div>}
        </div>

        <footer>{step > 1 ? <button className="btn btn--bare" onClick={() => setStep(step - 1)}><ArrowLeft /> Back</button> : <span />}<button className="btn btn--pine" disabled={step === 2 && Number(weight) <= 0} onClick={() => step < 4 ? setStep(step + 1) : confirm()}>{step === 4 ? 'Confirm & find collector' : 'Continue'} <ArrowRight /></button></footer>
      </section>
    </div>
  );
}

function Dashboard() {
  const { requests, openPickup, notify } = useOutletContext();
  const active = requests.find((item) => !['Paid', 'Cancelled'].includes(item.status));
  return (
    <main className="app-page dashboard-page">
      <div className="page-heading"><div><Pill>Friday, 21 August</Pill><h1>Good morning, User <span>👋🏾</span></h1><p>Your recycling momentum is looking strong this month.</p></div><button className="btn btn--pine" onClick={openPickup}><Plus /> Book pickup</button></div>

      <section className="overview-grid">
        <article className="wallet-hero-card"><div className="wallet-card-top"><span><WalletCards /> REKO wallet</span><button><Eye /></button></div><strong>{formatNaira(24560, 2)}</strong><p>Available balance</p><div><button onClick={() => notify('Withdrawal flow opened.')}>Withdraw <ArrowUpRight /></button><span><TrendingUp /> +{formatNaira(9750)} this month</span></div></article>
        <article className="overview-stat"><span className="stat-icon green"><Weight /></span><div><small>Total recycled</small><strong>184.6 <em>kg</em></strong><span><TrendingUp /> 24% vs July</span></div></article>
        <article className="overview-stat"><span className="stat-icon kraft"><Leaf /></span><div><small>CO₂ avoided</small><strong>92.3 <em>kg</em></strong><span>Like planting 4 trees</span></div></article>
        <article className="overview-stat"><span className="stat-icon gold"><Award /></span><div><small>Community rank</small><strong>Top <em>8%</em></strong><span>↑ 3 places this month</span></div></article>
      </section>

      <OrdersAnalytics requests={requests} />

      <div className="dashboard-columns">
        <div className="dashboard-primary">
          {active && <section className="panel active-pickup"><div className="panel-head"><div><span className="live-dot"><i /> Live pickup</span><h2>Collector is on the way</h2></div><button><span>Track live</span><Navigation /></button></div><div className="collector-row"><span className="collector-avatar">MA</span><div><b>{active.collector}</b><small><Star /> 4.9 · 328 pickups</small></div><div className="eta"><small>Arrives in</small><b>{active.eta || 'Matching'}</b></div></div><div className="pickup-timeline"><span className="done"><i><Check /></i><b>Booked</b><small>9:12 AM</small></span><span className="done"><i><Check /></i><b>Accepted</b><small>9:19 AM</small></span><span className="current"><i><Truck /></i><b>On the way</b><small>Now</small></span><span><i><Weight /></i><b>Weigh & pay</b><small>Next</small></span></div><div className="active-pickup-foot"><span><ActiveIcon name={active.material} /><b>{active.material}</b><small>{active.weight} kg estimated</small></span><span><MapPin /><b>12 Allen Avenue</b><small>Ikeja, Lagos</small></span><button onClick={() => notify('Calling your collector…')}><Phone /> Call collector</button></div></section>}

          <section className="panel recent-panel"><div className="panel-head"><div><h2>Recent pickups</h2><p>Your latest collection activity.</p></div><Link to="/app/pickups" className="panel-link">View all <ArrowRight /></Link></div><RequestRows requests={requests.slice(0, 3)} /></section>
        </div>

        <aside className="dashboard-secondary">
          <section className="panel goal-panel"><div className="panel-head"><div><h2>August goal</h2><p>You’re almost there.</p></div><button><MoreDots /></button></div><div className="goal-ring"><div><strong>92%</strong><small>complete</small></div></div><p><b>184 kg</b> of your 200 kg goal</p><div className="goal-callout"><Sparkles /><span>Recycle <b>16 kg more</b> to unlock the Eco Streak badge.</span></div></section>
          <section className="panel rate-mini-panel"><div className="panel-head"><div><h2>Today’s rates</h2><p>Updated 9:00 AM</p></div><Link to="/app/rates" className="panel-link">All rates</Link></div>{materials.slice(0, 3).map((item) => { const Icon = item.icon; return <article key={item.id}><span style={{ '--material-color': item.color }}><Icon /></span><div><b>{item.name}</b><small>{item.trend > 0 ? '+' : ''}{item.trend}% today</small></div><strong>{formatNaira(item.rate)}<small>/kg</small></strong></article>; })}</section>
          <section className="nearby-card"><div><span><MapPin /></span><small>Nearest drop station</small><h3>REKO Ikeja Hub</h3><p>Allen Avenue · 0.6 km</p></div><button onClick={() => notify('Directions opened for REKO Ikeja Hub.')}><Navigation /> Directions</button></section>
        </aside>
      </div>
    </main>
  );
}

function MoreDots() { return <span className="more-dots">•••</span>; }
function ActiveIcon({ name }) { const Item = materials.find((material) => material.name === name); const Icon = Item?.icon || Recycle; return <Icon />; }

function StatusBadge({ status }) {
  const key = status.toLowerCase().replaceAll(' ', '-');
  return <span className={`status status--${key}`}><i />{status}</span>;
}

function RequestRows({ requests }) {
  return <div className="request-rows">{requests.map((request) => { const material = materials.find((item) => item.name === request.material); const Icon = material?.icon || Recycle; return <article key={request.id}><span className="request-material" style={{ '--material-color': material?.color }}><Icon /></span><div className="request-main"><b>{request.material} pickup</b><small><code>{request.id}</code> · {request.date}</small></div><div className="request-weight"><small>Weight</small><b>{request.weight} kg</b></div><StatusBadge status={request.status} /><strong>{formatNaira(request.amount)}</strong><button><ChevronRight /></button></article>; })}</div>;
}

function OrdersAnalytics({ requests }) {
  const [metric, setMetric] = useState('payout');
  const [range, setRange] = useState('6');
  const [hovered, setHovered] = useState(null);

  const visibleOrders = useMemo(() => {
    const ordered = [...requests].reverse();
    return range === 'all' ? ordered : ordered.slice(-Number(range));
  }, [requests, range]);

  const chart = useMemo(() => {
    const width = 680;
    const height = 220;
    const left = 46;
    const right = 18;
    const top = 22;
    const bottom = 38;
    const values = visibleOrders.map((order) => metric === 'payout' ? Number(order.amount || 0) : Number(order.weight || 0));
    const maximum = Math.max(...values, 1) * 1.15;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const points = values.map((value, index) => ({
      x: left + (values.length === 1 ? plotWidth / 2 : (index / (values.length - 1)) * plotWidth),
      y: top + plotHeight - (value / maximum) * plotHeight,
      value,
      order: visibleOrders[index],
    }));
    const line = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
    const area = points.length ? `${line} L ${points.at(-1).x} ${top + plotHeight} L ${points[0].x} ${top + plotHeight} Z` : '';
    const grid = [0, .25, .5, .75, 1].map((ratio) => ({
      y: top + plotHeight - ratio * plotHeight,
      label: metric === 'payout' ? formatNaira(maximum * ratio) : `${Math.round(maximum * ratio)} kg`,
    }));
    return { width, height, left, top, plotHeight, points, line, area, grid };
  }, [visibleOrders, metric]);

  const breakdown = useMemo(() => {
    const totals = visibleOrders.reduce((result, order) => {
      const current = result[order.material] || { count: 0, weight: 0, amount: 0 };
      current.count += 1;
      current.weight += Number(order.weight || 0);
      current.amount += Number(order.amount || 0);
      result[order.material] = current;
      return result;
    }, {});
    return Object.entries(totals).sort((a, b) => b[1].count - a[1].count);
  }, [visibleOrders]);

  if (requests.length < 2) return null;
  const totalAmount = visibleOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
  const totalWeight = visibleOrders.reduce((sum, order) => sum + Number(order.weight || 0), 0);

  return <section className="panel orders-analytics">
    <div className="orders-analytics-head">
      <div><span className="analytics-icon"><BarChart3 /></span><div><h2>Multiple-order analytics</h2><p>Compare the value and weight of every pickup at a glance.</p></div></div>
      <div className="analytics-controls"><div>{[['payout', 'Payout'], ['weight', 'Weight']].map(([value, label]) => <button className={metric === value ? 'active' : ''} onClick={() => setMetric(value)} key={value}>{label}</button>)}</div><label><select value={range} onChange={(event) => setRange(event.target.value)}><option value="6">Last 6 orders</option><option value="all">All orders</option></select><ChevronDown /></label></div>
    </div>
    <div className="orders-analytics-summary"><article><small>Orders compared</small><strong>{String(visibleOrders.length).padStart(2, '0')}</strong><span>Across {breakdown.length} materials</span></article><article><small>Combined weight</small><strong>{totalWeight.toFixed(1)} <em>kg</em></strong><span><TrendingUp /> Active recycling volume</span></article><article><small>Combined value</small><strong>{formatNaira(totalAmount)}</strong><span><Coins /> Estimated payout value</span></article></div>
    <div className="orders-analytics-body">
      <div className="orders-chart-wrap" onMouseLeave={() => setHovered(null)}>
        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label={`${metric} comparison across ${visibleOrders.length} orders`}>
          <defs><linearGradient id="rekoOrderArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22C55E" stopOpacity=".23"/><stop offset="100%" stopColor="#22C55E" stopOpacity="0"/></linearGradient></defs>
          {chart.grid.map((item, index) => <g key={index}><line x1={chart.left} x2={chart.width - 18} y1={item.y} y2={item.y} className="chart-grid-line"/><text x={chart.left - 8} y={item.y + 3} textAnchor="end" className="chart-axis-label">{item.label}</text></g>)}
          <path d={chart.area} fill="url(#rekoOrderArea)" />
          <path d={chart.line} className="order-chart-line" />
          {chart.points.map((point, index) => <g key={point.order.id} className="order-chart-point" onMouseEnter={() => setHovered(index)} onFocus={() => setHovered(index)} tabIndex="0"><circle cx={point.x} cy={point.y} r={hovered === index ? 7 : 5} /><circle cx={point.x} cy={point.y} r="2" className="point-core"/><text x={point.x} y={chart.height - 13} textAnchor="middle" className="chart-order-label">{point.order.id.replace('RKO-', '#')}</text></g>)}
        </svg>
        {hovered !== null && chart.points[hovered] && <div className="chart-tooltip" style={{ left: `${(chart.points[hovered].x / chart.width) * 100}%`, top: `${Math.max(3, (chart.points[hovered].y / chart.height) * 100 - 7)}%` }}><small>{chart.points[hovered].order.material} · {chart.points[hovered].order.id}</small><strong>{metric === 'payout' ? formatNaira(chart.points[hovered].value) : `${chart.points[hovered].value} kg`}</strong><span>{chart.points[hovered].order.status}</span></div>}
      </div>
      <aside className="material-breakdown"><div><h3>Order mix</h3><span>{visibleOrders.length} total</span></div>{breakdown.map(([name, value]) => { const material = materials.find((item) => item.name === name); const Icon = material?.icon || Recycle; return <article key={name}><span style={{ '--analytics-color': material?.color || '#1B4D3E' }}><Icon /></span><div><b>{name}</b><small>{value.count} order{value.count > 1 ? 's' : ''} · {value.weight} kg</small><i><em style={{ width: `${(value.count / visibleOrders.length) * 100}%`, '--analytics-color': material?.color || '#1B4D3E' }} /></i></div><strong>{Math.round((value.count / visibleOrders.length) * 100)}%</strong></article>; })}<footer><span><ShieldCheck /> Based on your visible orders</span></footer></aside>
    </div>
  </section>;
}

function PickupsPage() {
  const { requests, openPickup } = useOutletContext();
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const visible = requests.filter((request) => (filter === 'All' || (filter === 'Active' ? request.status !== 'Paid' : request.status === 'Paid')) && `${request.id} ${request.material}`.toLowerCase().includes(query.toLowerCase()));
  return <main className="app-page"><div className="page-heading"><div><Pill>Pickup history</Pill><h1>Your pickups</h1><p>Track active collections and revisit every completed request.</p></div><button className="btn btn--pine" onClick={openPickup}><Plus /> Book pickup</button></div><OrdersAnalytics requests={requests} /><section className="panel pickups-page-panel"><div className="list-toolbar"><div className="filter-tabs">{['All', 'Active', 'Completed'].map((item) => <button className={filter === item ? 'active' : ''} key={item} onClick={() => setFilter(item)}>{item}{item === 'Active' && <em>1</em>}</button>)}</div><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pickups" /></label><button className="icon-filter"><BarChart3 /></button></div>{visible.length ? <RequestRows requests={visible} /> : <div className="empty-list"><Search /><h3>No pickups found</h3><p>Try another request ID or material.</p></div>}</section></main>;
}

function WalletPage() {
  const { notify } = useOutletContext();
  return <main className="app-page"><div className="page-heading"><div><Pill>Your earnings</Pill><h1>Wallet</h1><p>See what you’ve earned and move your money securely.</p></div><button className="btn btn--soft"><Download /> Statement</button></div><div className="wallet-page-grid"><section className="wallet-large-card"><div><Logo light /><span><Eye /></span></div><small>AVAILABLE BALANCE</small><strong>{formatNaira(24560, 2)}</strong><p><TrendingUp /> +{formatNaira(9750)} earned in August</p><button className="btn btn--mint" onClick={() => notify('Withdrawal flow opened.')}>Withdraw funds <ArrowUpRight /></button><footer><span><ShieldCheck /> Protected wallet</span><b>•••• 4072</b></footer></section><section className="panel earnings-chart"><div className="panel-head"><div><h2>Earnings overview</h2><p>Your pickup income over the last 6 months.</p></div><button>This year <ChevronDown /></button></div><div className="earnings-total"><span><small>Total earned</small><b>{formatNaira(38240)}</b></span><em><TrendingUp /> 18.4%</em></div><div className="money-chart">{[{m:'Mar',v:37},{m:'Apr',v:54},{m:'May',v:46},{m:'Jun',v:72},{m:'Jul',v:63},{m:'Aug',v:92}].map((bar) => <div key={bar.m}><span><i style={{ height: `${bar.v}%` }} /></span><small>{bar.m}</small></div>)}</div></section></div><section className="panel transaction-panel"><div className="panel-head"><div><h2>Recent transactions</h2><p>All wallet movement in one place.</p></div><button className="panel-link">View all <ArrowRight /></button></div><div>{transactions.map((item) => <article key={item.id}><span className={`transaction-mark ${item.type}`} >{item.type === 'credit' ? <ArrowDownLeft /> : <ArrowUpRight />}</span><div><b>{item.name}</b><small>{item.meta} · {item.date}</small></div><code>{item.id}</code><strong className={item.type}>{item.type === 'credit' ? '+' : '−'}{formatNaira(item.amount)}</strong><button><ChevronRight /></button></article>)}</div></section></main>;
}

function RatesPage() {
  const { openPickup, addToCart, openCart, cart } = useOutletContext();
  const [materialId, setMaterialId] = useState('metal');
  const [weight, setWeight] = useState(25);
  const material = materials.find((item) => item.id === materialId);
  return <main className="app-page"><div className="page-heading"><div><Pill>Market updated 9:00 AM</Pill><h1>Live material rates</h1><p>Clear indicative pricing before you book a pickup.</p></div><button className="btn btn--pine" onClick={openPickup}><Plus /> Book pickup</button></div><section className="market-banner"><div><span><TrendingUp /></span><div><small>REKO MARKET PULSE</small><h2>Recyclable values are up <em>3.2%</em> this week.</h2><p>Metal and e-waste are seeing the strongest movement.</p></div></div><span>Updated live</span></section><div className="app-rate-grid">{materials.map((item) => { const Icon = item.icon; return <article className="panel" key={item.id}><div><span style={{ '--material-color': item.color }}><Icon /></span><em className={item.trend < 0 ? 'down' : ''}>{item.trend < 0 ? <TrendingDown /> : <TrendingUp />}{Math.abs(item.trend)}%</em></div><h3>{item.name}</h3><p>{item.examples}</p><strong>{formatNaira(item.rate)}<small>/kg</small></strong><span className="range">7-day range · {formatNaira(item.rate - 8)}–{formatNaira(item.rate + 12)}</span><div className="sparkline">{[20,35,28,48,42,65,58,76,69,88].map((height, i) => <i key={i} style={{height: `${height}%`}} />)}</div><button className="rate-cart-button" onClick={() => addToCart(item.id, 5)}><ShoppingBasket /> Add 5 kg to cart</button></article>; })}</div><section className="panel rate-calculator"><div><Pill>Quick calculator</Pill><h2>Estimate your payout</h2><p>Choose a material and enter your approximate weight.</p></div><label><span>Material</span><div><MaterialGlyph material={material} /><select value={materialId} onChange={(event) => setMaterialId(event.target.value)}>{materials.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown /></div></label><label><span>Weight</span><div><Weight /><input type="number" min="1" value={weight} onChange={(event) => setWeight(event.target.value)} /><b>kg</b></div></label><div className="calculator-result"><small>You may earn</small><strong>{formatNaira(material.rate * weight)}</strong><span>Final amount follows weighing</span></div><div className="rate-calculator-actions"><button className="btn btn--soft" onClick={() => addToCart(materialId, weight)}><ShoppingBasket /> Add to cart</button><button className="btn btn--pine" onClick={cart.length ? openCart : openPickup}>{cart.length ? `View cart (${cart.length})` : 'Book pickup'} <ArrowRight /></button></div></section></main>;
}

function StationsPage() {
  const { notify } = useOutletContext();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(1);
  const visible = stations.filter((item) => `${item.name} ${item.area}`.toLowerCase().includes(query.toLowerCase()));
  return <main className="app-page stations-app-page"><div className="page-heading"><div><Pill>500+ verified locations</Pill><h1>Drop stations</h1><p>Find an open drop-off point near you.</p></div><button className="btn btn--soft" onClick={() => notify('Using your current location near Ikeja.')}><LocateFixed /> Use my location</button></div><div className="station-explorer"><section className="panel station-sidebar"><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search area or station" /></label><div className="station-count"><b>{visible.length} stations nearby</b><button>Distance <ChevronDown /></button></div><div className="station-cards">{visible.map((station) => <button className={selected === station.id ? 'active' : ''} onClick={() => setSelected(station.id)} key={station.id}><span className="station-index">{station.id}</span><div><b>{station.name}</b><small><MapPin /> {station.area}</small><p><span>{station.hours}</span> · {station.distance}</p><div>{station.materials.map((tag) => <em key={tag}>{tag}</em>)}</div></div><ChevronRight /></button>)}</div></section><section className="station-map panel"><div className="map-grid" />{stations.map((station) => <button className={`map-pin ${selected === station.id ? 'active' : ''}`} onClick={() => setSelected(station.id)} style={{ left: `${station.x}%`, top: `${station.y}%` }} key={station.id}><MapPin /><span>{station.id}</span></button>)}<button className="my-location"><Navigation /></button><article className="map-station-card"><span><Building2 /></span><div><b>{stations.find((item) => item.id === selected)?.name}</b><small>{stations.find((item) => item.id === selected)?.distance} away · {stations.find((item) => item.id === selected)?.hours}</small></div><button onClick={() => notify('Directions opened in your maps app.')}><Navigation /> Directions</button></article></section></div></main>;
}

function ImpactPage() {
  return <main className="app-page"><div className="page-heading"><div><Pill>Your footprint, reimagined</Pill><h1>My impact</h1><p>Every pickup adds up to cleaner streets and stronger circular systems.</p></div><button className="btn btn--soft"><Download /> Share report</button></div><section className="impact-hero-card"><div><Pill light>August impact score</Pill><h2>You’re making the loop stronger.</h2><p>You recycled more than 92% of REKO members this month.</p><div className="impact-rank"><span><Award /></span><div><b>Top 8%</b><small>in Ikeja community</small></div></div></div><div className="big-impact-ring"><div><strong>184.6</strong><span>kg</span><small>recycled</small></div></div><div className="impact-hero-stats"><article><Leaf /><span><small>CO₂ avoided</small><b>92.3 kg</b></span></article><article><Zap /><span><small>Energy saved</small><b>368 kWh</b></span></article><article><Recycle /><span><small>Landfill diverted</small><b>100%</b></span></article></div></section><div className="impact-details-grid"><section className="panel impact-history"><div className="panel-head"><div><h2>Your recycling journey</h2><p>Monthly kilograms diverted from waste.</p></div><button>Last 12 months <ChevronDown /></button></div><div className="impact-history-chart">{[31,42,38,57,51,62,70,66,81,76,94,88].map((height,index) => <div key={index}><span><i style={{height:`${height}%`}} /></span><small>{['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'][index]}</small></div>)}</div></section><section className="panel badges-panel"><div className="panel-head"><div><h2>Milestones</h2><p>3 of 6 badges earned</p></div><Award /></div><div><article className="earned"><span><Leaf /></span><div><b>First 50 kg</b><small>Earned 12 May</small></div><Check /></article><article className="earned"><span><Recycle /></span><div><b>Circular century</b><small>100 kg recycled</small></div><Check /></article><article className="earned"><span><Zap /></span><div><b>Eco streak</b><small>3 months in a row</small></div><Check /></article><article><span><Target /></span><div><b>Quarter tonne</b><small>66 kg to unlock</small></div><LockKeyhole /></article></div></section></div></main>;
}

function HelpPage() {
  const { notify } = useOutletContext();
  const [open, setOpen] = useState(0);
  const faqs = [
    ['How do REKO pickups work?', 'Choose your material and estimated weight, select a pickup window, and confirm. A verified collector is matched to your request and you can follow their arrival in the app.'],
    ['How is the final payout calculated?', 'Your displayed estimate uses the current indicative rate. At pickup, the collector weighs and quality-checks your items with you before you approve the final amount.'],
    ['Which materials can I recycle?', 'REKO currently accepts common metals, clean PET plastics, paper and cardboard, small e-waste, and selected mixed recyclables.'],
    ['When can I withdraw my wallet balance?', 'Completed pickup payments are available immediately. Withdrawals to your linked bank account are typically processed within minutes.'],
  ];
  return <main className="app-page"><div className="page-heading"><div><Pill>We’re here to help</Pill><h1>Help & support</h1><p>Quick answers, helpful guides, and a real person when you need one.</p></div></div><div className="help-grid"><section className="panel faq-panel"><label><Search /><input placeholder="Search the help centre" /></label><h2>Frequently asked questions</h2><div>{faqs.map(([question, answer], index) => <article key={question}><button onClick={() => setOpen(open === index ? -1 : index)}><span>{question}</span><ChevronDown className={open === index ? 'open' : ''} /></button>{open === index && <p>{answer}</p>}</article>)}</div></section><aside><section className="support-now-card"><span><Headphones /></span><Pill light>REKO support</Pill><h2>Need a human?</h2><p>Our Lagos support team is online and ready to help.</p><button className="btn btn--mint btn--full" onClick={() => notify('Support conversation started.')}>Start a conversation <MessageCircle /></button><small><i /> Online · replies in about 3 min</small></section><section className="panel contact-list"><article><Mail /><div><b>Email us</b><small>hello@reko.ng</small></div><ArrowRight /></article><article><Phone /><div><b>Call support</b><small>Mon–Sat, 8 AM–7 PM</small></div><ArrowRight /></article></section></aside></div></main>;
}

function App() {
  return <Routes>
    <RouterRoute path="/" element={<Landing />} />
    <RouterRoute path="/login" element={<Login />} />
    <RouterRoute path="/signup" element={<Signup />} />
    <RouterRoute path="/welcome" element={<WelcomeTour />} />
    <RouterRoute path="/app" element={<AppShell />}>
      <RouterRoute index element={<Dashboard />} />
      <RouterRoute path="pickups" element={<PickupsPage />} />
      <RouterRoute path="wallet" element={<WalletPage />} />
      <RouterRoute path="rates" element={<RatesPage />} />
      <RouterRoute path="stations" element={<StationsPage />} />
      <RouterRoute path="impact" element={<ImpactPage />} />
      <RouterRoute path="help" element={<HelpPage />} />
    </RouterRoute>
    <RouterRoute path="/collector" element={<CollectorShell />}>
      <RouterRoute index element={<CollectorDashboard />} />
      <RouterRoute path="orders" element={<NearbyOrdersPage />} />
      <RouterRoute path="active" element={<ActivePickupsPage />} />
      <RouterRoute path="earnings" element={<CollectorEarningsPage />} />
      <RouterRoute path="help" element={<HelpPage />} />
    </RouterRoute>
    <RouterRoute path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}

export default App;
