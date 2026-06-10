/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Check, X, QrCode, Search, Utensils, 
  Upload, Image as ImageIcon, Sparkles, Sliders, DollarSign, 
  Layers, ToggleLeft, ToggleRight, ArrowLeft, Printer, RefreshCw, Eye
} from 'lucide-react';
import QRCode from 'qrcode';
import { MenuItem, Category, CATEGORIES } from '../types';

interface AdminPortalProps {
  menuItems: MenuItem[];
  onAdd: (item: MenuItem) => void;
  onUpdate: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function AdminPortal({ menuItems, onAdd, onUpdate, onDelete, onClose }: AdminPortalProps) {
  // State for item form
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Mains');
  const [image, setImage] = useState('');
  const [available, setAvailable] = useState(true);
  
  // Search & Filters
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // QR Code generator state
  const [selectedTable, setSelectedTable] = useState('1');
  const [generatedQRUrl, setGeneratedQRUrl] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrErrorMessage, setQrErrorMessage] = useState('');

  // Status message
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Preset Unsplash food images helper
  const PRESET_IMAGES = [
    { name: 'Jollof / Rice', url: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&auto=format&fit=crop&q=80' },
    { name: 'Spicy Fried Platain', url: 'https://images.unsplash.com/photo-1564844534838-8ff38a7c82c2?w=600&auto=format&fit=crop&q=80' },
    { name: 'Gourmet Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80' },
    { name: 'Salad / Green', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80' },
    { name: 'Juice / Smoothie', url: 'https://images.unsplash.com/photo-1536882240095-0379873feb4e?w=600&auto=format&fit=crop&q=80' },
    { name: 'Yam Fries', url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80' },
    { name: 'Grilled Fish', url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80' },
    { name: 'Warm Dessert', url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&auto=format&fit=crop&q=80' },
  ];

  // Handle Base64 file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showFeedback('Image must be under 2MB to ensure smooth local storage saving!', 'error');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        showFeedback('Image uploaded successfully!');
      };
      reader.onerror = () => {
        showFeedback('Error reading file', 'error');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showFeedback('Please enter a food label name!', 'error');
      return;
    }
    if (price <= 0) {
      showFeedback('Please enter a valid price above 0!', 'error');
      return;
    }

    const finalImage = image || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&auto=format&fit=crop&q=80';

    if (editingId) {
      // Editing
      onUpdate({
        id: editingId,
        name,
        price,
        description,
        category,
        image: finalImage,
        available
      });
      showFeedback(`Successfully updated "${name}"!`);
    } else {
      // Adding new
      onAdd({
        id: 'food_' + Date.now().toString(),
        name,
        price,
        description,
        category,
        image: finalImage,
        available: true
      });
      showFeedback(`Added "${name}" to the menu!`);
    }

    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setIsEditing(false);
    setName('');
    setPrice(0);
    setDescription('');
    setCategory('Mains');
    setImage('');
    setAvailable(true);
  };

  const startEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setName(item.name);
    setPrice(item.price);
    setDescription(item.description);
    setCategory(item.category);
    setImage(item.image);
    setAvailable(item.available);
    setIsEditing(true);
    // Smooth scroll to top of form panel
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate URL for scanning and viewing menu on separate devices
  const getMenuURL = () => {
    const menuUrl = new URL(window.location.href);
    menuUrl.hash = '';
    return menuUrl.toString();
  };

  const generateQRCodeDataUrl = async () => {
    const url = getMenuURL();
    return QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 350,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  };

  const prepareQRCode = async () => {
    try {
      setIsGeneratingQR(true);
      setQrErrorMessage('');
      const qrImageSrc = await generateQRCodeDataUrl();
      setGeneratedQRUrl(qrImageSrc);
      return qrImageSrc;
    } catch (error) {
      console.error('Failed to generate QR code', error);
      setGeneratedQRUrl('');
      setQrErrorMessage('QR code generation failed. Please try again.');
      showFeedback('Could not generate the QR code.', 'error');
      return null;
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleGenerateQR = async () => {
    setShowQRModal(true);
    await prepareQRCode();
  };

  const handlePrintQR = async () => {
    const qrImageSrc = generatedQRUrl || await prepareQRCode();
    if (!qrImageSrc) {
      return;
    }

    const popupWindow = window.open('', '_blank');
    if (!popupWindow) {
      showFeedback('Please allow pop-ups so the QR card can open for printing.', 'error');
      return;
    }

    const menuUrl = getMenuURL();
    popupWindow.document.write(`
      <html>
        <head>
          <title>Eastern hills Menu QR Code</title>
          <style>
            body {
              font-family: 'Inter', system-ui, sans-serif;
              text-align: center;
              padding: 40px;
              background: #fafafa;
              color: #1a1a1a;
            }
            .card {
              max-width: 450px;
              margin: 0 auto;
              background: #ffffff;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.08);
              border: 2px solid #e5e7eb;
            }
            .logo {
              font-weight: 850;
              font-size: 26px;
              letter-spacing: -0.05em;
              color: #dc2626;
              margin-bottom: 5px;
            }
            .tagline {
              font-size: 13px;
              color: #4b5563;
              margin-bottom: 30px;
              text-transform: uppercase;
              letter-spacing: 0.1em;
            }
            .qr-image {
              width: 280px;
              height: 280px;
              margin: 0 auto 30px;
              border: 1px solid #e5e5e5;
              padding: 10px;
              border-radius: 12px;
              background: white;
            }
            .subtitle {
              font-size: 18px;
              font-weight: 800;
              margin-bottom: 12px;
              color: #111827;
            }
            .instructions {
              font-size: 14px;
              color: #6b7280;
              line-height: 1.5;
              max-width: 320px;
              margin: 0 auto 30px;
            }
            .footer {
              font-size: 12px;
              color: #9ca3af;
              border-top: 1px solid #f3f4f6;
              padding-top: 15px;
            }
            .link {
              font-size: 12px;
              color: #475569;
              word-break: break-all;
              margin-bottom: 24px;
            }
            button {
              background: #dc2626;
              color: white;
              border: none;
              padding: 12px 24px;
              font-size: 16px;
              font-weight: 600;
              border-radius: 8px;
              cursor: pointer;
              margin-top: 20px;
            }
            @media print {
              button { display: none; }
              body { background: white; padding: 0; }
              .card { border: none; box-shadow: none; margin-top: 50px; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">EASTERN HILLS RESTAURANT</div>
            <div class="tagline">Scan &amp; Order Instantly</div>
            <div class="subtitle">OUR DIGITAL MENU</div>
            <img class="qr-image" src="${qrImageSrc}" alt="QR Code" />
            <div class="link">${menuUrl}</div>
            <div class="instructions">
              <strong>1.</strong> Scan the QR code with your phone camera.<br>
              <strong>2.</strong> Browse our exquisite menu &amp; select items.<br>
              <strong>3.</strong> Send your order directly to our chef via WhatsApp!
            </div>
            <div class="footer">Eastern hills Restaurant - Powered by Instant QR Menu</div>
            <button onclick="window.print()">Print Card</button>
          </div>
        </body>
      </html>
    `);
    popupWindow.document.close();
    return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const url = getMenuURL();
      printWindow.document.write(`
        <html>
          <head>
            <title>Eastern hills Menu QR Code</title>
            <style>
              body { 
                font-family: 'Inter', system-ui, sans-serif; 
                text-align: center; 
                padding: 40px; 
                background: #fafafa;
                color: #1a1a1a;
              }
              .card {
                max-width: 450px;
                margin: 0 auto;
                background: #ffffff;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                border: 2px solid #e5e7eb;
              }
              .logo {
                font-weight: 850;
                font-size: 26px;
                letter-spacing: -0.05em;
                color: #dc2626;
                margin-bottom: 5px;
              }
              .tagline {
                font-size: 13px;
                color: #4b5563;
                margin-bottom: 30px;
                text-transform: uppercase;
                letter-spacing: 0.1em;
              }
              .qr-image {
                width: 280px;
                height: 280px;
                margin: 0 auto 30px;
                border: 1px solid #e5e5e5;
                padding: 10px;
                border-radius: 12px;
                background: white;
              }
              .subtitle {
                font-size: 18px;
                font-weight: 800;
                margin-bottom: 12px;
                color: #111827;
              }
              .instructions {
                font-size: 14px;
                color: #6b7280;
                line-height: 1.5;
                max-width: 320px;
                margin: 0 auto 30px;
              }
              .footer {
                font-size: 12px;
                color: #9ca3af;
                border-top: 1px solid #f3f4f6;
                padding-top: 15px;
              }
              button {
                background: #dc2626;
                color: white;
                border: none;
                padding: 12px 24px;
                font-size: 16px;
                font-weight: 600;
                border-radius: 8px;
                cursor: pointer;
                margin-top: 20px;
              }
              @media print {
                button { display: none; }
                body { background: white; padding: 0; }
                .card { border: none; box-shadow: none; margin-top: 50px; }
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="logo">EASTERN HILLS RESTAURANT</div>
              <div class="tagline">Scan &amp; Order Instantly</div>
              
              <div class="subtitle">OUR DIGITAL MENU</div>
              
              <img class="qr-image" src="https://chart.googleapis.com/chart?chs=350x350&cht=qr&chl=${encodeURIComponent(url)}&choe=UTF-8" alt="QR Code" />
              
              <div class="instructions">
                <strong>1.</strong> Scan the QR code with your phone camera.<br>
                <strong>2.</strong> Browse our exquisite menu &amp; select items.<br>
                <strong>3.</strong> Send your order directly to our chef via WhatsApp!
              </div>
              
              <div class="footer">Eastern hills Restaurant — Powered by Instant QR Menu</div>
              <button onclick="window.print()">Print Card</button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Filter menu items
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchText.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-16 font-sans">
      {/* Header Panel */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
              <Utensils className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Admin Control Portal</h1>
              <p className="text-xs text-slate-500 font-mono">Manage menu items, prices &amp; generate QR tables</p>
            </div>
          </div>
          <button 
            id="btn_admin_close"
            onClick={onClose}
            className="inline-flex items-center space-x-2 px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 rounded-xl text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Customer View</span>
          </button>
        </div>
      </header>

      {/* Admin Content Structure */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Feedback messages */}
        {feedbackMsg && (
          <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-lg flex items-center space-x-3 text-sm font-medium transition-all transform animate-bounce duration-300 ${
            feedbackMsg.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {feedbackMsg.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Dynamic Bento Box Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form component & QR generator (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Form Box */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-red-500" />
                  <span>{isEditing ? 'Modify Menu Item' : 'Add New Dish'}</span>
                </h2>
                {isEditing && (
                  <button 
                    id="btn_admin_cancel_edit"
                    onClick={resetForm}
                    className="text-xs text-slate-500 hover:text-red-500 flex items-center space-x-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                
                {/* Food Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Food Name / Label *
                  </label>
                  <input 
                    id="input_food_name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ghanaian Grilled Sea Bream"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 text-slate-900 text-sm rounded-xl transition"
                  />
                </div>

                {/* Grid rows for Price and Category */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Price */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Price (GHS ₵) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                        ₵
                      </span>
                      <input 
                        id="input_food_price"
                        type="number"
                        step="0.01"
                        min="0.1"
                        required
                        value={price || ''}
                        onChange={(e) => setPrice(parseFloat(e.target.value))}
                        placeholder="45.00"
                        className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 text-slate-900 text-sm rounded-xl font-mono tracking-tight"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Category
                    </label>
                    <select
                      id="select_food_category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 text-slate-900 text-sm rounded-xl transition"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Dish Description
                  </label>
                  <textarea 
                    id="input_food_desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe ingredients, cooking styling, serving temperature, or spice levels..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 text-slate-900 text-sm rounded-xl transition resize-none"
                  />
                </div>

                {/* Image Section */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Dish Image Integration
                  </label>
                  <div className="flex flex-col space-y-3">
                    {/* Choose Preset */}
                    <div>
                      <span className="block text-[11px] text-slate-400 mb-1">Pick a stunning preset:</span>
                      <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-lg max-h-24 overflow-y-auto">
                        {PRESET_IMAGES.map((img) => (
                          <button
                            id={`btn_preset_img_${img.name}`}
                            key={img.name}
                            type="button"
                            onClick={() => setImage(img.url)}
                            className={`text-[9px] text-center p-1 rounded font-medium border truncate transition hover:bg-white ${
                              image === img.url 
                                ? 'bg-red-50 text-red-600 border-red-200' 
                                : 'bg-transparent text-slate-600 border-transparent'
                            }`}
                          >
                            {img.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Or URL input */}
                    <div>
                      <input 
                        id="input_food_image_url"
                        type="url"
                        value={image.startsWith('data:') ? '' : image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="Or hand-paste any custom Unsplash URL..."
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-lg text-slate-800 font-mono placeholder:font-sans focus:outline-none"
                      />
                    </div>

                    {/* Or File Upload */}
                    <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2.5">
                      <span className="text-[11px] font-medium text-slate-500 flex items-center space-x-1">
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                        <span>Or upload file (Max 2MB):</span>
                      </span>
                      <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 transition">
                        Select Photo
                        <input 
                          id="file_image_upload"
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Image Preview Box */}
                    {image && (
                      <div className="relative mt-2 h-28 w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center">
                        <img 
                          src={image} 
                          alt="Pre-visual" 
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                        <button
                          id="btn_clear_image"
                          type="button"
                          onClick={() => setImage('')}
                          className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full p-1.5 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Availability Toggle ONLY during editing */}
                {isEditing && (
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-sm font-semibold text-slate-700">Display as Available</span>
                    <button
                      id="btn_toggle_availability"
                      type="button"
                      onClick={() => setAvailable(!available)}
                      className={`flex items-center justify-center p-1 rounded-lg transition-colors ${
                        available ? 'text-emerald-600 hover:text-emerald-700' : 'text-slate-400 hover:text-slate-500'
                      }`}
                    >
                      {available ? (
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-semibold">Available</span>
                          <ToggleRight className="w-8 h-8 pointer-events-none" />
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-semibold text-slate-400">Sold Out</span>
                          <ToggleLeft className="w-8 h-8 pointer-events-none" />
                        </div>
                      )}
                    </button>
                  </div>
                )}

                {/* Submit button */}
                <button
                  id="btn_submit_food_form"
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-lg shadow-red-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {isEditing ? 'Save Changes' : 'Create & Publish Dish'}
                </button>
              </form>
            </div>

            {/* QR Code Placquard Generator */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <div className="border-b border-slate-100 pb-4 mb-4 flex items-center space-x-2">
                <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                  <QrCode className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Restaurant Menu QR Code</h3>
              </div>

              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Generate a high-resolution, printable QR code flyer/card for your restaurant. Your customers can scan this QR code with their mobile cameras to immediately browse your menu and place orders.
              </p>

              <div className="space-y-4">
                <div className="flex space-x-2">
                  <button
                    id="btn_preview_qr"
                    type="button"
                    onClick={handleGenerateQR}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-3 px-4 rounded-xl flex items-center justify-center space-x-1.5 transition shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View QR Code</span>
                  </button>
                  <button
                    id="btn_print_qr"
                    type="button"
                    onClick={handlePrintQR}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs py-3 px-4 rounded-xl flex items-center justify-center space-x-1.5 transition shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Card</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Menu List & Search (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Search Box / Filters */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  id="input_admin_search"
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Filter by label or content..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 text-sm rounded-xl text-slate-900 bg-slate-50/50"
                />
              </div>

              {/* Quick Filters */}
              <div className="flex space-x-1.5 overflow-x-auto pb-1 md:pb-0">
                <button
                  id="btn_filter_cat_all"
                  onClick={() => setActiveCategory('All')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                    activeCategory === 'All' 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Categories
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    id={`btn_filter_cat_${cat}`}
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                      activeCategory === cat
                        ? 'bg-slate-900 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* List of food Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Menu Database ({filteredItems.length} items shown)
                </span>
              </div>

              {filteredItems.length === 0 ? (
                <div id="empty_search_state" className="bg-white border rounded-2xl p-12 text-center border-slate-200 shadow-sm">
                  <div className="p-4 bg-slate-50 inline-block rounded-2xl text-slate-400 mb-3">
                    <Utensils className="w-8 h-8" />
                  </div>
                  <h4 className="text-slate-800 font-bold text-sm">No dishes matched search</h4>
                  <p className="text-xs text-slate-500 mt-1">Try clearing search text or category filter conditions.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredItems.map(item => (
                    <div 
                      key={item.id} 
                      className={`bg-white border rounded-2xl p-4 shadow-sm relative transition flex flex-col justify-between ${
                        item.available ? 'border-slate-200 hover:ring-1 hover:ring-slate-300' : 'border-slate-200/60 opacity-75 bg-slate-50'
                      }`}
                    >
                      <div>
                        {/* Upper row: Img or placeholder / Action buttons */}
                        <div className="flex items-start space-x-3.5 mb-3.5">
                          {/* Photo */}
                          <div className="h-16 w-16 bg-slate-100 rounded-xl overflow-hidden border border-slate-100 shrink-0 relative">
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover" 
                            />
                            {!item.available && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-[9px] text-white font-extrabold uppercase tracking-wide">Sold Out</span>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider">
                                {item.category}
                              </span>
                              <span className="text-sm font-bold text-red-600 font-mono">
                                ₵{item.price.toFixed(2)}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 mt-1 lines-clamp-1 truncate">
                              {item.name}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 h-8 overflow-hidden Leading-relaxed">
                              {item.description || 'No description provided.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Lower actions */}
                      <div className="border-t border-slate-100 pt-3 flex items-center justify-between mt-1">
                        <span className={`text-[11px] font-semibold flex items-center space-x-1 ${
                          item.available ? 'text-emerald-600' : 'text-slate-400'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${item.available ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          <span>{item.available ? 'Showing on Menu' : 'Hidden / Sold Out'}</span>
                        </span>

                        <div className="flex space-x-1">
                          <button
                            id={`btn_edit_${item.id}`}
                            onClick={() => startEdit(item)}
                            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded-lg transition"
                            title="Edit specs"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`btn_delete_${item.id}`}
                            onClick={() => {
                              if (confirm(`Remove "${item.name}" from active database completely?`)) {
                                onDelete(item.id);
                                showFeedback(`Removed "${item.name}"`);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded-lg transition"
                            title="Delete item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* QR MODAL PREVIEW */}
      {showQRModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="text-center">
              <h4 className="text-lg font-bold text-slate-800">Restaurant Menu QR Code</h4>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Scan to access the application</p>
              
              <div className="my-6 p-4 bg-slate-50 rounded-2xl inline-block border border-slate-100 relative shadow-inner">
                {isGeneratingQR ? (
                  <div className="w-56 h-56 flex flex-col items-center justify-center gap-3 bg-white rounded-xl">
                    <RefreshCw className="w-6 h-6 text-slate-300 animate-spin" />
                    <span className="text-xs font-medium text-slate-500">Generating QR code...</span>
                  </div>
                ) : generatedQRUrl ? (
                  <img 
                    src={generatedQRUrl} 
                    alt="Restaurant Menu QR Code"
                    referrerPolicy="no-referrer"
                    className="w-56 h-56 mx-auto bg-white p-2 rounded-xl scale-100 transition-all hover:scale-105"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center bg-white rounded-xl text-xs text-slate-400">
                    QR code preview will appear here
                  </div>
                )}
              </div>

              {qrErrorMessage && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-xs text-red-700">
                  {qrErrorMessage}
                </div>
              )}

              <div className="border border-dashed border-slate-200 p-3 rounded-xl bg-slate-50 text-left mb-6">
                <span className="block text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">Application URL:</span>
                <span className="block text-[10px] font-mono text-slate-600 break-all select-all mt-1">
                  {getMenuURL()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  id="btn_qr_modal_print"
                  onClick={handlePrintQR}
                  disabled={isGeneratingQR}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Card</span>
                </button>
                <button
                  id="btn_qr_modal_close"
                  onClick={() => setShowQRModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
