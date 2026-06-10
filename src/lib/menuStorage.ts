import { MenuItem } from '../types';

const DB_NAME = 'eastern-hills-storage';
const DB_VERSION = 1;
const STORE_NAME = 'app';
const MENU_STORAGE_KEY = 'menu_items';
const LEGACY_MENU_STORAGE_KEY = 'sabor_menu_items';

const isBrowser = () => typeof window !== 'undefined';

const requestToPromise = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });

const transactionToPromise = (transaction: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.'));
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
  });

const openDatabase = async () => {
  if (!isBrowser() || !window.indexedDB) {
    return null;
  }

  const request = window.indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      database.createObjectStore(STORE_NAME);
    }
  };

  return requestToPromise<IDBDatabase>(request);
};

const readFromIndexedDB = async () => {
  const database = await openDatabase();
  if (!database) {
    return null;
  }

  try {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(MENU_STORAGE_KEY);
    const result = await requestToPromise<MenuItem[] | undefined>(request);
    await transactionToPromise(transaction);
    return result ?? null;
  } finally {
    database.close();
  }
};

const writeToIndexedDB = async (menuItems: MenuItem[]) => {
  const database = await openDatabase();
  if (!database) {
    throw new Error('IndexedDB is unavailable in this browser.');
  }

  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(menuItems, MENU_STORAGE_KEY);
    await transactionToPromise(transaction);
  } finally {
    database.close();
  }
};

const readFromLocalStorage = () => {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(LEGACY_MENU_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MenuItem[]) : null;
  } catch (error) {
    console.error('Unable to parse saved menu from localStorage.', error);
    return null;
  }
};

const writeToLocalStorage = (menuItems: MenuItem[]) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(LEGACY_MENU_STORAGE_KEY, JSON.stringify(menuItems));
};

export const loadMenuItems = async (defaultMenu: MenuItem[]) => {
  try {
    const indexedDbMenu = await readFromIndexedDB();
    if (indexedDbMenu !== null) {
      return indexedDbMenu;
    }
  } catch (error) {
    console.error('Unable to load menu from IndexedDB.', error);
  }

  const localMenu = readFromLocalStorage();
  if (localMenu !== null) {
    try {
      await writeToIndexedDB(localMenu);
    } catch (error) {
      console.error('Unable to migrate menu from localStorage to IndexedDB.', error);
    }
    return localMenu;
  }

  await saveMenuItems(defaultMenu);
  return defaultMenu;
};

export const saveMenuItems = async (menuItems: MenuItem[]) => {
  let indexedDbSaved = false;

  try {
    await writeToIndexedDB(menuItems);
    indexedDbSaved = true;
  } catch (error) {
    console.error('Unable to save menu to IndexedDB.', error);
  }

  try {
    writeToLocalStorage(menuItems);
  } catch (error) {
    if (!indexedDbSaved) {
      throw error;
    }
    console.warn('Menu saved to IndexedDB, but localStorage mirror failed.', error);
  }

  if (!indexedDbSaved && !isBrowser()) {
    throw new Error('Menu storage is unavailable.');
  }
};
