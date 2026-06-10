/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MenuItem } from './types';
import { DEFAULT_MENU } from './data/defaultMenu';
import MenuCustomerView from './components/MenuCustomerView';
import AdminPortal from './components/AdminPortal';
import { loadMenuItems, saveMenuItems } from './lib/menuStorage';
import { fetchRemoteMenuItems, MenuApiUnavailableError, saveRemoteMenuItems } from './lib/menuApi';

export default function App() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminSessionPin, setAdminSessionPin] = useState<string | null>(null);

  const isLocalDevelopment =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  useEffect(() => {
    let isCancelled = false;

    const initializeMenu = async () => {
      try {
        const remoteMenu = await fetchRemoteMenuItems();
        if (!isCancelled) {
          setMenuItems(remoteMenu);
        }
        try {
          await saveMenuItems(remoteMenu);
        } catch (error) {
          console.warn('Unable to refresh the local mirror from the remote menu.', error);
        }
        return;
      } catch (error) {
        if (!(error instanceof MenuApiUnavailableError)) {
          console.error('Error loading remote menu.', error);
        }
      }

      try {
        const storedMenu = await loadMenuItems(DEFAULT_MENU);
        if (!isCancelled) {
          setMenuItems(storedMenu);
        }
      } catch (error) {
        console.error('Error loading saved menu, resetting to default.', error);
        if (!isCancelled) {
          setMenuItems(DEFAULT_MENU);
        }
      }
    };

    void initializeMenu();

    return () => {
      isCancelled = true;
    };
  }, []);

  const saveAndSetMenu = async (updatedMenu: MenuItem[], previousMenu: MenuItem[]) => {
    setMenuItems(updatedMenu);
    let savedRemotely = false;

    try {
      if (adminSessionPin) {
        try {
          await saveRemoteMenuItems(updatedMenu, adminSessionPin);
          savedRemotely = true;
        } catch (error) {
          if (!(error instanceof MenuApiUnavailableError) || !isLocalDevelopment) {
            throw error;
          }
        }
      }

      try {
        await saveMenuItems(updatedMenu);
      } catch (error) {
        if (savedRemotely) {
          console.warn('Remote save succeeded, but local mirror persistence failed.', error);
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error saving updated menu.', error);
      setMenuItems(previousMenu);
      throw error;
    }
  };

  const handleAddItem = async (newItem: MenuItem) => {
    const updated = [newItem, ...menuItems];
    await saveAndSetMenu(updated, menuItems);
  };

  const handleUpdateItem = async (updatedItem: MenuItem) => {
    const updated = menuItems.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    await saveAndSetMenu(updated, menuItems);
  };

  const handleDeleteItem = async (id: string) => {
    const updated = menuItems.filter(item => item.id !== id);
    await saveAndSetMenu(updated, menuItems);
  };

  return (
    <div className="font-sans antialiased text-slate-950 bg-slate-50 min-h-screen">
      {isAdminOpen ? (
        <AdminPortal 
          adminPin={adminSessionPin}
          menuItems={menuItems}
          onAdd={handleAddItem}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteItem}
          onClose={() => {
            setIsAdminOpen(false);
            setAdminSessionPin(null);
          }}
        />
      ) : (
        <MenuCustomerView 
          menuItems={menuItems}
          onOpenAdmin={(pin) => {
            setAdminSessionPin(pin);
            setIsAdminOpen(true);
          }}
        />
      )}
    </div>
  );
}
