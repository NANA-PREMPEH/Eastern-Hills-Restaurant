import { CAR_FLEET, CarListing } from '../data/carFleet';

const CAR_FLEET_STORAGE_KEY = 'eastern_hills_car_fleet';

const isBrowser = () => typeof window !== 'undefined';

type StoredCarListing = Omit<CarListing, 'enabled'> & { enabled?: boolean };

const isCarListing = (value: unknown): value is StoredCarListing => {
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
    (typeof listing.enabled === 'boolean' || typeof listing.enabled === 'undefined') &&
    (typeof listing.image === 'string' || typeof listing.image === 'undefined') &&
    typeof listing.emoji === 'string' &&
    typeof listing.colorClass === 'string'
  );
};

const normalizeCarListing = (listing: StoredCarListing): CarListing => ({
  ...listing,
  enabled: listing.enabled !== false,
});

const normalizeFleet = (value: unknown) => {
  if (!Array.isArray(value)) {
    return CAR_FLEET;
  }

  const fleet = value.filter(isCarListing).map(normalizeCarListing);
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
