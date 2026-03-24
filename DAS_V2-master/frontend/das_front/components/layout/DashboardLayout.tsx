import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="dashboard-layout">
    <Header />
    <Sidebar />
    <main>{children}</main>
  </div>
);
