import { CAR_FLEET, CarListing } from '../data/carFleet';

const CAR_FLEET_STORAGE_KEY = 'eastern_hills_car_fleet';

const isBrowser = () => typeof window !== 'undefined';

const isCarListing = (value: unknown): value is CarListing => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const listing = value as Record<string, unknown>;
  return (
    typeof listing.id === 'string' &&
    typeof listing.name === 'string' &&
    typeof listing.type === 'string' &&
    typeof listing.dailyRate === 'number' &&
    typeof listing.seats === 'number' &&
    typeof listing.transmission === 'string' &&
    Array.isArray(listing.features) &&
    listing.features.every((feature) => typeof feature === 'string') &&
    (typeof listing.image === 'string' || typeof listing.image === 'undefined') &&
    typeof listing.emoji === 'string' &&
    typeof listing.colorClass === 'string'
  );
};

const normalizeFleet = (value: unknown) => {
  if (!Array.isArray(value)) {
    return CAR_FLEET;
  }

  const fleet = value.filter(isCarListing);
  return fleet.length > 0 ? fleet : CAR_FLEET;
};

export const loadCarFleet = async (defaultFleet: CarListing[] = CAR_FLEET) => {
  if (!isBrowser()) {
    return defaultFleet;
  }

  try {
    const raw = window.localStorage.getItem(CAR_FLEET_STORAGE_KEY);
    if (!raw) {
      await saveCarFleet(defaultFleet);
      return defaultFleet;
    }

    return normalizeFleet(JSON.parse(raw));
  } catch (error) {
    console.error('Unable to load saved car fleet.', error);
    return defaultFleet;
  }
};

export const saveCarFleet = async (fleet: CarListing[]) => {
  if (!isBrowser()) {
    throw new Error('Car fleet storage is unavailable.');
  }

  window.localStorage.setItem(CAR_FLEET_STORAGE_KEY, JSON.stringify(fleet));
};
