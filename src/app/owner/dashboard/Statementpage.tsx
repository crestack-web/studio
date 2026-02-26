'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useApp } from './AppContext';
import styles from './Statementpage.module.css';

// ═══════════════════════════════════════════
//  StatementPage
//  Verified business financial statement
//  — printable & PDF-downloadable
//  — used for loan / investment applications
// ═══════════════════════════════════════════

const PERIODS = ['January 2026','February 2026','Last 3 Months','Last 6 Months','Full Year 2025'];
const STATEMENT_TYPES = ['Full Summary','Sales Only','Expenses Only','Stock Movement','Profit & Loss'];

const LEDGER = [
  { date: 'Feb 17', ref: 'TXN-00941', type: 'Sale',    desc: 'Walk-in sale — 2× Polo Co-Ord',    debit: '',        credit: '₦52,000', balance: '₦100,600' },
  { date: 'Feb 16', ref: 'TXN-00940', type: 'Sale',    desc: 'Online order #1048 — School Bag',   debit: '',        credit: '₦10,000', balance: '₦48,600' },
  { date: 'Feb 15', ref: 'EXP-00215', type: 'Expense', desc: 'Restocking — 20× Sabuni Bar',       debit: '₦40,000', credit: '',        balance: '₦38,600' },
  { date: 'Feb 14', ref: 'TXN-00938', type: 'Sale',    desc: 'Online order #1046 — Polo Co-Ord',  debit: '',        credit: '₦26,000', balance: '₦78,600' },
  { date: 'Feb 12', ref: 'DRW-00031', type: 'Drawing', desc: 'Owner withdrawal',                  debit: '₦5,000',  credit: '',        balance: '₦52,600' },
  { date: 'Feb 10', ref: 'TXN-00935', type: 'Sale',    desc: 'Online order #1040 — The Proof Is You', debit: '',   credit: '₦5,000',  balance: '₦57,600' },
  { date: 'Feb 08', ref: 'EXP-00212', type: 'Expense', desc: 'Rent — February 2026',               debit: '₦8,000', credit: '',        balance: '₦52,600' },
];

const STOCK_SUMMARY = [
  { product: 'Premium Ribbed Polo Co-Ord', open: 32, sold: 4,  loss: 0, restock: 2,  close: 30, value: '₦78,000' },
  { product: 'School Bag',                 open: 22, sold: 2,  loss: 0, restock: 0,  close: 20, value: '₦20,000' },
  { product: 'The Proof Is You',           open: 16, sold: 1,  loss: 0, restock: 0,  close: 15, value: '₦7,500'  },
  { product: 'Sabuni Premium Bar',         open: 20, sold: 0,  loss: 0, restock: 20, close: 40, value: '₦24,000' },
];

interface BusinessInfo {
  businessName: string;
  busmoId: string;
  ownerName: string;
  category: string;
  country: string;
  period: string;
  type: string;
}

const BUSINESS: BusinessInfo = {
  businessName: 'Fashion Spark',
  busmoId:      'BSM-2841-9034',
  ownerName:    'Abdullahi Usman',
  category:     'Fashion & Clothing',
  country:      'Niger · Nigeria',
  period:       'February 2026',
  type:         'Full Summary',
};

export function StatementPage() {
  const { showToast } = useApp();
  const printRef = useRef<HTMLDivElement>(null);
  const [period, setPeriod] = useState(BUSINESS.period);
  const [stmtType, setStmtType] = useState(BUSINESS.type);
  const [downloading, setDownloading] = useState(false);

  const stmtId = 'STMT-FS-2026-02';
  const generatedDate = new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

  const handlePrint = useCallback(() => {
    const printContents = printRef.current?.innerHTML || '';
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Busmo Statement — ${BUSINESS.businessName} — ${period}</title>
          <meta charset="UTF-8"/>
          <link rel="preconnect" href="https://fonts.googleapis.com"/>
          <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
          <style>
            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'DM Sans', sans-serif; color: #1C1917; background: #fff; font-size: 12px; line-height: 1.6; }
            .doc-wrap { max-width: 840px; margin: 0 auto; padding: 40px; }

            /* Header */
            .doc-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 3px solid #1C1917; margin-bottom: 24px; }
            .doc-logo { font-size: 28px; font-weight: 900; letter-spacing: -1px; color: #6C21E8; }
            .doc-logo-sub { font-size: 11px; color: #847E74; margin-top: 3px; }
            .doc-stamp { background: #1A7A50; color: #fff; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 700; text-align: center; }
            .doc-stamp-sub { font-size: 10px; color: #847E74; margin-top: 5px; text-align: right; }

            /* Meta grid */
            .doc-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 20px; background: #F4F3F0; border-radius: 10px; margin-bottom: 24px; }
            .doc-meta-item label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: #847E74; display: block; margin-bottom: 3px; }
            .doc-meta-item span { font-size: 13px; font-weight: 600; color: #1C1917; }

            /* Section titles */
            .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .8px; color: #847E74; margin: 28px 0 12px; padding-bottom: 8px; border-bottom: 1px solid #E4E1D8; }

            /* Summary stats */
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
            .stat-box { border: 1px solid #E4E1D8; border-radius: 10px; padding: 14px 16px; }
            .stat-box label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #847E74; display: block; margin-bottom: 6px; }
            .stat-box .val { font-size: 18px; font-weight: 800; font-family: 'DM Mono', monospace; }
            .stat-box .chg { font-size: 10px; color: #1A7A50; margin-top: 3px; }
            .green { color: #1A7A50; }
            .red   { color: #C0392B; }
            .purple { color: #6C21E8; }

            /* P&L table */
            .pl-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px; }
            .pl-table tr { border-bottom: 1px solid #E4E1D8; }
            .pl-table tr:last-child { border-bottom: none; }
            .pl-table td { padding: 9px 0; }
            .pl-table td:last-child { text-align: right; font-family: 'DM Mono', monospace; font-weight: 600; }
            .pl-total { border-top: 2px solid #1C1917 !important; }
            .pl-total td { font-weight: 800; font-size: 14px; padding-top: 12px; }

            /* Ledger */
            .ledger-table { width: 100%; border-collapse: collapse; font-size: 11px; }
            .ledger-table thead tr { border-bottom: 2px solid #1C1917; }
            .ledger-table th { padding: 8px 6px; text-align: left; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; color: #847E74; }
            .ledger-table tbody tr { border-bottom: 1px solid #E4E1D8; }
            .ledger-table td { padding: 8px 6px; }
            .ledger-table .mono { font-family: 'DM Mono', monospace; }
            .type-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .3px; }
            .type-sale    { background: #E6F5EE; color: #1A7A50; }
            .type-expense { background: #FDECEA; color: #C0392B; }
            .type-drawing { background: #FEF3C7; color: #B45309; }

            /* Stock */
            .stock-table { width: 100%; border-collapse: collapse; font-size: 11px; }
            .stock-table th { padding: 8px 6px; text-align: right; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; color: #847E74; border-bottom: 2px solid #1C1917; }
            .stock-table th:first-child { text-align: left; }
            .stock-table td { padding: 8px 6px; text-align: right; font-family: 'DM Mono', monospace; border-bottom: 1px solid #E4E1D8; }
            .stock-table td:first-child { text-align: left; font-family: 'DM Sans', sans-serif; font-weight: 500; }

            /* Footer */
            .doc-footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E4E1D8; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #847E74; }
            .verify-box { border: 1px solid #1A7A50; border-radius: 8px; padding: 12px 16px; background: #E6F5EE; font-size: 11px; color: #1A7A50; margin-bottom: 24px; }
            .verify-box strong { display: block; margin-bottom: 4px; font-size: 12px; }

            @media print {
              @page { margin: 18mm 15mm; }
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="doc-wrap">
            ${printContents}
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.onload = () => { win.print(); win.close(); };
  }, [period]);

  async function handleDownload() {
    setDownloading(true);
    showToast('📄 Preparing PDF…');
    await new Promise(r => setTimeout(r, 400));
    handlePrint();
    setDownloading(false);
    showToast('✅ Choose "Save as PDF" in the print dialog');
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Summary & Statement</h1>
      <p className={styles.sub}>Your verified business financial record. All data is sourced from transactions recorded on Busmo. This statement carries a Busmo verification stamp and can be used for loan applications, business registration, and partner verification.</p>

      {/* ── FILTERS + ACTIONS ── */}
      <div className={styles.filterBar}>
        <div className={styles.filterLeft}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Period</label>
            <select className={styles.filterSelect} value={period} onChange={e => setPeriod(e.target.value)}>
              {PERIODS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Statement Type</label>
            <select className={styles.filterSelect} value={stmtType} onChange={e => setStmtType(e.target.value)}>
              {STATEMENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className={styles.filterActions}>
          <button className={styles.btnGhost} onClick={handlePrint}>
            <PrintIcon /> Print
          </button>
          <button className={styles.btnPrimary} onClick={handleDownload} disabled={downloading}>
            <DownloadIcon /> {downloading ? 'Preparing…' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* ── VERIFICATION BANNER ── */}
      <div className={styles.verifyBanner}>
        <span className={styles.verifyCheck}>✅</span>
        <div>
          <strong>Busmo Verified Statement.</strong> All figures are sourced directly from transactions recorded on Busmo. This document is cryptographically stamped and can be verified by third parties at <strong>busmo.io/verify</strong> using Statement ID: <strong className={styles.mono}>{stmtId}</strong>
        </div>
      </div>

      {/* ── SUMMARY KPIs ── */}
      <div className={styles.kpiGrid}>
        {[
          { label: 'Total Revenue',      value: '₦54,000',  change: '↑ 18% vs last month', up: true  },
          { label: 'Total Expenses',     value: '₦22,400',  change: '↑ 5% vs last month',  up: false },
          { label: 'Net Profit',         value: '₦31,600',  change: '↑ 28% vs last month', up: true  },
          { label: 'Closing Stock Value',value: '₦130,000', change: '→ 4 products tracked', up: null  },
        ].map(k => (
          <div key={k.label} className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{k.label}</div>
            <div className={styles.kpiValue} style={{ color: k.up === true ? 'var(--green,#1A7A50)' : k.up === false ? 'var(--red,#C0392B)' : 'var(--purple,#6C21E8)' }}>{k.value}</div>
            <div className={`${styles.kpiChange} ${k.up === true ? styles.kpiUp : k.up === false ? styles.kpiDown : styles.kpiFlat}`}>{k.change}</div>
          </div>
        ))}
      </div>

      {/* ─── PRINTABLE DOCUMENT ─────────────────────── */}
      {/* This div is rendered invisibly and fed to print window */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          {/* Header */}
          <div className="doc-header">
            <div>
              <div className="doc-logo">Busmo</div>
              <div className="doc-logo-sub">Verified Business Statement · busmo.io</div>
            </div>
            <div>
              <div className="doc-stamp">✓ Busmo Verified</div>
              <div className="doc-stamp-sub">Generated: {generatedDate}</div>
            </div>
          </div>

          {/* Meta */}
          <div className="doc-meta">
            <div className="doc-meta-item"><label>Business Name</label><span>{BUSINESS.businessName}</span></div>
            <div className="doc-meta-item"><label>Busmo ID</label><span>{BUSINESS.busmoId}</span></div>
            <div className="doc-meta-item"><label>Report Period</label><span>{period}</span></div>
            <div className="doc-meta-item"><label>Owner</label><span>{BUSINESS.ownerName}</span></div>
            <div className="doc-meta-item"><label>Category</label><span>{BUSINESS.category}</span></div>
            <div className="doc-meta-item"><label>Country</label><span>{BUSINESS.country}</span></div>
          </div>

          {/* Verify box */}
          <div className="verify-box">
            <strong>✅ Busmo Verified Statement</strong>
            All figures in this statement are sourced directly from transactions recorded on Busmo. Statement ID: <strong>{stmtId}</strong>. Verify at busmo.io/verify
          </div>

          {/* Stats */}
          <div className="section-title">Financial Summary — {period}</div>
          <div className="stats-grid">
            <div className="stat-box"><label>Total Revenue</label><div className="val green">₦54,000</div><div className="chg">↑ 18% vs prior period</div></div>
            <div className="stat-box"><label>Total Expenses</label><div className="val red">₦22,400</div><div className="chg" style={{color:'#C0392B'}}>↑ 5% vs prior period</div></div>
            <div className="stat-box"><label>Net Profit</label><div className="val purple">₦31,600</div><div className="chg">↑ 28% vs prior period</div></div>
            <div className="stat-box"><label>Closing Stock Value</label><div className="val">₦130,000</div><div className="chg">4 products tracked</div></div>
          </div>

          {/* P&L */}
          <div className="section-title">Profit & Loss Statement</div>
          <table className="pl-table">
            <tbody>
              <tr><td className="green" style={{fontWeight:600}}>Total Sales Revenue</td><td className="green">+ ₦54,000</td></tr>
              <tr><td className="red">Cost of Goods Sold (COGS)</td><td className="red">- ₦14,000</td></tr>
              <tr style={{borderBottom:'2px solid #E4E1D8'}}><td style={{fontWeight:700}}>Gross Profit</td><td style={{fontWeight:700}}>₦40,000</td></tr>
              <tr><td style={{paddingLeft:16,color:'#847E74'}}>Platform Commission (Busmo 10%)</td><td style={{color:'#847E74'}}>- ₦5,400</td></tr>
              <tr><td style={{paddingLeft:16,color:'#847E74'}}>Other Operating Expenses</td><td style={{color:'#847E74'}}>- ₦3,000</td></tr>
              <tr className="pl-total"><td className="purple" style={{fontWeight:800,fontSize:14}}>Net Profit (After All Costs)</td><td className="purple" style={{fontWeight:800,fontSize:14}}>₦31,600</td></tr>
              <tr><td style={{color:'#847E74'}}>Owner Drawings</td><td style={{color:'#847E74'}}>- ₦5,000</td></tr>
            </tbody>
          </table>

          {/* Ledger */}
          <div className="section-title">Transaction Ledger</div>
          <table className="ledger-table">
            <thead><tr><th>Date</th><th>Reference</th><th>Type</th><th>Description</th><th style={{textAlign:'right'}}>Debit</th><th style={{textAlign:'right'}}>Credit</th><th style={{textAlign:'right'}}>Balance</th></tr></thead>
            <tbody>
              {LEDGER.map((t, i) => (
                <tr key={i}>
                  <td className="mono">{t.date}</td>
                  <td className="mono" style={{color:'#847E74',fontSize:10}}>{t.ref}</td>
                  <td><span className={`type-badge type-${t.type.toLowerCase()}`}>{t.type}</span></td>
                  <td>{t.desc}</td>
                  <td className="mono" style={{textAlign:'right',color:'#C0392B'}}>{t.debit}</td>
                  <td className="mono" style={{textAlign:'right',color:'#1A7A50'}}>{t.credit}</td>
                  <td className="mono" style={{textAlign:'right',fontWeight:600}}>{t.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Stock */}
          <div className="section-title">Inventory Summary</div>
          <table className="stock-table">
            <thead><tr><th>Product</th><th>Opening</th><th>Sold</th><th>Loss</th><th>Restock</th><th>Closing</th><th>Value</th></tr></thead>
            <tbody>
              {STOCK_SUMMARY.map(s => (
                <tr key={s.product}>
                  <td>{s.product}</td>
                  <td>{s.open}</td>
                  <td style={{color:'#C0392B'}}>{s.sold > 0 ? `-${s.sold}` : '0'}</td>
                  <td style={{color:'#C0392B'}}>{s.loss > 0 ? `-${s.loss}` : '0'}</td>
                  <td style={{color:'#1A7A50'}}>{s.restock > 0 ? `+${s.restock}` : '0'}</td>
                  <td style={{fontWeight:700}}>{s.close}</td>
                  <td style={{fontWeight:700,color:'#6C21E8'}}>{s.value}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{borderTop:'2px solid #1C1917'}}>
                <td style={{fontWeight:800}}>Total</td>
                <td colSpan={5} style={{textAlign:'right',fontWeight:800}}>Closing Stock Value</td>
                <td style={{fontWeight:800,color:'#6C21E8'}}>₦129,500</td>
              </tr>
            </tfoot>
          </table>

          {/* Footer */}
          <div className="doc-footer">
            <div>
              <div>{BUSINESS.businessName} · {BUSINESS.busmoId}</div>
              <div>Statement ID: {stmtId} · Generated {generatedDate}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div>Verified by Busmo Technology Ltd</div>
              <div>busmo.io/verify · support@busmo.io</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ON-SCREEN P&L ── */}
      <div className={styles.sectionTitle}>Profit & Loss Summary — {period}</div>
      <div className={styles.card}>
        <table className={styles.plTable}>
          <tbody>
            <tr><td className={styles.plGreen}>Total Sales Revenue</td><td className={`${styles.plAmt} ${styles.plGreen}`}>+ ₦54,000</td></tr>
            <tr><td className={styles.plRed}>Cost of Goods Sold (COGS)</td><td className={`${styles.plAmt} ${styles.plRed}`}>- ₦14,000</td></tr>
            <tr className={styles.plDivider}><td style={{fontWeight:700}}>Gross Profit</td><td className={`${styles.plAmt}`} style={{fontWeight:700}}>₦40,000</td></tr>
            <tr><td className={styles.plIndent}>Platform Commission (Busmo 10%)</td><td className={`${styles.plAmt} ${styles.plMuted}`}>- ₦5,400</td></tr>
            <tr><td className={styles.plIndent}>Other Operating Expenses</td><td className={`${styles.plAmt} ${styles.plMuted}`}>- ₦3,000</td></tr>
            <tr className={styles.plTotal}><td>Net Profit (After All Costs)</td><td className={`${styles.plAmt} ${styles.plPurple}`}>₦31,600</td></tr>
            <tr><td className={styles.plMuted}>Owner Drawings</td><td className={`${styles.plAmt} ${styles.plMuted}`}>- ₦5,000</td></tr>
          </tbody>
        </table>
      </div>

      {/* ── ON-SCREEN LEDGER ── */}
      <div className={styles.sectionTitle}>Transaction Ledger</div>
      <div className={styles.tableWrap}>
        <div className={styles.tableTop}>
          <select className={styles.tableFilter}>
            <option>All transactions</option>
            <option>Sales only</option>
            <option>Expenses only</option>
            <option>Stock movements</option>
          </select>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.ledgerTable}>
            <thead>
              <tr>
                <th>Date</th><th>Reference</th><th>Type</th><th>Description</th>
                <th className={styles.right}>Debit</th><th className={styles.right}>Credit</th><th className={styles.right}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {LEDGER.map((t, i) => (
                <tr key={i}>
                  <td className={styles.mono}>{t.date}</td>
                  <td className={`${styles.mono} ${styles.muted} ${styles.tiny}`}>{t.ref}</td>
                  <td><span className={`${styles.pill} ${t.type === 'Sale' ? styles.pillGreen : t.type === 'Expense' ? styles.pillRed : styles.pillAmber}`}>{t.type}</span></td>
                  <td>{t.desc}</td>
                  <td className={`${styles.mono} ${styles.right} ${styles.debit}`}>{t.debit}</td>
                  <td className={`${styles.mono} ${styles.right} ${styles.credit}`}>{t.credit}</td>
                  <td className={`${styles.mono} ${styles.right}`} style={{fontWeight:600}}>{t.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── STOCK SUMMARY ── */}
      <div className={styles.sectionTitle}>Inventory Summary</div>
      <div className={styles.tableWrap} style={{ marginBottom: 40 }}>
        <div className={styles.tableScroll}>
          <table className={styles.stockTable}>
            <thead>
              <tr>
                <th>Product</th><th className={styles.right}>Opening</th><th className={styles.right}>Sold</th>
                <th className={styles.right}>Loss</th><th className={styles.right}>Restock</th>
                <th className={styles.right}>Closing</th><th className={styles.right}>Value</th>
              </tr>
            </thead>
            <tbody>
              {STOCK_SUMMARY.map(s => (
                <tr key={s.product}>
                  <td>{s.product}</td>
                  <td className={`${styles.mono} ${styles.right}`}>{s.open}</td>
                  <td className={`${styles.mono} ${styles.right} ${s.sold > 0 ? styles.debit : styles.muted}`}>{s.sold > 0 ? `-${s.sold}` : '0'}</td>
                  <td className={`${styles.mono} ${styles.right} ${s.loss > 0 ? styles.debit : styles.muted}`}>{s.loss > 0 ? `-${s.loss}` : '0'}</td>
                  <td className={`${styles.mono} ${styles.right} ${s.restock > 0 ? styles.credit : styles.muted}`}>{s.restock > 0 ? `+${s.restock}` : '0'}</td>
                  <td className={`${styles.mono} ${styles.right}`} style={{fontWeight:700}}>{s.close}</td>
                  <td className={`${styles.mono} ${styles.right}`} style={{fontWeight:700,color:'var(--purple,#6C21E8)'}}>{s.value}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={styles.stockFooter}>
                <td style={{fontWeight:800}}>Total</td>
                <td colSpan={5} className={`${styles.right}`} style={{fontWeight:800}}>Closing Stock Value</td>
                <td className={`${styles.mono} ${styles.right}`} style={{fontWeight:800,color:'var(--purple,#6C21E8)'}}>₦129,500</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function PrintIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{width:13,height:13}}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>;
}
function DownloadIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{width:13,height:13}}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
