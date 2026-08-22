import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  Check,
  ChevronRight,
  CircleUserRound,
  CreditCard,
  Eye,
  EyeOff,
  FileCheck2,
  Fingerprint,
  Leaf,
  LockKeyhole,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Recycle,
  ShieldCheck,
  Sparkles,
  Truck,
  User,
  WalletCards,
  X,
  Zap,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function SignupLogo({ light = false }) {
  return <span className="brand"><img src={light ? '/branding/reko-wordmark-light.svg' : '/branding/reko-wordmark.svg'} alt="REKO" /></span>;
}

function StepTrack({ current, labels }) {
  return <div className="signup-step-track">{labels.map((label, index) => <React.Fragment key={label}><span className={current >= index + 1 ? 'active' : ''}>{current > index + 1 ? <Check /> : index + 1}<small>{label}</small></span>{index < labels.length - 1 && <i className={current > index + 1 ? 'active' : ''} />}</React.Fragment>)}</div>;
}

export function Signup() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = new URLSearchParams(location.search).get('role') === 'collector' ? 'collector' : 'distributor';
  const [path, setPath] = useState(null);
  const [existingStep, setExistingStep] = useState(1);
  const [newStep, setNewStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', dob: '', bvn: '', nin: '', address: '', password: '', businessName: '' });

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const startTour = (source) => navigate(`/welcome?role=${role}&source=${source}`);

  return <main className="signup-page">
    <Link className="signup-back-home" to="/login"><ArrowLeft /> Back to sign in</Link>
    <section className="signup-shell">
      <aside className="signup-story">
        <SignupLogo light />
        <div className="signup-story-copy"><span className="signup-story-pill"><Sparkles /> REKO × Wema ALAT</span><h2>One simple start. A cleaner, more rewarding routine.</h2><p>Join REKO with the Wema account you already have—or open a secure ALAT account while you create your recycling profile.</p></div>
        <div className="signup-story-benefits"><article><span><WalletCards /></span><div><b>Instant payout wallet</b><small>Your recycling earnings have somewhere secure to land.</small></div></article><article><span><ShieldCheck /></span><div><b>Bank-grade protection</b><small>Identity and account verification powered by Wema.</small></div></article><article><span><Recycle /></span><div><b>REKO ready</b><small>Book pickups and track impact immediately after setup.</small></div></article></div>
        <footer><ShieldCheck /> Powered securely by Wema ALAT</footer>
      </aside>

      <section className="signup-content">
        <div className="signup-mobile-logo"><SignupLogo /></div>
        {path && <button className="signup-path-back" onClick={() => { setPath(null); setExistingStep(1); setNewStep(1); }}><ArrowLeft /> Change signup method</button>}

        {!path && <div className="signup-choice"><span className="signup-kicker"><Sparkles /> {role} onboarding</span><h1>How would you like to join REKO?</h1><p>Choose the option that matches your relationship with Wema Bank.</p><div className="signup-choice-grid"><button onClick={() => setPath('existing')}><span className="choice-icon wema"><Building2 /></span><em>FASTEST</em><h3>I have a Wema account</h3><p>Connect securely with your 10-digit account number. No long form required.</p><div><span><Check /> Verify existing account</span><span><Check /> Use your Wema payout wallet</span></div><strong>Continue with account number <ArrowRight /></strong></button><button onClick={() => setPath('new')}><span className="choice-icon alat"><Sparkles /></span><h3>I’m new to Wema</h3><p>Fill in your details and we’ll set up a Wema ALAT account alongside REKO.</p><div><span><Check /> Digital account opening</span><span><Check /> No branch visit required</span></div><strong>Open REKO + ALAT account <ArrowRight /></strong></button></div><div className="signup-assurance"><ShieldCheck /><span><b>Your information stays protected.</b><small>REKO only receives the account details needed for payouts and verification.</small></span></div><p className="signup-signin-copy">Already registered? <Link to={`/login${role === 'collector' ? '?role=collector' : ''}`}>Sign in instead</Link></p></div>}

        {path === 'existing' && <div className="existing-wema-flow">
          <StepTrack current={existingStep} labels={['Account', 'Verify', 'Ready']} />
          {existingStep === 1 && <form onSubmit={(event) => { event.preventDefault(); if (accountNumber.length === 10) setExistingStep(2); }}><span className="signup-kicker"><Building2 /> Existing Wema customer</span><h1>Connect your Wema account.</h1><p>Enter your account number. We’ll confirm the account name before sending a secure code.</p><label className="signup-field"><span>Wema account number</span><div className={accountNumber.length === 10 ? 'valid' : ''}><CreditCard /><input inputMode="numeric" maxLength="10" value={accountNumber} onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, ''))} placeholder="0123456789" autoFocus />{accountNumber.length === 10 && <Check />}</div><small>Enter the 10-digit number linked to your Wema account.</small></label><button className="signup-primary" disabled={accountNumber.length !== 10}>Find my account <ArrowRight /></button><div className="wema-security-note"><LockKeyhole /><span><b>Secure account lookup</b><small>Your banking credentials are never stored by REKO.</small></span></div></form>}
          {existingStep === 2 && <form onSubmit={(event) => { event.preventDefault(); if (otp.length === 6) setExistingStep(3); }}><span className="signup-kicker"><Fingerprint /> Confirm it’s you</span><h1>We found your account.</h1><p>Review the account below, then enter the verification code sent to your registered phone.</p><article className="account-found-card"><span><Check /></span><div><small>WEMA ACCOUNT FOUND</small><b>{accountNumber === '0123456789' ? 'ADE USER' : 'REKO CUSTOMER'}</b><p>Wema Bank · ••••••{accountNumber.slice(-4)}</p></div><em>Verified</em></article><label className="signup-field otp-field"><span>6-digit verification code</span><div><Fingerprint /><input inputMode="numeric" maxLength="6" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} placeholder="000000" autoFocus /></div><small>For this prototype, enter any six digits.</small></label><button className="resend-code" type="button">Didn’t receive it? <b>Send another code</b></button><button className="signup-primary" disabled={otp.length !== 6}>Verify & connect account <ArrowRight /></button></form>}
          {existingStep === 3 && <div className="signup-success"><span className="success-orbit"><Check /></span><span className="signup-kicker"><ShieldCheck /> Account connected</span><h1>You’re ready for REKO.</h1><p>Your Wema account is now connected as the secure destination for recycling payouts.</p><div className="connected-summary"><article><WalletCards /><span><small>PAYOUT ACCOUNT</small><b>Wema · •••• {accountNumber.slice(-4)}</b></span><Check /></article><article><User /><span><small>REKO PROFILE</small><b>{role === 'collector' ? 'Verified collector' : 'Distributor account'}</b></span><Check /></article></div><button className="signup-primary" onClick={() => startTour('wema')}>Show me around <ArrowRight /></button><button className="skip-tour-link" onClick={() => navigate(role === 'collector' ? '/collector' : '/app')}>Skip introduction</button></div>}
        </div>}

        {path === 'new' && <div className="new-alat-flow">
          <StepTrack current={newStep} labels={['Details', 'Identity', 'Create']} />
          {newStep === 1 && <form onSubmit={(event) => { event.preventDefault(); setNewStep(2); }}><span className="signup-kicker"><CircleUserRound /> Personal details</span><h1>Let’s get to know you.</h1><p>These details create both your REKO profile and your Wema ALAT account application.</p><div className="signup-two-columns"><label className="signup-field"><span>First name</span><div><User /><input required value={form.firstName} onChange={(event) => update('firstName', event.target.value)} placeholder="Ade" /></div></label><label className="signup-field"><span>Last name</span><div><User /><input required value={form.lastName} onChange={(event) => update('lastName', event.target.value)} placeholder="Okafor" /></div></label></div>{role === 'collector' && <label className="signup-field"><span>Collector or business name</span><div><Truck /><input required value={form.businessName} onChange={(event) => update('businessName', event.target.value)} placeholder="Musa Collection Services" /></div></label>}<label className="signup-field"><span>Email address</span><div><Mail /><input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="you@example.com" /></div></label><label className="signup-field"><span>Phone number</span><div><Phone /><input required type="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+234 800 000 0000" /></div></label><label className="signup-field"><span>Date of birth</span><div><CircleUserRound /><input required type="date" value={form.dob} onChange={(event) => update('dob', event.target.value)} /></div></label><button className="signup-primary">Continue to identity <ArrowRight /></button></form>}
          {newStep === 2 && <form onSubmit={(event) => { event.preventDefault(); setNewStep(3); }}><span className="signup-kicker"><FileCheck2 /> Identity verification</span><h1>Secure your new account.</h1><p>Wema uses these details to complete the required identity and address checks.</p><label className="signup-field"><span>Bank Verification Number (BVN)</span><div><Fingerprint /><input required inputMode="numeric" maxLength="11" value={form.bvn} onChange={(event) => update('bvn', event.target.value.replace(/\D/g, ''))} placeholder="11-digit BVN" /></div><small>Your BVN is encrypted and sent directly to Wema for verification.</small></label><label className="signup-field"><span>National Identification Number (NIN)</span><div><FileCheck2 /><input required inputMode="numeric" maxLength="11" value={form.nin} onChange={(event) => update('nin', event.target.value.replace(/\D/g, ''))} placeholder="11-digit NIN" /></div></label><label className="signup-field"><span>Residential address</span><div><MapPin /><input required value={form.address} onChange={(event) => update('address', event.target.value)} placeholder="12 Allen Avenue, Ikeja, Lagos" /></div></label><div className="signup-form-actions"><button type="button" className="signup-secondary" onClick={() => setNewStep(1)}><ArrowLeft /> Back</button><button className="signup-primary">Review application <ArrowRight /></button></div></form>}
          {newStep === 3 && <form onSubmit={(event) => { event.preventDefault(); startTour('alat'); }}><span className="signup-kicker"><Sparkles /> Final step</span><h1>Create your REKO + ALAT account.</h1><p>Choose a secure password and approve the account-opening request.</p><article className="application-summary"><header><span><User /></span><div><small>ACCOUNT APPLICANT</small><b>{form.firstName || 'Ade'} {form.lastName || 'Okafor'}</b><p>{form.phone || '+234 800 000 0000'} · {form.email || 'you@example.com'}</p></div><button type="button" onClick={() => setNewStep(1)}>Edit</button></header><div><span><Check /> REKO {role} profile</span><span><Check /> Wema ALAT savings account</span><span><Check /> Secure recycling payout wallet</span></div></article><label className="signup-field"><span>Create password</span><div><LockKeyhole /><input required minLength="8" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => update('password', event.target.value)} placeholder="At least 8 characters" /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label><label className="signup-consent"><input required type="checkbox" /><span>I agree to REKO’s terms and consent to Wema Bank processing my details to open an ALAT account.</span></label><div className="signup-form-actions"><button type="button" className="signup-secondary" onClick={() => setNewStep(2)}><ArrowLeft /> Back</button><button className="signup-primary"><ShieldCheck /> Open account securely <ArrowRight /></button></div><p className="account-opening-note"><LockKeyhole /> This prototype simulates account opening. Production requires Wema’s secure onboarding APIs.</p></form>}
        </div>}
      </section>
    </section>
  </main>;
}

const distributorSlides = [
  { icon: WalletCards, eyebrow: 'Your wallet is ready', title: 'Every pickup can become real value.', body: 'See estimates before collection, approve verified weights, and receive payouts directly into your connected Wema wallet.', stat: '₦24,560', statLabel: 'sample wallet balance', tone: 'wallet' },
  { icon: Truck, eyebrow: 'Collection without confusion', title: 'Book once. Track every step.', body: 'Choose your materials and time, follow your collector’s arrival, and keep every request organised in one place.', stat: '12 min', statLabel: 'sample collector ETA', tone: 'pickup' },
  { icon: Leaf, eyebrow: 'Impact made visible', title: 'Watch your cleaner habits add up.', body: 'Every kilogram becomes a record of value recovered, emissions avoided, and progress toward your monthly goal.', stat: '184 kg', statLabel: 'sample recycled total', tone: 'impact' },
];

const collectorSlides = [
  { icon: MapPin, eyebrow: 'Location-aware orders', title: 'The nearest opportunity comes first.', body: 'Go online to receive pickup requests sorted by distance, material, and collection window.', stat: '0.8 km', statLabel: 'sample nearest order', tone: 'pickup' },
  { icon: Truck, eyebrow: 'One clear workflow', title: 'Accept. Collect. Confirm.', body: 'Move every job from accepted to en route, arrived, weighed, and completed without losing context.', stat: '4 steps', statLabel: 'to complete a pickup', tone: 'wallet' },
  { icon: Banknote, eyebrow: 'Transparent payouts', title: 'Approve the money with confidence.', body: 'Enter verified weight with the customer present, review the calculation, and release their payout.', stat: '₦18,740', statLabel: 'sample collector wallet', tone: 'impact' },
];

export function WelcomeTour() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const role = params.get('role') === 'collector' ? 'collector' : 'distributor';
  const source = params.get('source') === 'alat' ? 'alat' : 'wema';
  const slides = role === 'collector' ? collectorSlides : distributorSlides;
  const [step, setStep] = useState(0);
  const destination = role === 'collector' ? '/collector' : '/app';
  const slide = slides[step];
  const Icon = slide.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (step < slides.length - 1) setStep((current) => current + 1);
      else navigate(destination, { replace: true });
    }, step < slides.length - 1 ? 2800 : 3500);
    return () => clearTimeout(timer);
  }, [step, slides.length, navigate, destination]);

  return <main className={`welcome-tour welcome-tour--${slide.tone}`}>
    <header><SignupLogo light /><button onClick={() => navigate(destination, { replace: true })}>Skip introduction <X /></button></header>
    <div className="welcome-ambient"><i /><i /><i /></div>
    <section className="welcome-stage" key={step}>
      <div className="welcome-copy"><span className="welcome-account-ready"><Check /> {source === 'alat' ? 'Wema ALAT account opened' : 'Wema account connected'}</span><span className="welcome-eyebrow"><Icon /> {slide.eyebrow}</span><h1>{slide.title}</h1><p>{slide.body}</p><div className="welcome-stat"><strong>{slide.stat}</strong><span>{slide.statLabel}</span></div></div>
      <TourVisual tone={slide.tone} role={role} />
    </section>
    <footer><div className="welcome-progress">{slides.map((item, index) => <button className={index === step ? 'active' : index < step ? 'done' : ''} onClick={() => setStep(index)} key={item.title}><i>{index === step && <span />}</i><small>0{index + 1}</small></button>)}</div><div><span>{step + 1} of {slides.length}</span><button onClick={() => step < slides.length - 1 ? setStep(step + 1) : navigate(destination, { replace: true })}>{step === slides.length - 1 ? 'Enter dashboard' : 'Next'} <ArrowRight /></button></div></footer>
  </main>;
}

function TourVisual({ tone, role }) {
  if (tone === 'wallet') return <div className="tour-visual wallet-visual"><div className="tour-wallet"><header><span><WalletCards /> REKO WALLET</span><Eye /></header><small>AVAILABLE BALANCE</small><strong>₦24,560.00</strong><div><span><TrendingMark /> +₦9,750 this month</span><button>Withdraw <ArrowRight /></button></div></div><article><span><Banknote /></span><div><small>PICKUP PAID</small><b>+₦5,250</b></div><Check /></article></div>;
  if (tone === 'pickup') return <div className="tour-visual pickup-visual"><div className="tour-map"><div className="tour-roads" /><span className="tour-user-pin"><Navigation /></span><span className="tour-collector-pin"><Truck /></span><i /><i /></div><article><span>MA</span><div><small>{role === 'collector' ? 'NEAREST REQUEST' : 'YOUR COLLECTOR'}</small><b>{role === 'collector' ? 'Metal · 0.8 km away' : 'Musa is 12 min away'}</b><p><StarMark /> 4.9 · Verified</p></div><button><Phone /></button></article><div className="tour-timeline"><span className="done"><Check /> Booked</span><i /><span className="active"><Truck /> On the way</span><i /><span><Recycle /> Complete</span></div></div>;
  return <div className="tour-visual impact-visual"><div className="tour-impact-ring"><div><strong>184</strong><span>kg</span><small>recycled</small></div></div><div className="tour-impact-stats"><article><Leaf /><span><small>CO₂ AVOIDED</small><b>92 kg</b></span></article><article><Zap /><span><small>ENERGY SAVED</small><b>368 kWh</b></span></article><article><Sparkles /><span><small>COMMUNITY RANK</small><b>Top 8%</b></span></article></div><span className="tour-milestone"><Check /> New milestone unlocked</span></div>;
}

function TrendingMark() { return <Zap />; }
function StarMark() { return <Sparkles />; }
