'use client';

import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Badge,
  Banner,
  Card,
  Chips,
  Field,
  Kpi,
  PageHeader,
  Progress,
  SearchInput,
  Sheet,
  StatusBadge,
  TableWrap,
  Td,
  Th,
  useToast,
} from '../primitives';
import { Icon } from '../icons';
import { fmtDate, money } from '../format';
import { supplies, supplyStats } from './mock';
import type { SupplyItem, SupplyStatus } from '../types';

type Filter = 'all' | SupplyStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All supplies' },
  { id: 'low_stock', label: 'Low stock' },
  { id: 'out_of_stock', label: 'Out of stock' },
  { id: 'in_stock', label: 'In stock' },
];

function stockTone(item: SupplyItem): 'green' | 'amber' | 'red' {
  if (item.status === 'out_of_stock') return 'red';
  if (item.status === 'low_stock') return 'amber';
  return 'green';
}

export function HealthcareInventory() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<SupplyItem | null>(null);
  const [restock, setRestock] = useState<SupplyItem | null>(null);
  const [quantity, setQuantity] = useState('25');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return supplies
      .filter((s) => (filter === 'all' ? true : s.status === filter))
      .filter((s) =>
        q ? s.name.toLowerCase().includes(q) || s.supplier.toLowerCase().includes(q) : true,
      );
  }, [filter, query]);

  const critical = supplies.filter((s) => s.status !== 'in_stock');

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Supplies & inventory"
        subtitle="Pharmacy, consumables, laboratory stock and equipment levels."
        meta={
          <>
            <Badge tone={supplyStats.out ? 'red' : 'green'} dot>
              {supplyStats.out} out of stock
            </Badge>
            <span className="sol-small sol-muted">{supplyStats.items} tracked items</span>
          </>
        }
        actions={
          <button
            type="button"
            className="sol-btn sol-btn-primary"
            onClick={() => {
              setRestock(critical[0] || supplies[0]);
              setQuantity('25');
            }}
          >
            <Plus size={15} aria-hidden /> Restock item
          </button>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Tracked items" value={supplyStats.items} icon="box" foot="Across all categories" accent />
        <Kpi label="Low stock" value={supplyStats.low} icon="alert" foot="At or below reorder level" />
        <Kpi label="Out of stock" value={supplyStats.out} icon="bell" foot="Needs urgent restock" />
        <Kpi label="Inventory value" value={money(supplyStats.value)} icon="wallet" foot="At unit cost" />
      </div>

      {supplyStats.out ? (
        <div className="sol-mt-3">
          <Banner
            tone="red"
            icon="alert"
            title="Some items have run out"
            action={
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => setRestock(critical[0] || supplies[0])}
              >
                Restock now
              </button>
            }
          >
            {supplies
              .filter((s) => s.status === 'out_of_stock')
              .map((s) => s.name)
              .join(', ')}{' '}
            need reordering before the next clinic session.
          </Banner>
        </div>
      ) : null}

      <Card className="sol-mt-4" flush>
        <div className="sol-card-body" style={{ paddingBottom: 0 }}>
          <div className="sol-toolbar">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search supplies or supplier…"
              ariaLabel="Search supplies"
            />
            <Chips
              items={FILTERS.map((f) => ({
                ...f,
                count:
                  f.id === 'all' ? supplies.length : supplies.filter((s) => s.status === f.id).length,
              }))}
              value={filter}
              onChange={setFilter}
            />
          </div>
        </div>

        <TableWrap>
          <table className="sol-table">
            <thead>
              <tr>
                <Th>Item</Th>
                <Th>Category</Th>
                <Th>Stock level</Th>
                <Th>Supplier</Th>
                <Th>Last restock</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} data-clickable="true" onClick={() => setSelected(s)}>
                  <Td>
                    <div className="sol-list-title">{s.name}</div>
                    <div className="sol-list-sub">{s.unit}</div>
                  </Td>
                  <Td className="muted">{s.category}</Td>
                  <Td>
                    <div className="sol-between">
                      <span className="sol-small">
                        <strong className="sol-num">{s.stock}</strong> / reorder {s.reorder_level}
                      </span>
                      <span className="sol-small sol-muted">{s.unit}</span>
                    </div>
                    <div className="sol-mt-2">
                      <Progress
                        value={Math.min(100, (s.stock / Math.max(1, s.reorder_level * 2)) * 100)}
                        tone={stockTone(s)}
                        label={`${s.name} stock level`}
                      />
                    </div>
                  </Td>
                  <Td className="muted">{s.supplier}</Td>
                  <Td className="muted">{fmtDate(s.last_restock)}</Td>
                  <Td>
                    <StatusBadge status={s.status} />
                  </Td>
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <Td colSpan={6}>
                    <div className="sol-empty">
                      <span className="sol-empty-icon">
                        <Icon name="box" size={20} />
                      </span>
                      <h4>No supplies match this view</h4>
                      <p>Try a different search term or filter.</p>
                    </div>
                  </Td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name || 'Supply item'}
        subtitle={selected ? `${selected.category} · ${selected.unit}` : undefined}
        width={420}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setSelected(null)}>
              Close
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => {
                setRestock(selected);
                setQuantity(String(Math.max(selected?.reorder_level || 10, 25)));
                setSelected(null);
              }}
            >
              <Icon name="plus" size={15} /> Restock
            </button>
          </>
        }
      >
        {selected ? (
          <div className="sol-stack-3">
            <div className="sol-row sol-between">
              <div>
                <div className="sol-person-name">{selected.name}</div>
                <div className="sol-person-sub">{selected.supplier}</div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="sol-kv">
              <div className="sol-kv-row">
                <span>In stock</span>
                <strong>
                  {selected.stock} {selected.unit}
                </strong>
              </div>
              <div className="sol-kv-row">
                <span>Reorder level</span>
                <strong>{selected.reorder_level}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Unit cost</span>
                <strong>{money(selected.unit_cost)}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Stock value</span>
                <strong>{money(selected.stock * selected.unit_cost)}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Last restocked</span>
                <strong>{fmtDate(selected.last_restock, { year: true })}</strong>
              </div>
            </div>

            <div>
              <div className="sol-between">
                <span className="sol-small sol-muted">Stock vs reorder threshold</span>
                <span className="sol-small">
                  {selected.stock} / {selected.reorder_level}
                </span>
              </div>
              <div className="sol-mt-2">
                <Progress
                  value={Math.min(100, (selected.stock / Math.max(1, selected.reorder_level * 2)) * 100)}
                  tone={stockTone(selected)}
                  label={`${selected.name} stock level`}
                />
              </div>
            </div>

            <button
              type="button"
              className="sol-btn sol-btn-subtle sol-btn-sm"
              onClick={() => toast(`Purchase order drafted for ${selected.name}.`)}
            >
              <Icon name="receipt" size={14} /> Draft purchase order
            </button>
          </div>
        ) : null}
      </Sheet>

      <Sheet
        open={!!restock}
        onClose={() => setRestock(null)}
        title="Restock supplies"
        subtitle={restock ? restock.name : undefined}
        width={420}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setRestock(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => {
                if (restock) {
                  toast(`${quantity} ${restock.unit} of ${restock.name} added to stock.`);
                }
                setRestock(null);
              }}
            >
              <Icon name="check" size={15} /> Add to stock
            </button>
          </>
        }
      >
        {restock ? (
          <div className="sol-form-grid">
            <Field label="Item" className="full">
              <input className="sol-input" value={restock.name} readOnly />
            </Field>
            <Field label="Quantity">
              <input
                type="number"
                min={1}
                className="sol-input"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </Field>
            <Field label="Supplier">
              <input className="sol-input" value={restock.supplier} readOnly />
            </Field>
            <Field label="Estimated cost" className="full">
              <input
                className="sol-input"
                value={money(Number(quantity || 0) * restock.unit_cost)}
                readOnly
              />
            </Field>
          </div>
        ) : null}
      </Sheet>
    </>
  );
}
