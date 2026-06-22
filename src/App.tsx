/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { CAR_FLEET, CarListing } from './data/carFleet';
import { DEFAULT_MENU } from './data/defaultMenu';
import AdminPortal from './components/AdminPortal';
import AppLandingPage from './components/LandingPage';
import CarRentalAdminPortal from './components/CarRentalAdminPortal';
import CarRentalView from './components/CarRentalView';
import MenuCustomerView from './components/MenuCustomerView';
import {
  CarFleetApiUnavailableError,
  fetchRemoteCarFleet,
  saveRemoteCarFleet,
} from './lib/carFleetApi';
import { loadCarFleet, saveCarFleet } from './lib/carFleetStorage';
import { fetchRemoteMenuItems, MenuApiUnavailableError, saveRemoteMenuItems } from './lib/menuApi';
import { loadMenuItems, saveMenuItems } from './lib/menuStorage';
import { MenuItem } from './types';

type ActiveService = 'home' | 'restaurant' | 'car_rental';
type ActiveAdminPortal = 'car_rental' | 'restaurant' | null;

export default function App() {
  const [activeService, setActiveService] = useState<ActiveService>('home');
  const [activeAdminPortal, setActiveAdminPortal] = useState<ActiveAdminPortal>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [carFleet, setCarFleet] = useState<CarListing[]>(CAR_FLEET);
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

  useEffect(() => {
    let isCancelled = false;

    const initializeCarFleet = async () => {
      try {
        const remoteFleet = await fetchRemoteCarFleet();
        if (!isCancelled) {
          setCarFleet(remoteFleet);
        }

        try {
          await saveCarFleet(remoteFleet);
        } catch (error) {
          console.warn('Unable to refresh the local mirror from the remote car fleet.', error);
        }
        return;
      } catch (error) {
        if (!(error instanceof CarFleetApiUnavailableError)) {
          console.error('Error loading remote car fleet.', error);
        }
      }

      try {
        const storedFleet = await loadCarFleet(CAR_FLEET);
        if (!isCancelled) {
          setCarFleet(storedFleet);
        }
      } catch (error) {
        console.error('Error loading saved car fleet, resetting to default.', error);
        if (!isCancelled) {
          setCarFleet(CAR_FLEET);
        }
      }
    };

    void initializeCarFleet();

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

  const saveAndSetCarFleet = async (updatedFleet: CarListing[], previousFleet: CarListing[]) => {
    setCarFleet(updatedFleet);
    let savedRemotely = false;

    try {
      if (adminSessionPin) {
        try {
          await saveRemoteCarFleet(updatedFleet, adminSessionPin);
          savedRemotely = true;
        } catch (error) {
          if (!(error instanceof CarFleetApiUnavailableError) || !isLocalDevelopment) {
            throw error;
          }
        }
      }

      try {
        await saveCarFleet(updatedFleet);
      } catch (error) {
        if (savedRemotely) {
          console.warn('Remote save succeeded, but local car fleet mirror persistence failed.', error);
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error saving updated car fleet.', error);
      setCarFleet(previousFleet);
      throw error;
    }
  };

  const handleAddItem = async (newItem: MenuItem) => {
    const updated = [newItem, ...menuItems];
    await saveAndSetMenu(updated, menuItems);
  };

  const handleUpdateItem = async (updatedItem: MenuItem) => {
    const updated = menuItems.map((item) => (item.id === updatedItem.id ? updatedItem : item));
    await saveAndSetMenu(updated, menuItems);
  };

  const handleDeleteItem = async (id: string) => {
    const updated = menuItems.filter((item) => item.id !== id);
    await saveAndSetMenu(updated, menuItems);
  };

  const handleAddCar = async (newCar: CarListing) => {
    const updated = [newCar, ...carFleet];
    await saveAndSetCarFleet(updated, carFleet);
  };

  const handleUpdateCar = async (updatedCar: CarListing) => {
    const updated = carFleet.map((car) => (car.id === updatedCar.id ? updatedCar : car));
    await saveAndSetCarFleet(updated, carFleet);
  };

  const handleDeleteCar = async (id: string) => {
    const updated = carFleet.filter((car) => car.id !== id);
    await saveAndSetCarFleet(updated, carFleet);
  };

  if (activeService === 'car_rental') {
    if (activeAdminPortal === 'car_rental') {
      return (
        <CarRentalAdminPortal
          adminPin={adminSessionPin}
          carFleet={carFleet}
          onAdd={handleAddCar}
          onClose={() => {
            setActiveAdminPortal(null);
            setAdminSessionPin(null);
          }}
          onDelete={handleDeleteCar}
          onUpdate={handleUpdateCar}
        />
      );
    }

    return (
      <CarRentalView
        carFleet={carFleet}
        onBack={() => setActiveService('home')}
        onOpenAdmin={(pin) => {
          setAdminSessionPin(pin);
          setActiveAdminPortal('car_rental');
        }}
        onGoToRestaurant={() => setActiveService('restaurant')}
      />
    );
  }

  if (activeService === 'restaurant') {
    if (activeAdminPortal === 'restaurant') {
      return (
        <AdminPortal
          adminPin={adminSessionPin}
          menuItems={menuItems}
          onAdd={handleAddItem}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteItem}
          onClose={() => {
            setActiveAdminPortal(null);
            setAdminSessionPin(null);
          }}
        />
      );
    }

    return (
      <MenuCustomerView
        menuItems={menuItems}
        onOpenAdmin={(pin) => {
          setAdminSessionPin(pin);
          setActiveAdminPortal('restaurant');
        }}
        onGoHome={() => setActiveService('home')}
        onGoToCarRental={() => setActiveService('car_rental')}
      />
    );
  }

  return <AppLandingPage onSelectService={setActiveService} />;
}
