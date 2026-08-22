import React from 'react';
import { ArrowRight, LogOut, ShieldCheck, X } from 'lucide-react';

export default function LogoutDialog({ open, role, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="logout-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section className="logout-dialog" role="dialog" aria-modal="true" aria-labelledby="logout-title">
        <button className="logout-dialog-close" onClick={onCancel} aria-label="Close"><X /></button>
        <span className="logout-dialog-icon"><LogOut /></span>
        <span className="logout-role-pill">{role} account</span>
        <h2 id="logout-title">Ready to sign out?</h2>
        <p>Your current work is saved. You’ll need to sign in again to access this dashboard.</p>
        <div className="logout-security"><ShieldCheck /><span><b>Your account stays protected</b><small>Signing out removes this session from the device.</small></span></div>
        <div className="logout-actions">
          <button className="logout-cancel" onClick={onCancel}>Stay signed in</button>
          <button className="logout-confirm" onClick={onConfirm}><LogOut /> Sign out <ArrowRight /></button>
        </div>
      </section>
    </div>
  );
}
