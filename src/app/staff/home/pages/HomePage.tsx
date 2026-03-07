import React from 'react';
import type { Permissions } from '../types';

interface HomePageProps {
  permissions: Permissions;
  onChangePage: (page: string) => void;
}

export function HomePage({ permissions, onChangePage }: HomePageProps) {
  return (
    <div className="staff-home">
      <h2 className="staff-home__title">Welcome to Busmo Staff Portal</h2>
      <p className="staff-home__subtitle">Select an action from the sidebar to get started.</p>
      
      <div className="staff-home__grid">
        <button className="staff-home__card" onClick={() => onChangePage('sale')}>
          <span className="staff-home__card-icon">🛒</span>
          <span className="staff-home__card-title">Record Sale</span>
          <span className="staff-home__card-desc">Process customer transactions</span>
        </button>
        
        {permissions.inv && (
          <button className="staff-home__card" onClick={() => onChangePage('inv')}>
            <span className="staff-home__card-icon">📦</span>
            <span className="staff-home__card-title">Inventory</span>
            <span className="staff-home__card-desc">View stock levels</span>
          </button>
        )}
        
        {permissions.hist && (
          <button className="staff-home__card" onClick={() => onChangePage('hist')}>
            <span className="staff-home__card-icon">📜</span>
            <span className="staff-home__card-title">History</span>
            <span className="staff-home__card-desc">View sales history</span>
          </button>
        )}
        
        {permissions.atd && (
          <button className="staff-home__card" onClick={() => onChangePage('atd')}>
            <span className="staff-home__card-icon">📍</span>
            <span className="staff-home__card-title">Attendance</span>
            <span className="staff-home__card-desc">Clock in and out</span>
          </button>
        )}
      </div>
    </div>
  );
}
