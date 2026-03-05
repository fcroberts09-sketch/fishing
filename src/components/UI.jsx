import React from 'react';
import { C, Fnt } from '../utils/theme';
import { XI } from './Icons';

export const Btn = ({ children, primary, small, danger, isMobile, ...p }) => (
  <button
    {...p}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      padding: small ? (isMobile ? '8px 14px' : '6px 12px') : (isMobile ? '12px 20px' : '10px 18px'),
      borderRadius: small ? (isMobile ? 8 : 6) : (isMobile ? 12 : 10),
      background: danger ? `${C.red}20` : primary ? `linear-gradient(135deg,${C.cyan},${C.teal})` : C.card2,
      color: danger ? C.red : primary ? C.bg : C.mid,
      border: `1px solid ${danger ? `${C.red}40` : primary ? 'transparent' : C.bdr}`,
      fontWeight: primary ? 700 : 500,
      fontSize: small ? (isMobile ? 13 : 12) : (isMobile ? 15 : 14),
      cursor: 'pointer', fontFamily: Fnt, minHeight: isMobile ? 44 : 0,
      ...(p.style || {}),
    }}
  >
    {children}
  </button>
);

export const Lbl = ({ children }) => (
  <div style={{ fontSize: 10, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 6 }}>
    {children}
  </div>
);

export const Inp = ({ label, isMobile, ...p }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <Lbl>{label}</Lbl>}
    <input
      {...p}
      style={{
        width: '100%', padding: isMobile ? '12px 14px' : '10px 14px', borderRadius: 8,
        background: C.card2, border: `1px solid ${C.bdr}`, color: C.txt,
        fontSize: isMobile ? 16 : 13, fontFamily: Fnt, outline: 'none', minHeight: isMobile ? 44 : 0,
        ...(p.style || {}),
      }}
    />
  </div>
);

export const Sel = ({ label, options, isMobile, ...p }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <Lbl>{label}</Lbl>}
    <select
      {...p}
      style={{
        width: '100%', padding: isMobile ? '12px 14px' : '10px 14px', borderRadius: 8,
        background: C.card2, border: `1px solid ${C.bdr}`, color: C.txt,
        fontSize: isMobile ? 16 : 13, fontFamily: Fnt, minHeight: isMobile ? 44 : 0,
        ...(p.style || {}),
      }}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

export const Badge = ({ color, children }) => (
  <span style={{ padding: '3px 10px', borderRadius: 6, background: `${color}20`, color, fontSize: 11, fontWeight: 600 }}>
    {children}
  </span>
);

export const Modal = ({ title, sub, onClose, wide, isMobile, children }) => (
  <div
    style={{ position: 'fixed', inset: 0, background: '#000a', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 0 : 20 }}
    onClick={onClose}
  >
    <div
      style={
        isMobile
          ? { background: C.card, borderRadius: '20px 20px 0 0', width: '100%', maxHeight: '90vh', overflow: 'auto' }
          : { background: C.card, borderRadius: 20, maxWidth: wide ? 800 : 560, width: '100%', maxHeight: '90vh', overflow: 'auto', border: `1px solid ${C.bdr2}` }
      }
      onClick={(e) => e.stopPropagation()}
    >
      {isMobile && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: C.bdr2 }} />
        </div>
      )}
      <div
        style={{
          padding: isMobile ? '12px 16px' : '16px 24px', borderBottom: `1px solid ${C.bdr}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: C.card, zIndex: 1,
          borderRadius: '20px 20px 0 0',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: isMobile ? 15 : 16 }}>{title}</div>
          {sub && <div style={{ fontSize: 12, color: C.mid }}>{sub}</div>}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', padding: 8 }}>
          <XI s={18} />
        </button>
      </div>
      <div style={{ padding: isMobile ? 16 : 24 }}>{children}</div>
    </div>
  </div>
);
