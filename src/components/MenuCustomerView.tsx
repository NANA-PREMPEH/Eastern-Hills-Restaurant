/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { 
  ShoppingBag, Search, Plus, Minus, ArrowRight, MessageSquare, 
  Trash2, Sparkles, X, ChevronRight, CheckCircle2, Clock, 
  MapPin, ClipboardIcon, AlertCircle, RefreshCw, Star
} from 'lucide-react';
import { MenuItem, Category, CATEGORIES, CartItem, Order } from '../types';
import StaffAccessModal from './StaffAccessModal';

const WHATSAPP_PHONE_DISPLAY = '0541292381';
const WHATSAPP_PHONE_LINK = '233541292381';

interface MenuCustomerViewProps {
  menuItems: MenuItem[];
  onOpenAdmin: () => void;
}

export default function MenuCustomerView({ menuItems, onOpenAdmin }: MenuCustomerViewProps) {
  const envAdminPin = import.meta.env.VITE_ADMIN_PIN?.trim() ?? '';

  // Query parameters for table detection
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [diningOption, setDiningOption] = useState<'dine_in' | 'delivery'>('delivery');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Cart operations
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  // Active Checkout status
  const [sentOrders, setSentOrders] = useState<Order[]>([]);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [showBillboard, setShowBillboard] = useState(() => {
    return localStorage.getItem('sabor_show_billboard') !== 'false';
  });
  const [isStaffAccessOpen, setIsStaffAccessOpen] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminPinConfirmation, setAdminPinConfirmation] = useState('');
  const [adminErrorMessage, setAdminErrorMessage] = useState('');
  const [storedAdminPin, setStoredAdminPin] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    return window.localStorage.getItem('eastern_hills_admin_pin')?.trim() ?? '';
  });

  const tapCountRef = useRef(0);
  const tapResetTimerRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  const configuredAdminPin = envAdminPin || storedAdminPin;
  const hasConfiguredAdminPin = configuredAdminPin.length > 0;
  const usesEnvironmentPin = envAdminPin.length > 0;

  // Parse Table Number query parameter on initialization
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const table = params.get('table');
    if (table) {
      setTableNumber(table);
      setDiningOption('dine_in');
    }
    
    // Load sent orders log from local storage
    const saved = localStorage.getItem('sabor_sent_orders');
    if (saved) {
      try {
        setSentOrders(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing saved orders', e);
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        openStaffAccess();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTapResetTimer();
      clearLongPressTimer();
    };
  }, []);

  const clearTapResetTimer = () => {
    if (tapResetTimerRef.current !== null) {
      window.clearTimeout(tapResetTimerRef.current);
      tapResetTimerRef.current = null;
    }
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const resetStaffAccessForm = () => {
    setAdminPin('');
    setAdminPinConfirmation('');
    setAdminErrorMessage('');
  };

  const openStaffAccess = () => {
    clearTapResetTimer();
    clearLongPressTimer();
    tapCountRef.current = 0;
    resetStaffAccessForm();
    setIsStaffAccessOpen(true);
  };

  const closeStaffAccess = () => {
    clearTapResetTimer();
    clearLongPressTimer();
    tapCountRef.current = 0;
    resetStaffAccessForm();
    setIsStaffAccessOpen(false);
  };

  const handleHiddenAdminTap = () => {
    tapCountRef.current += 1;
    clearTapResetTimer();

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      openStaffAccess();
      return;
    }

    tapResetTimerRef.current = window.setTimeout(() => {
      tapCountRef.current = 0;
    }, 1200);
  };

  const handleSecretPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      tapCountRef.current = 0;
      openStaffAccess();
    }, 900);
  };

  const handleSecretPointerUp = () => {
    clearLongPressTimer();
  };

  const handleStaffAccessSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedPin = adminPin.trim();

    if (!normalizedPin) {
      setAdminErrorMessage('Enter the staff PIN to continue.');
      return;
    }

    if (!hasConfiguredAdminPin) {
      if (normalizedPin.length < 4) {
        setAdminErrorMessage('Create a staff PIN with at least 4 characters.');
        return;
      }

      if (normalizedPin !== adminPinConfirmation.trim()) {
        setAdminErrorMessage('The PIN confirmation does not match.');
        return;
      }

      window.localStorage.setItem('eastern_hills_admin_pin', normalizedPin);
      setStoredAdminPin(normalizedPin);
      closeStaffAccess();
      onOpenAdmin();
      return;
    }

    if (normalizedPin !== configuredAdminPin) {
      setAdminErrorMessage('That staff PIN is incorrect.');
      return;
    }

    closeStaffAccess();
    onOpenAdmin();
  };

  const addToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existing = prevCart.find(ci => ci.menuItem.id === item.id);
      if (existing) {
        return prevCart.map(ci => 
          ci.menuItem.id === item.id 
            ? { ...ci, quantity: ci.quantity + 1 } 
            : ci
        );
      }
      return [...prevCart, { menuItem: item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => {
      const existing = prevCart.find(ci => ci.menuItem.id === itemId);
      if (existing) {
        if (existing.quantity <= 1) {
          return prevCart.filter(ci => ci.menuItem.id !== itemId);
        }
        return prevCart.map(ci => 
          ci.menuItem.id === itemId 
            ? { ...ci, quantity: ci.quantity - 1 } 
            : ci
        );
      }
      return prevCart;
    });
  };

  const deleteFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(ci => ci.menuItem.id !== itemId));
  };

  const getCartCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  };

  // Pre-seed WhatsApp link generation with gorgeous templates
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!customerName.trim()) {
      alert('Please fill in your name first to help our staff recognize your order!');
      return;
    }

    const total = getCartTotal();
    const serviceLocation = diningOption === 'dine_in' ? (tableNumber || 'Table Service') : 'DELIVERY';
    
    // Create WhatsApp order log
    const newOrder: Order = {
      id: 'ord_' + Math.floor(Math.random() * 100000),
      customerName: customerName.trim(),
      tableNumber: diningOption === 'dine_in' ? serviceLocation : null,
      items: [...cart],
      totalAmount: total,
      notes: specialNotes.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'pending'
    };

    // Construct magnificent pre-filled WhatsApp text
    let orderDetailsText = `*🔴 BRAND NEW ORDER - EASTERN HILLS RESTAURANT* \n`;
    orderDetailsText += `═════════════════════════\n`;
    orderDetailsText += `👤 *Customer Name:* ${newOrder.customerName}\n`;
    orderDetailsText += `📍 *Service Type:* ${diningOption === 'dine_in' ? `Dine-In (${serviceLocation})` : '🚚 Delivery'}\n`;
    orderDetailsText += `⏰ *Time placed:* ${newDateStr()}\n`;
    orderDetailsText += `═════════════════════════\n\n`;
    
    orderDetailsText += `*🛒 ORDER ITEMS:* \n`;
    newOrder.items.forEach((item, index) => {
      const icon = item.menuItem.category === 'Drinks' ? '🍹' : 
                   item.menuItem.category === 'Desserts' ? '🍰' : '🍛';
      orderDetailsText += `${index + 1}. ${icon} *${item.menuItem.name}* \n`;
      orderDetailsText += `   [Qty: ${item.quantity} × ₵${item.menuItem.price.toFixed(2)}] -> *₵${(item.menuItem.price * item.quantity).toFixed(2)}*\n`;
    });
    
    orderDetailsText += `\n─────────────────────────\n`;
    orderDetailsText += `💰 *TOTAL DUE:* *₵${newOrder.totalAmount.toFixed(2)}*\n`;
    orderDetailsText += `─────────────────────────\n\n`;

    if (newOrder.notes) {
      orderDetailsText += `📝 *Special Instructions / Diet request:* \n_"${newOrder.notes}"_\n\n`;
    }
    
    orderDetailsText += `📲 _Please reply to confirm receipt of this order and kitchen prep time. Chat with us here if you have any questions!_`;

    // WhatsApp API integration URL
    // String clean for URL parameters
    const encodedMsg = encodeURIComponent(orderDetailsText);
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE_LINK}?text=${encodedMsg}`;

    // Update orders log state & local storage
    const updatedOrders = [newOrder, ...sentOrders].slice(0, 50); // cap at last 50 orders
    setSentOrders(updatedOrders);
    localStorage.setItem('sabor_sent_orders', JSON.stringify(updatedOrders));

    // Clear cart & show gorgeous confirmation modal inside the app
    setCart([]);
    setIsCartOpen(false);
    setSuccessOrder(newOrder);

    // Launch WhatsApp securely in new tab
    // Standard secure open
    window.open(whatsappUrl, '_blank');
  };

  const newDateStr = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Filter items based on active criteria
  const availableMenuItems = menuItems.filter(item => item.available);
  
  const filteredMenuItems = availableMenuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-24 font-sans antialiased">
      {/* Main Luxury Header */}
      <header className="bg-white border-b border-slate-100 shadow-xs sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            id="btn_hidden_admin_trigger"
            type="button"
            onClick={handleHiddenAdminTap}
            onPointerDown={handleSecretPointerDown}
            onPointerUp={handleSecretPointerUp}
            onPointerLeave={handleSecretPointerUp}
            onPointerCancel={handleSecretPointerUp}
            className="flex flex-col border-0 bg-transparent p-0 text-left cursor-default focus:outline-none"
            aria-label="Eastern Hills Restaurant"
          >
            <span className="text-lg sm:text-xl font-black uppercase tracking-tight text-red-600 font-sans flex items-center space-x-1">
              <span>EASTERN HILLS</span>
              <span className="text-slate-800 font-light">RESTAURANT</span>
            </span>
            
            {/* Table Number indicator */}
            {tableNumber ? (
              <div className="flex items-center space-x-1 mt-0.5">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-xs font-bold font-mono text-emerald-600">Ordering from Table {tableNumber}</span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-500 font-medium">Digital QR Code Ordering &amp; Chat App</span>
            )}
          </button>



          {/* Floating shopping bag indicator */}
          <button
            id="btn_view_cart_top"
            onClick={() => setIsCartOpen(true)}
            className="relative bg-slate-900 text-white hover:bg-slate-800 font-bold p-3 rounded-2xl flex items-center justify-center transition-all shadow-md transform hover:scale-102"
          >
            <ShoppingBag className="w-5 h-5 shrink-0" />
            {getCartCount() > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-extrabold text-[10px] h-5 w-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {getCartCount()}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        


        {/* Search Bar / Menu Filters */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              id="input_customer_search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, ingredients, drinks..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 text-sm rounded-xl text-slate-900 bg-slate-50/50"
            />
          </div>

          {/* Category Filter list */}
          <div className="flex space-x-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              id="btn_customer_cat_all"
              onClick={() => setActiveCategory('All')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeCategory === 'All' 
                  ? 'bg-red-600 text-white font-bold shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Dishes
            </button>
            {CATEGORIES.map(cat => (
              <button
                id={`btn_customer_cat_${cat}`}
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-red-600 text-white font-bold shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Catalog Section */}
        <div>
          <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center space-x-2">
            <span>Explore our Selection</span>
            <span className="text-xs text-slate-400 font-mono">({filteredMenuItems.length} options out)</span>
          </h3>

          {filteredMenuItems.length === 0 ? (
            <div id="no_customer_items" className="text-center p-12 bg-white border rounded-2xl shadow-xs border-slate-200">
              <div className="p-4 bg-slate-50 inline-block rounded-2xl text-slate-400 mb-2">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="text-slate-800 font-bold text-sm">Dishes Temporary Sold Out</h4>
              <p className="text-xs text-slate-500 mt-1">Try resetting search bar or choosing another food segment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {filteredMenuItems.map(item => {
                const countInCart = cart.find(ci => ci.menuItem.id === item.id)?.quantity || 0;
                
                return (
                  <div 
                    key={item.id}
                    className="bg-white border border-slate-100 rounded-3xl shadow-xs overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Image header */}
                      <div className="h-44 w-full bg-slate-100 relative overflow-hidden group cursor-pointer" onClick={() => setSelectedItem(item)}>
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md text-slate-800 tracking-wider">
                          {item.category}
                        </span>
                      </div>

                      {/* Info body */}
                      <div className="p-5">
                        <div className="flex justify-between items-start">
                          <h4 
                            onClick={() => setSelectedItem(item)}
                            className="text-base font-bold text-slate-900 cursor-pointer hover:text-red-600 line-clamp-1 truncate flex-1 pr-2"
                          >
                            {item.name}
                          </h4>
                          <span className="text-base font-extrabold text-red-600 font-mono shrink-0">
                            ₵{item.price.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 h-8 overflow-hidden leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Cart interactions */}
                    <div className="p-5 border-t border-slate-50 bg-slate-50/25 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                        <span>Excellent Portion</span>
                      </span>

                      {countInCart > 0 ? (
                        <div className="flex items-center space-x-2 bg-slate-200 text-slate-900 rounded-xl p-1">
                          <button
                            id={`btn_customer_dec_${item.id}`}
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 text-slate-800 hover:text-red-600 transition"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold font-mono">
                            {countInCart}
                          </span>
                          <button
                            id={`btn_customer_inc_${item.id}`}
                            onClick={() => addToCart(item)}
                            className="p-1 text-slate-800 hover:text-red-600 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          id={`btn_customer_add_${item.id}`}
                          onClick={() => addToCart(item)}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-3.5 rounded-xl flex items-center space-x-1 transition shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Order</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sent Order history widget (collapsible, keeps local history useful for customers) */}
        {sentOrders.length > 0 && (
          <div className="mt-14 border-t border-slate-200 pt-8">
            <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
              <Clock className="w-4.5 h-4.5 text-slate-500" />
              <span>Dine-In Session Orders ({sentOrders.length})</span>
            </h3>
            
            <div className="space-y-4">
              {sentOrders.map((ord) => (
                <div key={ord.id} className="bg-white border rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2.5 mb-2.5">
                    <div>
                      <span className="text-xs font-bold text-slate-800 font-mono uppercase mr-2">{ord.id}</span>
                      <span className="text-[11px] text-slate-400">{ord.timestamp}</span>
                    </div>
                    <span className="inline-flex items-center space-x-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-semibold">
                      <Clock className="w-3 h-3 animate-spin" />
                      <span>Sent via WhatsApp</span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    {ord.items.map((item) => (
                      <div key={item.menuItem.id} className="flex justify-between text-xs text-slate-600">
                        <span>{item.menuItem.name} <span className="font-mono font-bold text-slate-900">× {item.quantity}</span></span>
                        <span className="font-mono">₵{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-dashed border-slate-100 pt-2.5 mt-2.5 text-sm">
                    <span className="text-slate-500 font-medium">Order Total:</span>
                    <span className="font-bold text-slate-900 font-mono">₵{ord.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER RAILS */}
      <footer className="bg-white border-t border-slate-200 mt-20 py-8 text-center text-slate-400 text-xs">
        <p className="font-semibold text-slate-600 uppercase tracking-wider">Eastern hills Restaurant</p>
        <p className="mt-1 font-mono">Order Phone: {WHATSAPP_PHONE_DISPLAY}</p>
        <p className="mt-4 text-[10px] text-slate-400">© 2026 QR Menu &amp; WhatsApp Integration. All rights reserved.</p>
      </footer>

      {/* BOTTOM FLOAT MOBILE CART BUTTON */}
      {getCartCount() > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-0 right-0 z-40 px-4 sm:hidden">
          <button
            id="btn_cart_mobile_bar"
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-slate-900 text-white font-semibold py-3.5 px-5 rounded-2xl flex items-center justify-between shadow-lg shadow-slate-900/10 animate-bounce"
          >
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 bg-red-600 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center">
                {getCartCount()}
              </div>
              <span className="text-xs uppercase font-extrabold tracking-wide">Basket items</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-bold font-mono">₵{getCartTotal().toFixed(2)}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* DETAILED FOOD ITEM DISPLAY MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100">
            <div className="h-56 w-full bg-slate-100 relative">
              <img 
                src={selectedItem.image} 
                alt={selectedItem.name} 
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <button
                id="btn_product_modal_close"
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              <span className="bg-slate-100 text-slate-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                {selectedItem.category}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-2">{selectedItem.name}</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{selectedItem.description}</p>
              
              <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-5">
                <div>
                  <span className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Dishes pricing:</span>
                  <span className="text-xl font-black text-red-600 font-mono">₵{selectedItem.price.toFixed(2)}</span>
                </div>

                <button
                  id={`btn_product_modal_add_${selectedItem.id}`}
                  onClick={() => {
                    addToCart(selectedItem);
                    setSelectedItem(null);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-xs"
                >
                  Add to Active Basket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL OFF-CANVAS CART BASKET DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs">
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5 text-red-600" />
                  <h3 className="text-base font-bold text-slate-900">Your Fresh Order Basket</h3>
                </div>
                <button
                  id="btn_cart_drawer_close"
                  onClick={() => setIsCartOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="p-4 bg-slate-50 inline-block rounded-full text-slate-400 mb-4 shadow-inner">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <p className="text-slate-800 font-bold text-sm">Your basket is totally empty</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">Select some delicious meals from the menu to populate your checkout list!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.menuItem.id} className="flex items-center justify-between border-b border-slate-50 pb-4">
                        <div className="flex items-center space-x-3 min-w-0">
                          {/* Mini Photo */}
                          <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border">
                            <img src={item.menuItem.image} alt={item.menuItem.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate pr-2">{item.menuItem.name}</h4>
                            <span className="text-[11px] font-mono text-slate-400">₵{item.menuItem.price.toFixed(2)} each</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2.5">
                          {/* Qty count control */}
                          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border">
                            <button
                              id={`btn_cart_dec_${item.menuItem.id}`}
                              onClick={() => removeFromCart(item.menuItem.id)}
                              className="p-1 hover:text-red-600 text-slate-600 transition"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-[11px] font-bold font-mono text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              id={`btn_cart_inc_${item.menuItem.id}`}
                              onClick={() => addToCart(item.menuItem)}
                              className="p-1 hover:text-red-600 text-slate-600 transition"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            id={`btn_cart_delete_${item.menuItem.id}`}
                            onClick={() => deleteFromCart(item.menuItem.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-md transition"
                            title="Drop from basket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Checkout Details form */}
                    <form onSubmit={handlePlaceOrder} className="pt-4 border-t border-slate-100 space-y-4">
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                          Your Name / Service Token *
                        </label>
                        <input 
                          id="input_checkout_name"
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Please specify full name..."
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 text-sm rounded-xl"
                        />
                      </div>



                      {/* Instructions */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                          Special request / Notes
                        </label>
                        <textarea 
                          id="input_checkout_notes"
                          value={specialNotes}
                          onChange={(e) => setSpecialNotes(e.target.value)}
                          placeholder="e.g. No shito sauce, extra coleslaw, or cutlery count requests..."
                          rows={2}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 text-sm rounded-xl resize-none"
                        />
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Drawer Footer summary */}
              {cart.length > 0 && (
                <div className="bg-slate-50 border-t border-slate-100 px-6 py-5 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-semibold">Sub-total:</span>
                    <span className="text-lg font-black text-slate-900 font-mono">₵{getCartTotal().toFixed(2)}</span>
                  </div>

                  <button
                    id="btn_submit_order_whatsapp"
                    onClick={handlePlaceOrder}
                    disabled={!customerName.trim()}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg hover:shadow-slate-800/15 transition-all text-xs uppercase tracking-wider"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                    <span>Send Order via WhatsApp</span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center leading-normal">
                    This launches WhatsApp to transmit details. You can chat with crew directly as needed.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* WHATSAPP ORDER SUCCESS CONFIRMATION MODAL */}
      {successOrder && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center border-slate-100 shadow-2xl relative overflow-hidden">
            
            <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-500"></div>

            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full inline-block mb-3">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-bold text-slate-900">WhatsApp Order Transmitted!</h3>
            <p className="text-xs text-slate-500 mt-1 lines-relaxed">
              We generated the ticket formatting and initialized direct WhatsApp connection. Please click "Send" inside WhatsApp to finalize with our crew!
            </p>

            <div className="my-5 p-4 bg-slate-50 rounded-2xl border text-left space-y-3">
              <div className="flex justify-between font-mono text-xs text-slate-500">
                <span>Order Reference:</span>
                <span className="font-bold text-slate-800">{successOrder.id}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Total Amount:</span>
                <span className="font-bold text-slate-900 font-mono">₵{successOrder.totalAmount.toFixed(2)}</span>
              </div>
              {successOrder.tableNumber && (
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Assigned Table:</span>
                  <span className="font-bold text-slate-900 font-mono">{successOrder.tableNumber}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-2">
              <button
                id="btn_success_modal_whatsapp_retry"
                onClick={() => {
                  // Re-trigger order text
                  let text = `*🔴 RE-SEND ORDER - EASTERN HILLS* \n\n👤 *Customer:* ${successOrder.customerName}\n💰 *Total:* ₵${successOrder.totalAmount.toFixed(2)}\n📍 *Location:* ${successOrder.tableNumber || 'Delivery'}\n`;
                  window.open(`https://wa.me/${WHATSAPP_PHONE_LINK}?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center space-x-1"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Re-open WhatsApp Chat</span>
              </button>
              
              <button
                id="btn_success_modal_done"
                onClick={() => setSuccessOrder(null)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition"
              >
                Got it, Awesome!
              </button>
            </div>
          </div>
        </div>
      )}

      <StaffAccessModal
        errorMessage={adminErrorMessage}
        hasConfiguredPin={hasConfiguredAdminPin}
        isOpen={isStaffAccessOpen}
        pin={adminPin}
        pinConfirmation={adminPinConfirmation}
        usesEnvironmentPin={usesEnvironmentPin}
        onClose={closeStaffAccess}
        onPinChange={setAdminPin}
        onPinConfirmationChange={setAdminPinConfirmation}
        onSubmit={handleStaffAccessSubmit}
      />

    </div>
  );
}
