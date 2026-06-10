/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MenuItem } from './types';
import { DEFAULT_MENU } from './data/defaultMenu';
import MenuCustomerView from './components/MenuCustomerView';
import AdminPortal from './components/AdminPortal';

export default function App() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Initialize and load state from localStorage or DEFAULT_MENU seeds
  useEffect(() => {
    const savedMenu = localStorage.getItem('sabor_menu_items');
    if (savedMenu) {
      try {
        setMenuItems(JSON.parse(savedMenu));
      } catch (e) {
        console.error('Error loading saved menu, resetting to default', e);
        setMenuItems(DEFAULT_MENU);
        localStorage.setItem('sabor_menu_items', JSON.stringify(DEFAULT_MENU));
      }
    } else {
      setMenuItems(DEFAULT_MENU);
      localStorage.setItem('sabor_menu_items', JSON.stringify(DEFAULT_MENU));
    }
  }, []);

  // Handler to sync menuItems array state and write to persist storage
  const saveAndSetMenu = (updatedMenu: MenuItem[]) => {
    setMenuItems(updatedMenu);
    localStorage.setItem('sabor_menu_items', JSON.stringify(updatedMenu));
  };

  const handleAddItem = (newItem: MenuItem) => {
    const updated = [newItem, ...menuItems];
    saveAndSetMenu(updated);
  };

  const handleUpdateItem = (updatedItem: MenuItem) => {
    const updated = menuItems.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    saveAndSetMenu(updated);
  };

  const handleDeleteItem = (id: string) => {
    const updated = menuItems.filter(item => item.id !== id);
    saveAndSetMenu(updated);
  };

  return (
    <div className="font-sans antialiased text-slate-950 bg-slate-50 min-h-screen">
      {isAdminOpen ? (
        <AdminPortal 
          menuItems={menuItems}
          onAdd={handleAddItem}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteItem}
          onClose={() => setIsAdminOpen(false)}
        />
      ) : (
        <MenuCustomerView 
          menuItems={menuItems}
          onOpenAdmin={() => setIsAdminOpen(true)}
        />
      )}
    </div>
  );
}
