import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";
import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Percent,
  Search,
  Filter,
  Check,
  X,
  Utensils,
  ChevronDown,
  Clock,
  Truck,
  Plus,
  RefreshCw,
  Edit2,
  Lock,
  ArrowLeft,
  ChevronRight,
  MapPin,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { PRODUCTS, type Product } from "@/components/menu";
import { VOUCHERS, type VoucherDefinition } from "@/lib/vouchers";

// Types
interface AdminOrder {
  orderId: string;
  userId: string;
  customer: {
    name: string;
    email: string;
    mobile: string;
  };
  orderType: "delivery" | "pickup";
  delivery?: {
    address?: {
      fullAddress?: string;
      landmark?: string;
      contactNumber?: string;
    };
    noteToRider?: string;
    contactless?: boolean;
    option?: string;
    estimatedTime?: string;
  };
  pickup?: {
    branchId?: string;
    branchName?: string;
    branchAddress?: string;
  };
  items: Array<{
    id: string;
    productId: number;
    name: string;
    quantity: number;
    unitPrice: number;
    size?: string;
    addOns?: string[];
    summary?: string[];
  }>;
  totals: {
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    vat: number;
    voucherDiscount: number;
    total: number;
  };
  paymentMethod: string;
  paymentStatus: "unpaid" | "pending" | "paid" | "failed";
  orderStatus: "pending" | "waiting_payment" | "preparing" | "completed" | "cancelled";
  createdAt: string;
}

interface AdminUser {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  mobileNumber?: string;
  isAdmin?: boolean;
  role?: string;
  createdAt?: any;
}

interface MenuOverride {
  id: number;
  price: number;
  isAvailable: boolean;
}

const formatMoney = (value: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(value);
};

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "menu" | "vouchers" | "users">("overview");
  
  // Data States
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [menuOverrides, setMenuOverrides] = useState<Record<number, MenuOverride>>({});
  const [dbVouchers, setDbVouchers] = useState<VoucherDefinition[]>([]);
  
  // UI States
  const [loadingData, setLoadingData] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  // Modals & Forms
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editAvailable, setEditAvailable] = useState(true);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [newVoucher, setNewVoucher] = useState({
    code: "",
    type: "fixed" as const,
    value: 50,
    minSpend: 300,
    maxDiscount: 0,
    label: "",
    isActive: true,
    deliveryOnly: false,
    oneTime: false,
  });

  // Verify Admin Status
  const isAdmin = useMemo(() => {
    if (authLoading) return null;
    if (!user) return false;
    const email = user.email || profile?.email || "";
    return (
      email.includes("admin") ||
      email === "admin@bunbite.com" ||
      profile?.isAdmin === true ||
      (profile as any)?.role === "admin"
    );
  }, [user, profile, authLoading]);

  // Real-time Subscriptions
  useEffect(() => {
    if (!isAdmin) return;

    setLoadingData(true);

    // 1. Subscribe to Orders
    const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          orderId: doc.id,
          userId: data.userId || "",
          customer: {
            name: data.customerName || data.customer?.name || "Guest Customer",
            email: data.email || data.customer?.email || "",
            mobile: data.mobileNumber || data.customer?.mobile || "",
          },
          orderType: data.orderType || "delivery",
          delivery: data.delivery || undefined,
          pickup: data.selectedBranch || data.pickup || undefined,
          items: data.items || [],
          totals: {
            subtotal: Number(data.subtotal || data.totals?.subtotal || 0),
            deliveryFee: Number(data.deliveryFee || data.totals?.deliveryFee || 0),
            serviceFee: Number(data.serviceFee || data.totals?.serviceFee || 0),
            vat: Number(data.vat || data.totals?.vat || 0),
            voucherDiscount: Number(data.voucherDiscount || data.totals?.voucherDiscount || 0),
            total: Number(data.total || data.totals?.total || 0),
          },
          paymentMethod: data.paymentMethod || "cash_on_delivery",
          paymentStatus: data.paymentStatus || "unpaid",
          orderStatus: data.orderStatus || "pending",
          createdAt: data.createdAt ? (typeof data.createdAt.toDate === "function" ? data.createdAt.toDate().toISOString() : String(data.createdAt)) : new Date().toISOString(),
        } as AdminOrder;
      });
      setOrders(ordersData);
      setLoadingData(false);
    }, (error) => {
      console.error("Error subscribing to orders:", error);
      setLoadingData(false);
    });

    // 2. Subscribe to Users
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      } as AdminUser));
      setUsers(usersData);
    });

    // 3. Subscribe to Menu Overrides
    const unsubscribeOverrides = onSnapshot(collection(db, "menuOverrides"), (snapshot) => {
      const overrides: Record<number, MenuOverride> = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const id = Number(doc.id);
        overrides[id] = {
          id,
          price: Number(data.price),
          isAvailable: data.isAvailable !== false,
        };
      });
      setMenuOverrides(overrides);
    });

    // 4. Subscribe to Vouchers
    const unsubscribeVouchers = onSnapshot(collection(db, "vouchers"), (snapshot) => {
      const vouchersData = snapshot.docs.map((doc) => ({
        code: doc.id,
        ...doc.data(),
      } as VoucherDefinition));
      setDbVouchers(vouchersData);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeUsers();
      unsubscribeOverrides();
      unsubscribeVouchers();
    };
  }, [isAdmin]);

  // Handle access deny / loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#FF3B3B] animate-spin" />
          <p className="text-white/60 text-sm font-bold tracking-widest uppercase">Checking credentials...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[#111111] border border-white/10 rounded-3xl p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        >
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500 mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="font-display text-2xl font-black text-white mb-2">Access Denied</h1>
          <p className="text-white/50 text-sm mb-8">
            You do not have administrative privileges to access this area. If you believe this is an error, please sign in with an admin account.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setLocation("/")}
              className="w-full h-12 rounded-full bg-[#FF3B3B] font-black text-white text-sm hover:bg-[#ff5252] transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Return Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Helper function to update order status
  const handleUpdateOrderStatus = async (orderId: string, userId: string, newStatus: string) => {
    try {
      // 1. Update in root orders
      await updateDoc(doc(db, "orders", orderId), { orderStatus: newStatus });
      // 2. Update in user's subcollection orders if userId exists
      if (userId) {
        await updateDoc(doc(db, "users", userId, "orders", orderId), { orderStatus: newStatus });
      }
      if (selectedOrder?.orderId === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, orderStatus: newStatus as any } : null);
      }
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, userId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { paymentStatus: newStatus });
      if (userId) {
        await updateDoc(doc(db, "users", userId, "orders", orderId), { paymentStatus: newStatus });
      }
      if (selectedOrder?.orderId === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, paymentStatus: newStatus as any } : null);
      }
    } catch (err) {
      console.error("Error updating payment status:", err);
    }
  };

  // Toggle user admin role
  const handleToggleUserAdmin = async (targetUser: AdminUser) => {
    try {
      const newAdminState = !targetUser.isAdmin;
      const docRef = doc(db, "users", targetUser.uid);
      await updateDoc(docRef, {
        isAdmin: newAdminState,
        role: newAdminState ? "admin" : "user"
      });
    } catch (err) {
      console.error("Error updating user role:", err);
    }
  };

  // Save Menu Override
  const handleSaveMenuOverride = async () => {
    if (!editingProduct) return;
    try {
      await setDoc(doc(db, "menuOverrides", String(editingProduct.id)), {
        price: Number(editPrice) || Number(editingProduct.price),
        isAvailable: editAvailable,
        updatedAt: new Date().toISOString(),
      });
      setEditingProduct(null);
    } catch (err) {
      console.error("Error saving menu override:", err);
    }
  };

  // Create Voucher
  const handleCreateVoucher = async () => {
    if (!newVoucher.code) return;
    try {
      const codeUpper = newVoucher.code.trim().toUpperCase();
      const label = newVoucher.label || `${newVoucher.type === "fixed" ? "₱" + newVoucher.value : newVoucher.value + "%"} off (Code: ${codeUpper})`;
      
      await setDoc(doc(db, "vouchers", codeUpper), {
        code: codeUpper,
        type: newVoucher.type,
        value: Number(newVoucher.value),
        minSpend: Number(newVoucher.minSpend),
        maxDiscount: newVoucher.type === "percentage" ? Number(newVoucher.maxDiscount) : null,
        label,
        isActive: newVoucher.isActive,
        deliveryOnly: newVoucher.deliveryOnly,
        oneTime: newVoucher.oneTime,
        createdAt: new Date().toISOString(),
      });

      setIsVoucherModalOpen(false);
      setNewVoucher({
        code: "",
        type: "fixed",
        value: 50,
        minSpend: 300,
        maxDiscount: 0,
        label: "",
        isActive: true,
        deliveryOnly: false,
        oneTime: false,
      });
    } catch (err) {
      console.error("Error creating voucher:", err);
    }
  };

  // -------------------------------------------------------------
  // Data Computations for Overview Tab
  // -------------------------------------------------------------
  const analytics = useMemo(() => {
    const validOrders = orders.filter((o) => o.orderStatus !== "cancelled");
    
    // Revenue
    const totalRevenue = validOrders.reduce((sum, o) => sum + o.totals.total, 0);
    const avgOrderValue = validOrders.length ? totalRevenue / validOrders.length : 0;
    
    // Status counts
    const completedCount = orders.filter((o) => o.orderStatus === "completed").length;
    const cancelledCount = orders.filter((o) => o.orderStatus === "cancelled").length;
    const preparingCount = orders.filter((o) => o.orderStatus === "preparing").length;
    const pendingCount = orders.filter((o) => o.orderStatus === "pending").length;

    // Users
    const activeUserCount = users.length || new Set(orders.map((o) => o.userId)).size;

    // Daily Sales Chart Data (last 7 days or matching orders)
    const salesByDate: Record<string, { date: string; revenue: number; count: number }> = {};
    orders.forEach((order) => {
      if (order.orderStatus === "cancelled") return;
      const dateStr = order.createdAt.split("T")[0]; // YYYY-MM-DD
      const prettyDate = new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!salesByDate[dateStr]) {
        salesByDate[dateStr] = { date: prettyDate, revenue: 0, count: 0 };
      }
      salesByDate[dateStr].revenue += order.totals.total;
      salesByDate[dateStr].count += 1;
    });

    const chartData = Object.values(salesByDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // take last 7 active days

    // Order type breakdown
    const deliveryCount = validOrders.filter((o) => o.orderType === "delivery").length;
    const pickupCount = validOrders.filter((o) => o.orderType === "pickup").length;
    const typeData = [
      { name: "Delivery", value: deliveryCount, color: "#FF3B3B" },
      { name: "Pickup", value: pickupCount, color: "#FFA000" },
    ];

    // Popular items
    const itemSales: Record<number, { name: string; quantity: number; revenue: number }> = {};
    validOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!itemSales[item.productId]) {
          itemSales[item.productId] = { name: item.name, quantity: 0, revenue: 0 };
        }
        itemSales[item.productId].quantity += item.quantity;
        itemSales[item.productId].revenue += item.unitPrice * item.quantity;
      });
    });
    const popularItems = Object.values(itemSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalRevenue,
      avgOrderValue,
      totalOrders: validOrders.length,
      activeUserCount,
      completedCount,
      cancelledCount,
      preparingCount,
      pendingCount,
      chartData,
      typeData,
      popularItems,
    };
  }, [orders, users]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchSearch =
        order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.mobile.includes(searchQuery);

      const matchStatus = statusFilter === "all" ? true : order.orderStatus === statusFilter;
      const matchType = typeFilter === "all" ? true : order.orderType === typeFilter;

      return matchSearch && matchStatus && matchType;
    });
  }, [orders, searchQuery, statusFilter, typeFilter]);

  // Combine static vouchers with DB vouchers
  const allVouchers = useMemo(() => {
    const combined = [...dbVouchers];
    // Add static vouchers if not overwritten
    VOUCHERS.forEach((sv) => {
      if (!combined.some((dv) => dv.code === sv.code)) {
        combined.push(sv);
      }
    });
    return combined;
  }, [dbVouchers]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    return users.filter((u) => {
      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      return (
        fullName.includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.mobile || u.mobileNumber || "").includes(searchQuery)
      );
    });
  }, [users, searchQuery]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 shrink-0 bg-[#0B0B0B] border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10">
              <img src="/images/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-display text-sm font-black tracking-widest text-white uppercase">
              Admin Hub
            </span>
          </div>
          <button
            onClick={() => setLocation("/")}
            className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors lg:hidden"
            title="Go back to website"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <nav className="p-4 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <SidebarTab
            active={activeTab === "overview"}
            icon={<TrendingUp className="w-4 h-4" />}
            label="Overview"
            onClick={() => { setActiveTab("overview"); setSearchQuery(""); }}
          />
          <SidebarTab
            active={activeTab === "orders"}
            icon={<ShoppingBag className="w-4 h-4" />}
            label="Orders"
            badge={analytics.pendingCount > 0 ? analytics.pendingCount : undefined}
            onClick={() => { setActiveTab("orders"); setSearchQuery(""); }}
          />
          <SidebarTab
            active={activeTab === "menu"}
            icon={<Utensils className="w-4 h-4" />}
            label="Menu Items"
            onClick={() => { setActiveTab("menu"); setSearchQuery(""); }}
          />
          <SidebarTab
            active={activeTab === "vouchers"}
            icon={<Percent className="w-4 h-4" />}
            label="Vouchers"
            onClick={() => { setActiveTab("vouchers"); setSearchQuery(""); }}
          />
          <SidebarTab
            active={activeTab === "users"}
            icon={<Users className="w-4 h-4" />}
            label="Customers"
            onClick={() => { setActiveTab("users"); setSearchQuery(""); }}
          />
        </nav>

        <div className="mt-auto p-4 border-t border-white/5 hidden lg:block">
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 flex items-center justify-center text-[#FF3B3B]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white/80 truncate">
                  {profile?.firstName || user?.displayName || user?.email?.split("@")[0]}
                </p>
                <p className="text-[10px] font-black text-[#FF8A80] uppercase tracking-wider">
                  Root Admin
                </p>
              </div>
            </div>
            <button
              onClick={() => setLocation("/")}
              className="mt-4 w-full h-9 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Exit to Shop
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-6 lg:p-8 flex flex-col h-[calc(100vh-65px)] lg:h-screen overflow-y-auto">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div>
            <h1 className="font-display text-3xl font-black tracking-tight leading-tight capitalize">
              {activeTab === "users" ? "Customer Accounts" : `${activeTab} Management`}
            </h1>
            <p className="text-xs text-white/40 font-bold uppercase tracking-wider mt-1">
              {activeTab === "overview"
                ? "Real-time restaurant analytics and financials"
                : `Manage ${activeTab} data and database overrides`}
            </p>
          </div>

          {/* Quick Search for relevant tabs */}
          {activeTab !== "overview" && (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === "orders"
                    ? "Search ID, customer, phone..."
                    : activeTab === "users"
                    ? "Search name, email, phone..."
                    : "Search items..."
                }
                className="w-full h-11 pl-11 pr-4 bg-[#111111] border border-white/10 rounded-full text-sm font-medium placeholder:text-white/20 text-white focus:outline-none focus:border-[#FF3B3B]/50 transition-colors"
              />
            </div>
          )}
        </header>

        {/* Content body */}
        <div className="flex-1 min-h-0">
          {loadingData ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-[#FF3B3B] animate-spin" />
              <p className="text-white/40 text-xs font-bold tracking-widest uppercase">Loading database records...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* KPI Cards Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                      icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
                      label="Gross Sales"
                      value={formatMoney(analytics.totalRevenue)}
                      gradient="from-emerald-500/10 to-teal-500/10"
                    />
                    <KpiCard
                      icon={<ShoppingBag className="w-5 h-5 text-blue-400" />}
                      label="Completed Orders"
                      value={String(analytics.completedCount)}
                      gradient="from-blue-500/10 to-indigo-500/10"
                    />
                    <KpiCard
                      icon={<TrendingUp className="w-5 h-5 text-[#FF8A80]" />}
                      label="Avg. Order Value"
                      value={formatMoney(analytics.avgOrderValue)}
                      gradient="from-red-500/10 to-orange-500/10"
                    />
                    <KpiCard
                      icon={<Users className="w-5 h-5 text-purple-400" />}
                      label="Active Customers"
                      value={String(analytics.activeUserCount)}
                      gradient="from-purple-500/10 to-pink-500/10"
                    />
                  </div>

                  {/* Charts section */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Area Chart */}
                    <div className="lg:col-span-2 rounded-3xl border border-white/5 bg-[#111111]/70 p-6 flex flex-col">
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-display text-lg font-black">Sales Performance</h2>
                        <span className="text-xs font-bold text-white/30 uppercase tracking-wider">
                          Daily gross (₱)
                        </span>
                      </div>
                      <div className="w-full h-72">
                        {analytics.chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics.chartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#FF3B3B" stopOpacity={0.25} />
                                  <stop offset="95%" stopColor="#FF3B3B" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} fontWeight="bold" />
                              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} fontWeight="bold" />
                              <ChartTooltip
                                contentStyle={{ backgroundColor: "#1c1c1c", borderColor: "rgba(255,255,255,0.1)", borderRadius: "16px" }}
                                labelStyle={{ color: "rgba(255,255,255,0.6)", fontWeight: "bold" }}
                              />
                              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#FF3B3B" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-white/20 text-sm font-bold">
                            No sales data recorded yet
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Type Pie Chart */}
                    <div className="rounded-3xl border border-white/5 bg-[#111111]/70 p-6 flex flex-col">
                      <h2 className="font-display text-lg font-black mb-4">Fulfillment Types</h2>
                      <div className="w-full h-52 relative flex items-center justify-center">
                        {analytics.totalOrders > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={analytics.typeData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {analytics.typeData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <ChartTooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="text-white/20 text-sm font-bold">No orders yet</div>
                        )}
                        {analytics.totalOrders > 0 && (
                          <div className="absolute text-center">
                            <span className="block text-2xl font-black text-white">{analytics.totalOrders}</span>
                            <span className="block text-[9px] font-black text-white/30 uppercase tracking-widest">Total</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-auto space-y-2">
                        {analytics.typeData.map((t, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs font-bold">
                            <div className="flex items-center gap-2 text-white/60">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                              {t.name}
                            </div>
                            <span className="text-white">{t.value} ({analytics.totalOrders > 0 ? Math.round((t.value / analytics.totalOrders) * 100) : 0}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live Order Counts & Popular Items */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Live Pipeline Status */}
                    <div className="rounded-3xl border border-white/5 bg-[#111111]/70 p-6 flex flex-col justify-between">
                      <div>
                        <h2 className="font-display text-lg font-black mb-4">Operations Feed</h2>
                        <div className="grid grid-cols-2 gap-4">
                          <StatusCount label="Pending" count={analytics.pendingCount} color="border-yellow-500/20 text-yellow-400 bg-yellow-500/5 animate-pulse" />
                          <StatusCount label="Preparing" count={analytics.preparingCount} color="border-orange-500/20 text-orange-400 bg-orange-500/5" />
                          <StatusCount label="Completed" count={analytics.completedCount} color="border-emerald-500/20 text-emerald-400 bg-emerald-500/5" />
                          <StatusCount label="Cancelled" count={analytics.cancelledCount} color="border-red-500/20 text-red-400 bg-red-500/5" />
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("orders")}
                        className="mt-6 w-full h-11 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-xs font-bold tracking-widest uppercase transition-all"
                      >
                        Launch Order Manager
                      </button>
                    </div>

                    {/* Popular items */}
                    <div className="lg:col-span-2 rounded-3xl border border-white/5 bg-[#111111]/70 p-6">
                      <h2 className="font-display text-lg font-black mb-4">Top-Selling Products</h2>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="text-left text-white/30 text-[10px] font-black uppercase tracking-wider border-b border-white/5 pb-2">
                              <th className="pb-3 font-black">Item Name</th>
                              <th className="pb-3 text-center font-black">Units Sold</th>
                              <th className="pb-3 text-right font-black">Gross Sales</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-sm font-bold">
                            {analytics.popularItems.map((item, idx) => (
                              <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                                <td className="py-3 pr-4 flex items-center gap-3 text-white">
                                  <span className="text-xs text-white/30 font-black">#{idx+1}</span>
                                  {item.name}
                                </td>
                                <td className="py-3 text-center text-white/60">{item.quantity}</td>
                                <td className="py-3 text-right text-[#FF8A80]">{formatMoney(item.revenue)}</td>
                              </tr>
                            ))}
                            {analytics.popularItems.length === 0 && (
                              <tr>
                                <td colSpan={3} className="py-4 text-center text-white/20 text-sm">
                                  No items sold yet
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ORDERS TAB */}
              {activeTab === "orders" && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6 flex-1 flex flex-col lg:flex-row gap-6 min-h-0"
                >
                  {/* Left: Orders List */}
                  <div className="flex-1 flex flex-col gap-4">
                    {/* Filters Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111111]/40 border border-white/5 p-4 rounded-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status Filter */}
                        <div className="flex items-center gap-1.5 bg-black/45 px-3 py-1.5 rounded-xl border border-white/5">
                          <Filter className="w-3.5 h-3.5 text-white/30" />
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent border-0 text-xs font-black text-white/70 uppercase tracking-wider focus:outline-none cursor-pointer"
                          >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="waiting_payment">Waiting Payment</option>
                            <option value="preparing">Preparing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>

                        {/* Order Type Filter */}
                        <div className="flex items-center gap-1.5 bg-black/45 px-3 py-1.5 rounded-xl border border-white/5">
                          <Truck className="w-3.5 h-3.5 text-white/30" />
                          <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-transparent border-0 text-xs font-black text-white/70 uppercase tracking-wider focus:outline-none cursor-pointer"
                          >
                            <option value="all">All Types</option>
                            <option value="delivery">Delivery</option>
                            <option value="pickup">Pickup</option>
                          </select>
                        </div>
                      </div>

                      <div className="text-xs text-white/40 font-bold">
                        Found <span className="text-white">{filteredOrders.length}</span> orders
                      </div>
                    </div>

                    {/* Orders Table Container */}
                    <div className="rounded-2xl border border-white/5 bg-[#111111]/70 overflow-hidden flex-1">
                      <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="text-left text-white/30 text-[10px] font-black uppercase tracking-wider border-b border-white/5">
                              <th className="p-4 font-black">Order ID</th>
                              <th className="p-4 font-black">Customer</th>
                              <th className="p-4 font-black">Fulfillment</th>
                              <th className="p-4 font-black">Total Amount</th>
                              <th className="p-4 font-black">Payment</th>
                              <th className="p-4 font-black">Status</th>
                              <th className="p-4 font-black text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-sm font-bold">
                            {filteredOrders.map((order) => (
                              <tr
                                key={order.orderId}
                                onClick={() => setSelectedOrder(order)}
                                className={`hover:bg-white/[0.02] cursor-pointer transition-colors ${
                                  selectedOrder?.orderId === order.orderId ? "bg-white/[0.04] border-l-2 border-l-[#FF3B3B]" : ""
                                }`}
                              >
                                <td className="p-4 font-display text-sm font-black whitespace-nowrap text-white">
                                  {order.orderId}
                                  <span className="block text-[10px] font-black text-white/30">
                                    {new Date(order.createdAt).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                  </span>
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                  {order.customer.name}
                                  <span className="block text-[10px] text-white/30 font-medium">{order.customer.mobile}</span>
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider rounded-full border px-2 py-0.5 ${
                                    order.orderType === "delivery"
                                      ? "border-blue-500/25 bg-blue-500/5 text-blue-400"
                                      : "border-orange-500/25 bg-orange-500/5 text-orange-400"
                                  }`}>
                                    {order.orderType === "delivery" ? <Truck className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                                    {order.orderType}
                                  </span>
                                </td>
                                <td className="p-4 font-display text-white whitespace-nowrap">
                                  {formatMoney(order.totals.total)}
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                  <span className={`inline-block text-[10px] font-black uppercase tracking-wider rounded-full px-2 py-0.5 ${
                                    order.paymentStatus === "paid"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : order.paymentStatus === "pending"
                                      ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                                  }`}>
                                    {order.paymentStatus}
                                  </span>
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                  <span className={`inline-block text-[10px] font-black uppercase tracking-wider rounded-full px-2 py-0.5 ${
                                    order.orderStatus === "completed"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : order.orderStatus === "preparing"
                                      ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                      : order.orderStatus === "cancelled"
                                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                      : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                  }`}>
                                    {order.orderStatus.replace("-", " ")}
                                  </span>
                                </td>
                                <td className="p-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleUpdateOrderStatus(order.orderId, order.userId, "preparing")}
                                      className="px-2.5 py-1 rounded bg-[#FF3B3B]/10 hover:bg-[#FF3B3B]/20 text-[#FF3B3B] text-[10px] font-black tracking-wider uppercase border border-[#FF3B3B]/20"
                                      disabled={order.orderStatus === "completed" || order.orderStatus === "cancelled"}
                                    >
                                      Prep
                                    </button>
                                    <button
                                      onClick={() => handleUpdateOrderStatus(order.orderId, order.userId, "completed")}
                                      className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-wider uppercase border border-emerald-500/20"
                                      disabled={order.orderStatus === "completed" || order.orderStatus === "cancelled"}
                                    >
                                      Done
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {filteredOrders.length === 0 && (
                              <tr>
                                <td colSpan={7} className="p-8 text-center text-white/20 text-sm">
                                  No matching orders found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Right: Selected Order Detail Panel */}
                  <div className="w-full lg:w-96 shrink-0 flex flex-col">
                    <AnimatePresence mode="wait">
                      {selectedOrder ? (
                        <motion.div
                          key={selectedOrder.orderId}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="bg-[#111111]/90 border border-white/10 rounded-2xl p-6 flex flex-col flex-1 shadow-[0_16px_50px_rgba(0,0,0,0.5)]"
                        >
                          {/* Close button for detail panel on mobile */}
                          <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4">
                            <div>
                              <h3 className="font-display text-lg font-black text-white">{selectedOrder.orderId}</h3>
                              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Order Details</p>
                            </div>
                            <button
                              onClick={() => setSelectedOrder(null)}
                              className="p-1 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-5 overflow-y-auto max-h-[420px] pr-2 [scrollbar-width:thin]">
                            {/* Customer segment */}
                            <div>
                              <span className="text-[9px] font-black text-white/35 uppercase tracking-wider">Customer info</span>
                              <div className="mt-1 font-bold text-sm text-white">
                                <p>{selectedOrder.customer.name}</p>
                                <p className="text-white/60 text-xs font-normal mt-0.5">{selectedOrder.customer.email}</p>
                                <p className="text-white/60 text-xs font-normal mt-0.5">{selectedOrder.customer.mobile}</p>
                              </div>
                            </div>

                            {/* Location Details */}
                            <div>
                              <span className="text-[9px] font-black text-white/35 uppercase tracking-wider">Fulfillment details</span>
                              <div className="mt-1 text-xs font-bold text-white/80 leading-relaxed flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-[#FF3B3B] shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[#FF8A80] uppercase tracking-wider text-[10px] font-black">
                                    {selectedOrder.orderType === "delivery" ? "Delivery to" : "Pickup Branch"}
                                  </p>
                                  {selectedOrder.orderType === "delivery" ? (
                                    <>
                                      <p>{selectedOrder.delivery?.address?.fullAddress}</p>
                                      {selectedOrder.delivery?.address?.landmark && (
                                        <p className="text-white/40">Landmark: {selectedOrder.delivery.address.landmark}</p>
                                      )}
                                      {selectedOrder.delivery?.noteToRider && (
                                        <p className="text-white/40 italic">Note: "{selectedOrder.delivery.noteToRider}"</p>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <p>{selectedOrder.pickup?.branchName}</p>
                                      <p className="text-white/40">{selectedOrder.pickup?.branchAddress}</p>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Items Segment */}
                            <div>
                              <span className="text-[9px] font-black text-white/35 uppercase tracking-wider block mb-2">Order Items</span>
                              <div className="space-y-2">
                                {selectedOrder.items.map((item, idx) => (
                                  <div key={idx} className="bg-black/30 border border-white/5 rounded-xl p-3 text-xs">
                                    <div className="flex items-start justify-between font-bold text-white mb-1">
                                      <span>{item.quantity} x {item.name}</span>
                                      <span className="font-display">{formatMoney(item.unitPrice * item.quantity)}</span>
                                    </div>
                                    {item.size && <p className="text-white/40 font-medium">Size: {item.size}</p>}
                                    {item.summary && item.summary.length > 0 && (
                                      <p className="text-white/30 text-[10px] font-normal leading-relaxed mt-1">
                                        {item.summary.join(" / ")}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Financial totals */}
                            <div className="border-t border-white/5 pt-3 space-y-1.5 text-xs font-bold text-white/60">
                              <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{formatMoney(selectedOrder.totals.subtotal)}</span>
                              </div>
                              {selectedOrder.orderType === "delivery" && (
                                <div className="flex justify-between">
                                  <span>Delivery Fee</span>
                                  <span>{formatMoney(selectedOrder.totals.deliveryFee)}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span>Service Fee</span>
                                <span>{formatMoney(selectedOrder.totals.serviceFee)}</span>
                              </div>
                              {selectedOrder.totals.voucherDiscount > 0 && (
                                <div className="flex justify-between text-emerald-400">
                                  <span>Voucher Discount</span>
                                  <span>-{formatMoney(selectedOrder.totals.voucherDiscount)}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-display text-sm font-black text-white pt-2 border-t border-dashed border-white/10">
                                <span>Total Amount</span>
                                <span className="text-[#FF3B3B]">{formatMoney(selectedOrder.totals.total)}</span>
                              </div>
                            </div>

                            {/* Actions Form */}
                            <div className="border-t border-white/5 pt-4 space-y-3">
                              <div>
                                <label className="block text-[9px] font-black text-white/35 uppercase tracking-wider mb-1.5">
                                  Update Order Status
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={() => handleUpdateOrderStatus(selectedOrder.orderId, selectedOrder.userId, "preparing")}
                                    className={`h-9 rounded-xl text-xs font-bold transition-all border ${
                                      selectedOrder.orderStatus === "preparing"
                                        ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                                        : "bg-white/5 text-white/60 border-white/5 hover:border-white/15"
                                    }`}
                                  >
                                    Preparing
                                  </button>
                                  <button
                                    onClick={() => handleUpdateOrderStatus(selectedOrder.orderId, selectedOrder.userId, "completed")}
                                    className={`h-9 rounded-xl text-xs font-bold transition-all border ${
                                      selectedOrder.orderStatus === "completed"
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                        : "bg-white/5 text-white/60 border-white/5 hover:border-white/15"
                                    }`}
                                  >
                                    Completed
                                  </button>
                                  <button
                                    onClick={() => handleUpdateOrderStatus(selectedOrder.orderId, selectedOrder.userId, "pending")}
                                    className={`h-9 rounded-xl text-xs font-bold transition-all border ${
                                      selectedOrder.orderStatus === "pending"
                                        ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                                        : "bg-white/5 text-white/60 border-white/5 hover:border-white/15"
                                    }`}
                                  >
                                    Pending
                                  </button>
                                  <button
                                    onClick={() => handleUpdateOrderStatus(selectedOrder.orderId, selectedOrder.userId, "cancelled")}
                                    className={`h-9 rounded-xl text-xs font-bold transition-all border ${
                                      selectedOrder.orderStatus === "cancelled"
                                        ? "bg-red-500/10 text-red-400 border-red-500/30"
                                        : "bg-white/5 text-white/60 border-white/5 hover:border-white/15"
                                    }`}
                                  >
                                    Cancel Order
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[9px] font-black text-white/35 uppercase tracking-wider mb-1.5">
                                  Update Payment Status
                                </label>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleUpdatePaymentStatus(selectedOrder.orderId, selectedOrder.userId, "paid")}
                                    className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all border ${
                                      selectedOrder.paymentStatus === "paid"
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                        : "bg-white/5 text-white/60 border-white/5 hover:border-white/15"
                                    }`}
                                  >
                                    Paid
                                  </button>
                                  <button
                                    onClick={() => handleUpdatePaymentStatus(selectedOrder.orderId, selectedOrder.userId, "unpaid")}
                                    className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all border ${
                                      selectedOrder.paymentStatus === "unpaid"
                                        ? "bg-red-500/10 text-red-400 border-red-500/30"
                                        : "bg-white/5 text-white/60 border-white/5 hover:border-white/15"
                                    }`}
                                  >
                                    Unpaid
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl p-6 text-center text-white/30 text-xs">
                          <ShoppingBag className="w-8 h-8 mb-2 text-white/20" />
                          Select an order from the list to manage and review.
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* MENU MANAGEMENT TAB */}
              {activeTab === "menu" && (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-[#111111]/70 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="text-left text-white/30 text-[10px] font-black uppercase tracking-wider border-b border-white/5 pb-2">
                            <th className="p-4 font-black">Item ID</th>
                            <th className="p-4 font-black">Name</th>
                            <th className="p-4 font-black">Category</th>
                            <th className="p-4 font-black">Base Price</th>
                            <th className="p-4 font-black">Current Price</th>
                            <th className="p-4 font-black">Status</th>
                            <th className="p-4 font-black text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm font-bold">
                          {PRODUCTS.filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product) => {
                            const override = menuOverrides[product.id];
                            const currentPrice = override ? override.price : Number(product.price);
                            const isAvailable = override ? override.isAvailable : true;
                            
                            return (
                              <tr key={product.id} className="hover:bg-white/[0.01] transition-colors">
                                <td className="p-4 text-white/40">#{product.id}</td>
                                <td className="p-4 text-white flex items-center gap-3">
                                  <img src={product.image} className="w-8 h-8 rounded-lg object-cover bg-black/40" />
                                  {product.name}
                                </td>
                                <td className="p-4 text-white/50 uppercase text-xs tracking-wider">{product.category}</td>
                                <td className="p-4 text-white/50">{formatMoney(Number(product.price))}</td>
                                <td className="p-4 text-white font-display text-base">
                                  {formatMoney(currentPrice)}
                                  {override && override.price !== Number(product.price) && (
                                    <span className="ml-2 inline-block text-[9px] font-black uppercase tracking-widest text-[#FF8A80] border border-[#FF3B3B]/20 bg-[#FF3B3B]/10 px-1.5 py-0.5 rounded">
                                      Override
                                    </span>
                                  )}
                                </td>
                                <td className="p-4">
                                  <span className={`inline-block text-[10px] font-black uppercase tracking-wider rounded-full px-2.5 py-0.5 ${
                                    isAvailable
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                                  }`}>
                                    {isAvailable ? "In Stock" : "Out of Stock"}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => {
                                      setEditingProduct(product);
                                      setEditPrice(String(currentPrice));
                                      setEditAvailable(isAvailable);
                                    }}
                                    className="p-2 rounded-lg bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all inline-flex items-center gap-1.5"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    Edit
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Menu Edit Modal */}
                  <AnimatePresence>
                    {editingProduct && (
                      <>
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setEditingProduct(null)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#111111] border border-white/10 rounded-3xl p-6 shadow-[0_24px_80px_rgba(0,0,0,0.8)] z-50"
                        >
                          <h3 className="font-display text-xl font-black text-white mb-4">Edit Product Settings</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-1.5">Product Name</label>
                              <div className="h-11 px-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center text-white/60 text-sm font-bold">
                                {editingProduct.name}
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-1.5">Override Price (₱)</label>
                              <input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="w-full h-11 px-4 bg-[#1e1e1e] border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-[#FF3B3B]/50"
                              />
                            </div>

                            <div className="flex items-center justify-between py-2 border-t border-b border-white/5">
                              <div>
                                <p className="text-sm font-bold text-white">Item Availability</p>
                                <p className="text-xs text-white/40 font-normal mt-0.5">Toggle if item can be ordered</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setEditAvailable(!editAvailable)}
                                className={`w-14 h-8 rounded-full transition-all relative p-1 cursor-pointer flex items-center ${
                                  editAvailable ? "bg-[#FF3B3B] justify-end" : "bg-white/10 justify-start"
                                }`}
                              >
                                <motion.span layout className="w-6 h-6 rounded-full bg-white shadow-md block" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-6 flex justify-end gap-3">
                            <button
                              onClick={() => setEditingProduct(null)}
                              className="h-11 px-5 rounded-full border border-white/10 text-white/60 text-sm font-bold hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveMenuOverride}
                              className="h-11 px-6 rounded-full bg-[#FF3B3B] text-white text-sm font-black hover:bg-[#ff5252]"
                            >
                              Save Changes
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* VOUCHER MANAGEMENT TAB */}
              {activeTab === "vouchers" && (
                <motion.div
                  key="vouchers"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-end">
                    <button
                      onClick={() => setIsVoucherModalOpen(true)}
                      className="h-11 px-5 rounded-full bg-[#FF3B3B] text-white text-sm font-black hover:bg-[#ff5252] transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create Custom Voucher
                    </button>
                  </div>

                  <div className="bg-[#111111]/70 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="text-left text-white/30 text-[10px] font-black uppercase tracking-wider border-b border-white/5 pb-2">
                            <th className="p-4 font-black">Voucher Code</th>
                            <th className="p-4 font-black">Type</th>
                            <th className="p-4 font-black">Value</th>
                            <th className="p-4 font-black">Min Spend</th>
                            <th className="p-4 font-black">Scope</th>
                            <th className="p-4 font-black">Usage</th>
                            <th className="p-4 font-black">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm font-bold">
                          {allVouchers.map((voucher) => (
                            <tr key={voucher.code} className="hover:bg-white/[0.01] transition-colors">
                              <td className="p-4 font-display font-black text-base text-white">{voucher.code}</td>
                              <td className="p-4 text-white/50 capitalize">{voucher.type.replace("freeDelivery", "Free Delivery")}</td>
                              <td className="p-4 text-white">
                                {voucher.type === "fixed" && formatMoney(voucher.value)}
                                {voucher.type === "percentage" && `${voucher.value}%`}
                                {voucher.type === "freeDelivery" && "Free"}
                              </td>
                              <td className="p-4 text-white/60">{formatMoney(voucher.minSpend)}</td>
                              <td className="p-4 text-white/50 text-xs">
                                {voucher.deliveryOnly ? "Delivery Only" : "All Orders"}
                              </td>
                              <td className="p-4 text-white/50 text-xs">
                                {voucher.oneTime ? "One Time Per User" : "Unlimited"}
                              </td>
                              <td className="p-4">
                                <span className={`inline-block text-[10px] font-black uppercase tracking-wider rounded-full px-2.5 py-0.5 ${
                                  voucher.isActive
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                                  }`}>
                                  {voucher.isActive ? "Active" : "Inactive"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Create Voucher Modal */}
                  <AnimatePresence>
                    {isVoucherModalOpen && (
                      <>
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setIsVoucherModalOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#111111] border border-white/10 rounded-3xl p-6 shadow-[0_24px_80px_rgba(0,0,0,0.8)] z-50"
                        >
                          <h3 className="font-display text-xl font-black text-white mb-4">Create New Voucher</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-1.5">Voucher Code</label>
                              <input
                                type="text"
                                value={newVoucher.code}
                                onChange={(e) => setNewVoucher(prev => ({ ...prev, code: e.target.value }))}
                                placeholder="E.g., MYBUN50"
                                className="w-full h-11 px-4 bg-[#1e1e1e] border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-[#FF3B3B]/50"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-1.5">Type</label>
                                <select
                                  value={newVoucher.type}
                                  onChange={(e) => setNewVoucher(prev => ({ ...prev, type: e.target.value as any }))}
                                  className="w-full h-11 px-3 bg-[#1e1e1e] border border-white/10 rounded-xl text-xs font-black text-white/70 uppercase tracking-wider focus:outline-none"
                                >
                                  <option value="fixed">Fixed Amount</option>
                                  <option value="percentage">Percentage</option>
                                  <option value="freeDelivery">Free Delivery</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-1.5">Discount Value</label>
                                <input
                                  type="number"
                                  value={newVoucher.value}
                                  onChange={(e) => setNewVoucher(prev => ({ ...prev, value: Number(e.target.value) }))}
                                  disabled={newVoucher.type === "freeDelivery"}
                                  className="w-full h-11 px-4 bg-[#1e1e1e] border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-[#FF3B3B]/50 disabled:opacity-50"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-1.5">Min Spend (₱)</label>
                                <input
                                  type="number"
                                  value={newVoucher.minSpend}
                                  onChange={(e) => setNewVoucher(prev => ({ ...prev, minSpend: Number(e.target.value) }))}
                                  className="w-full h-11 px-4 bg-[#1e1e1e] border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-[#FF3B3B]/50"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-1.5">Max Discount (₱)</label>
                                <input
                                  type="number"
                                  value={newVoucher.maxDiscount}
                                  onChange={(e) => setNewVoucher(prev => ({ ...prev, maxDiscount: Number(e.target.value) }))}
                                  disabled={newVoucher.type !== "percentage"}
                                  className="w-full h-11 px-4 bg-[#1e1e1e] border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-[#FF3B3B]/50 disabled:opacity-50"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-1.5">Label (Description)</label>
                              <input
                                type="text"
                                value={newVoucher.label}
                                onChange={(e) => setNewVoucher(prev => ({ ...prev, label: e.target.value }))}
                                placeholder="E.g., ₱50 discount on orders ₱300+"
                                className="w-full h-11 px-4 bg-[#1e1e1e] border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-[#FF3B3B]/50"
                              />
                            </div>

                            <div className="flex gap-4 pt-2">
                              <label className="flex items-center gap-2 text-xs font-bold text-white/70 select-none cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={newVoucher.deliveryOnly}
                                  onChange={(e) => setNewVoucher(prev => ({ ...prev, deliveryOnly: e.target.checked }))}
                                  className="rounded border-white/10 bg-[#1e1e1e] text-[#FF3B3B] focus:ring-0 w-4 h-4"
                                />
                                Delivery Only
                              </label>

                              <label className="flex items-center gap-2 text-xs font-bold text-white/70 select-none cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={newVoucher.oneTime}
                                  onChange={(e) => setNewVoucher(prev => ({ ...prev, oneTime: e.target.checked }))}
                                  className="rounded border-white/10 bg-[#1e1e1e] text-[#FF3B3B] focus:ring-0 w-4 h-4"
                                />
                                One Time Use
                              </label>
                            </div>
                          </div>

                          <div className="mt-6 flex justify-end gap-3">
                            <button
                              onClick={() => setIsVoucherModalOpen(false)}
                              className="h-11 px-5 rounded-full border border-white/10 text-white/60 text-sm font-bold hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleCreateVoucher}
                              className="h-11 px-6 rounded-full bg-[#FF3B3B] text-white text-sm font-black hover:bg-[#ff5252]"
                            >
                              Create Voucher
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* CUSTOMERS / USERS TAB */}
              {activeTab === "users" && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-[#111111]/70 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="text-left text-white/30 text-[10px] font-black uppercase tracking-wider border-b border-white/5 pb-2">
                            <th className="p-4 font-black">User UID</th>
                            <th className="p-4 font-black">Name</th>
                            <th className="p-4 font-black">Email</th>
                            <th className="p-4 font-black">Mobile</th>
                            <th className="p-4 font-black">Role</th>
                            <th className="p-4 font-black text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm font-bold">
                          {filteredUsers.map((targetUser) => {
                            const isCurrentUser = targetUser.uid === user?.uid;
                            return (
                              <tr key={targetUser.uid} className="hover:bg-white/[0.01] transition-colors">
                                <td className="p-4 text-xs font-mono text-white/30">{targetUser.uid.slice(0, 12)}...</td>
                                <td className="p-4 text-white">
                                  {targetUser.firstName || targetUser.lastName
                                    ? `${targetUser.firstName || ""} ${targetUser.lastName || ""}`.trim()
                                    : "No name set"}
                                </td>
                                <td className="p-4 text-white/60">{targetUser.email}</td>
                                <td className="p-4 text-white/50">{targetUser.mobileNumber || targetUser.mobile || "—"}</td>
                                <td className="p-4">
                                  <span className={`inline-block text-[10px] font-black uppercase tracking-wider rounded-full px-2.5 py-0.5 border ${
                                    targetUser.isAdmin || targetUser.role === "admin"
                                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                                      : "bg-white/5 text-white/40 border-white/5"
                                  }`}>
                                    {targetUser.isAdmin || targetUser.role === "admin" ? "Admin" : "Customer"}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => handleToggleUserAdmin(targetUser)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                      targetUser.isAdmin || targetUser.role === "admin"
                                        ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/25"
                                        : "bg-white/5 hover:bg-white/10 text-white/60 border-white/5"
                                    }`}
                                    disabled={isCurrentUser}
                                    title={isCurrentUser ? "You cannot modify your own roles" : ""}
                                  >
                                    {targetUser.isAdmin || targetUser.role === "admin" ? "Revoke Admin" : "Make Admin"}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {filteredUsers.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-white/20 text-sm">
                                No registered users found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}

// Sidebar Tab Component
function SidebarTab({
  active,
  icon,
  label,
  badge,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 select-none ${
        active
          ? "bg-[#FF3B3B] text-white shadow-[0_0_24px_rgba(255,59,59,0.3)]"
          : "text-white/40 hover:text-white hover:bg-white/5"
      }`}
    >
      <span className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </span>
      {badge && (
        <span className={`h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full text-[9px] font-black leading-none ${
          active ? "bg-white text-[#FF3B3B]" : "bg-[#FF3B3B] text-white animate-pulse"
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

// KPI Stat Card Component
function KpiCard({
  icon,
  label,
  value,
  gradient,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  gradient: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-white/5 bg-[#111111]/70 p-5 flex flex-col justify-between h-32`}>
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} blur-2xl rounded-full`} />
      <div className="flex items-center justify-between relative z-10">
        <span className="text-[10px] font-black text-white/35 uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="font-display text-2xl font-black text-white relative z-10 truncate leading-none mb-1">{value}</p>
    </div>
  );
}

// Operations status circle counts
function StatusCount({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 text-center ${color}`}>
      <span className="block text-2xl font-black">{count}</span>
      <span className="block text-[10px] font-black uppercase tracking-wider mt-1 opacity-70">{label}</span>
    </div>
  );
}
