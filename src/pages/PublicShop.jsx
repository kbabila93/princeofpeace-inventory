import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingCart, Search, Package, Store, Minus, Plus, Trash2, X } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import Barcode from 'react-barcode';

export default function PublicShop() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    delivery_address: '',
    notes: ''
  });
  const queryClient = useQueryClient();

  const { data: shopSettings = [] } = useQuery({
    queryKey: ['shop-settings'],
    queryFn: () => base44.entities.ShopSettings.list(),
  });

  const settings = shopSettings[0] || {
    shop_name: "StockFlow Shop",
    tagline: "Quality products delivered to you",
    hero_title: "Welcome to Our Store",
    hero_subtitle: "Discover amazing products at great prices",
    primary_color: "#4f46e5",
    secondary_color: "#9333ea",
    footer_text: "Quality products, excellent service",
    font_style: "modern"
  };

  const fontClasses = {
    modern: "font-sans",
    classic: "font-serif",
    playful: "font-mono",
    elegant: "font-serif"
  };

  useEffect(() => {
    const savedCart = localStorage.getItem('public_shop_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('public_shop_cart', JSON.stringify(cart));
  }, [cart]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['public-shop-products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const createOrderMutation = useMutation({
    mutationFn: (orderData) => base44.entities.Order.create(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setCart([]);
      localStorage.removeItem('public_shop_cart');
      setIsCheckoutOpen(false);
      setCheckoutForm({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        delivery_address: '',
        notes: ''
      });
      toast.success("Order placed successfully! We'll contact you shortly.");
    },
    onError: (error) => {
      toast.error("Failed to place order. Please try again.");
    }
  });

  const activeProducts = products.filter(p => p.status === 'active' && (p.quantity || 0) > 0);

  const filteredProducts = activeProducts.filter(product => {
    const searchLower = search.toLowerCase();
    const matchesSearch = product.name.toLowerCase().includes(searchLower);
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.quantity) {
        toast.error("Not enough stock available");
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success("Added to cart");
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.quantity) {
          toast.error("Not enough stock");
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
    toast.success("Removed from cart");
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    
    if (!checkoutForm.customer_name || !checkoutForm.customer_email) {
      toast.error("Please fill in required fields");
      return;
    }

    const items = cart.map(item => ({
      productId: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price
    }));

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    createOrderMutation.mutate({
      ...checkoutForm,
      items_json: JSON.stringify(items),
      total_amount: total,
      currency: cart[0]?.currency || 'USD',
      status: 'pending'
    });
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 ${fontClasses[settings.font_style]}`}>
      <style>{`
        :root {
          --primary-color: ${settings.primary_color};
          --secondary-color: ${settings.secondary_color};
        }
      `}</style>
      <header className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-20 border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="h-12 w-auto object-contain" />
              ) : (
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(to bottom right, ${settings.primary_color}, ${settings.secondary_color})` }}>
                  <Store className="w-7 h-7 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold" style={{ background: `linear-gradient(to right, ${settings.primary_color}, ${settings.secondary_color})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {settings.shop_name}
                </h1>
                <p className="text-xs text-gray-500">{settings.tagline}</p>
              </div>
            </div>
            <Button 
              onClick={() => setIsCartOpen(true)} 
              className="relative shadow-md"
              style={{ backgroundColor: settings.primary_color, color: 'white' }}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Cart
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                  {cartItemsCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div 
        className="text-white py-12 relative overflow-hidden"
        style={{ 
          background: settings.banner_image_url 
            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${settings.banner_image_url})` 
            : `linear-gradient(to right, ${settings.primary_color}, ${settings.secondary_color})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">{settings.hero_title}</h2>
          <p className="text-lg opacity-90">{settings.hero_subtitle}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input 
              placeholder="Search for products..." 
              className="pl-10 h-12 text-lg border-2 border-gray-200 focus:border-indigo-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-12 border-2 border-gray-200">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="clothing">Clothing</SelectItem>
              <SelectItem value="food">Food</SelectItem>
              <SelectItem value="home">Home</SelectItem>
              <SelectItem value="beauty">Beauty</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-xl font-medium">No products available</p>
            <p className="text-gray-400 mt-2">Check back soon for new items!</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-gray-600">
              <span className="font-medium">{filteredProducts.length}</span> products found
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <Package className="w-20 h-20 text-gray-400" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="mb-2">
                      <span className="text-xs font-medium text-indigo-600 uppercase tracking-wide">{product.category}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                    )}
                    {product.sku && (
                      <div className="mb-3 flex justify-center bg-white py-2">
                        <Barcode value={product.sku} width={1.2} height={35} fontSize={10} />
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-2xl font-bold text-indigo-600">{product.currency} {product.price.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{product.quantity} in stock</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => addToCart(product)}
                      className="w-full"
                      style={{ backgroundColor: settings.primary_color, color: 'white' }}
                      disabled={product.quantity === 0}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <footer className="bg-gray-900 text-white mt-20 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="h-8 w-auto object-contain brightness-0 invert" />
            ) : (
              <Store className="w-6 h-6" />
            )}
            <span className="text-xl font-bold">{settings.shop_name}</span>
          </div>
          <p className="text-gray-400">{settings.footer_text}</p>
          <p className="text-gray-500 text-sm mt-4">© 2026 {settings.shop_name}. All rights reserved.</p>
        </div>
      </footer>

      {/* Cart Dialog */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-600" />
              Your Cart ({cartItemsCount} items)
            </DialogTitle>
          </DialogHeader>
          
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-h-96 overflow-y-auto space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.currency} {item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" onClick={() => updateQuantity(item.id, -1)}>
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <Button size="icon" variant="outline" onClick={() => updateQuantity(item.id, 1)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-indigo-600">{item.currency} {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {cart[0]?.currency || 'USD'} {cartTotal.toFixed(2)}
                  </span>
                </div>
                <Button onClick={handleCheckout} className="w-full" style={{ backgroundColor: settings.primary_color, color: 'white' }}>
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Full Name *</label>
              <Input
                required
                value={checkoutForm.customer_name}
                onChange={(e) => setCheckoutForm({...checkoutForm, customer_name: e.target.value})}
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Email *</label>
              <Input
                required
                type="email"
                value={checkoutForm.customer_email}
                onChange={(e) => setCheckoutForm({...checkoutForm, customer_email: e.target.value})}
                placeholder="john@example.com"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Phone Number</label>
              <Input
                value={checkoutForm.customer_phone}
                onChange={(e) => setCheckoutForm({...checkoutForm, customer_phone: e.target.value})}
                placeholder="+1234567890"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Delivery Address</label>
              <Textarea
                value={checkoutForm.delivery_address}
                onChange={(e) => setCheckoutForm({...checkoutForm, delivery_address: e.target.value})}
                placeholder="123 Main St, City, Country"
                rows={3}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Additional Notes</label>
              <Textarea
                value={checkoutForm.notes}
                onChange={(e) => setCheckoutForm({...checkoutForm, notes: e.target.value})}
                placeholder="Any special instructions?"
                rows={2}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Order Total:</span>
                <span className="text-2xl font-bold text-indigo-600">
                  {cart[0]?.currency || 'USD'} {cartTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              style={{ backgroundColor: settings.primary_color, color: 'white' }}
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? 'Placing Order...' : 'Place Order'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}