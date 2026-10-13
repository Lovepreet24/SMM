"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  CreditCard,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react";

type Service = {
  id: number;
  name: string;
  category: string;
  platform: string;
  price: number;
  min: number;
  max: number;
};

type Order = {
  id: number;
  service: string;
  link: string;
  quantity: number;
  charge: number;
  status: string;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "New Order", icon: ShoppingCart },
  { label: "Services", icon: Package },
  { label: "Order History", icon: Clock3 },
  { label: "Add Funds", icon: Wallet },
  { label: "Admin Panel", icon: ShieldCheck },
  { label: "Support", icon: CircleHelp },
  { label: "Settings", icon: Settings },
];

export default function Home() {
  const [page, setPage] = useState("Overview");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("All Platforms");
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [selectedService, setSelectedService] = useState("");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("100");
  const [orders, setOrders] = useState<Order[]>([]);
  const [notice, setNotice] = useState("");
  const [balance] = useState(0);
  const [fundAmount, setFundAmount] = useState("500");

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("services")
        .select(
          "id, name, platform, description, price_per_1000, min_quantity, max_quantity"
        )
        .eq("active", true)
        .order("id");

      if (cancelled) return;

      if (error) {
        console.error("Services load error:", error.message);
        notify("Services load nahi ho paayi. Please refresh karke try karein.");
        setServicesLoading(false);
        return;
      }

      const mapped: Service[] = (data ?? []).map((item) => ({
        id: Number(item.id),
        name: item.name,
        category: item.description ?? item.platform,
        platform: item.platform,
        price: Number(item.price_per_1000),
        min: Number(item.min_quantity),
        max: Number(item.max_quantity),
      }));

      setServices(mapped);
      setSelectedService((current) =>
        mapped.some((item) => String(item.id) === current)
          ? current
          : mapped.length > 0
            ? String(mapped[0].id)
            : ""
      );
      setServicesLoading(false);
    }

    loadServices();
    return () => {
      cancelled = true;
    };
  }, []);

  const service = services.find((s) => s.id === Number(selectedService));
  const qty = Number(quantity) || 0;
  const charge = service ? (service.price * qty) / 1000 : 0;

  const filteredServices = services.filter((s) => {
    const matchesSearch = `${s.name} ${s.platform} ${s.category}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesPlatform =
      platform === "All Platforms" || s.platform === platform;
    return matchesSearch && matchesPlatform;
  });

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }

  function placeOrder() {
    if (!service) {
      notify("Please select an available service.");
      return;
    }
    if (!link.trim()) {
      notify("Please enter the post, profile or channel URL.");
      return;
    }
    if (!/^https?:\/\/\S+/i.test(link.trim())) {
      notify("Please enter a valid URL starting with https://");
      return;
    }
    if (!Number.isInteger(qty) || qty < service.min || qty > service.max) {
      notify(`Quantity must be between ${service.min} and ${service.max}.`);
      return;
    }
    if (charge > balance) {
      notify("Insufficient wallet balance. Add funds to continue.");
      return;
    }

    setOrders((previous) => [
      {
        id: Date.now(),
        service: service.name,
        link: link.trim(),
        quantity: qty,
        charge,
        status: "Pending",
      },
      ...previous,
    ]);
    setLink("");
    notify("Demo order created.");
    setPage("Order History");
  }

  function goTo(label: string) {
    setPage(label);
    setMobileMenu(false);
    setNotice("");
  }

  const stats = [
    {
      label: "Total Orders",
      value: String(orders.length),
      note: "Orders in this session",
      icon: ShoppingCart,
    },
    {
      label: "Wallet Balance",
      value: money(balance),
      note: "Demo balance",
      icon: Wallet,
    },
    {
      label: "Services",
      value: servicesLoading ? "…" : String(services.length),
      note: "Database services",
      icon: Package,
    },
    {
      label: "Completed Orders",
      value: "0",
      note: "No live order data",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {notice && (
        <div className="fixed right-4 top-4 z-[100] flex max-w-sm items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium shadow-xl">
          <Activity className="h-5 w-5 shrink-0 text-indigo-600" />
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {mobileMenu && (
        <button
          aria-label="Close menu overlay"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          mobileMenu ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-tight">SocialFlow</div>
            <div className="text-xs text-slate-500">SMM Management</div>
          </div>
          <button
            className="ml-auto lg:hidden"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Workspace
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = page === item.label;
            return (
              <button
                key={item.label}
                onClick={() => goTo(item.label)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span>{item.label}</span>
                {item.label === "Order History" && orders.length > 0 && (
                  <span className="ml-auto rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                    {orders.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="m-4 rounded-2xl bg-slate-950 p-4 text-white">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
            <Globe className="h-5 w-5" />
          </div>
          <div className="text-sm font-bold">Need help?</div>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            Connect your support system when the backend is ready.
          </p>
          <button
            onClick={() => goTo("Support")}
            className="mt-3 w-full rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-900 hover:bg-slate-100"
          >
            Contact Support
          </button>
        </div>

        <div className="flex items-center gap-3 border-t border-slate-100 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
            SF
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">Panel Owner</div>
            <div className="text-xs text-slate-500">Demo account</div>
          </div>
          <LogOut className="h-4 w-4 text-slate-400" />
        </div>
      </aside>

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileMenu(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="text-xs text-slate-500">Workspace / {page}</div>
              <h1 className="mt-1 text-xl font-extrabold tracking-tight">{page}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-xl border border-slate-200 px-3 py-2 sm:flex sm:items-center sm:gap-2">
              <Wallet className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-500">Balance</span>
              <span className="text-sm font-bold">{money(balance)}</span>
            </div>
            <button
              className="relative rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50"
              aria-label="Notifications"
              onClick={() => notify("You are all caught up.")}
            >
              <Bell className="h-5 w-5 text-slate-500" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-500" />
            </button>
            <button
              onClick={() => goTo("Settings")}
              className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold sm:flex"
            >
              <Settings className="h-4 w-4" /> Settings
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] p-4 md:p-8">
          {page === "Overview" && (
            <div className="space-y-7">
              <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white md:p-9">
                <div className="relative z-10 max-w-2xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                    <Zap className="h-3.5 w-3.5" /> SOCIAL MEDIA GROWTH
                  </div>
                  <h2 className="text-3xl font-extrabold leading-tight md:text-4xl">
                    Grow your presence.
                    <br /> Manage it all in one place.
                  </h2>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-indigo-100 md:text-base">
                    Manage services, track demo orders and explore your SMM workspace from one simple dashboard.
                  </p>
                  <button
                    onClick={() => goTo("New Order")}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 shadow-lg transition hover:-translate-y-0.5"
                  >
                    <Plus className="h-4 w-4" /> Create New Order
                  </button>
                </div>
                <div className="pointer-events-none absolute -right-10 -top-24 h-80 w-80 rounded-full border-[35px] border-white/10" />
                <div className="pointer-events-none absolute -bottom-36 right-36 h-72 w-72 rounded-full bg-violet-400/20 blur-2xl" />
                <div className="pointer-events-none absolute right-12 top-10 hidden h-36 w-36 items-center justify-center rounded-3xl border border-white/20 bg-white/10 md:flex">
                  <TrendingUp className="h-20 w-20 text-white/90" />
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/70">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">{stat.label}</span>
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <Icon className="h-5 w-5" />
                        </span>
                      </div>
                      <div className="mt-4 text-2xl font-extrabold tracking-tight">{stat.value}</div>
                      <div className="mt-1 text-xs text-slate-500">{stat.note}</div>
                    </div>
                  );
                })}
              </section> 
              <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-extrabold">Recent Orders</h3>
                      <p className="mt-1 text-xs text-slate-500">Orders created in this browser session</p>
                    </div>
                    <button onClick={() => goTo("Order History")} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">View all</button>
                  </div>
                  {orders.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                        <Package className="h-7 w-7" />
                      </div>
                      <div className="mt-4 text-sm font-bold">No orders yet</div>
                      <p className="mt-1 text-xs text-slate-500">Your demo orders will appear here.</p>
                      <button onClick={() => goTo("New Order")} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700">Place an order</button>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {orders.slice(0, 4).map((order) => (
                        <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4">
                          <div>
                            <div className="text-sm font-bold">{order.service}</div>
                            <div className="mt-1 text-xs text-slate-500">#{order.id} · Qty {order.quantity}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold">{money(order.charge)}</div>
                            <span className="text-xs font-semibold text-amber-600">{order.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                  <h3 className="font-extrabold">Quick Actions</h3>
                  <p className="mt-1 text-xs text-slate-500">Jump straight to a workspace tool.</p>
                  <div className="mt-5 space-y-3">
                    {[
                      { label: "Place a new order", detail: "Choose a service and quantity", icon: ShoppingCart, target: "New Order" },
                      { label: "Browse services", detail: "Explore available database services", icon: Package, target: "Services" },
                      { label: "Add funds", detail: "View demo wallet options", icon: CreditCard, target: "Add Funds" },
                    ].map((action) => {
                      const Icon = action.icon;
                      return (
                        <button key={action.label} onClick={() => goTo(action.target)} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/40">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Icon className="h-5 w-5" /></span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-bold">{action.label}</span>
                            <span className="mt-1 block text-xs text-slate-500">{action.detail}</span>
                          </span>
                          <ArrowUpRight className="h-4 w-4 text-slate-400" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <Activity className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="text-sm">
                  <div className="font-bold">Demo mode</div>
                  <p className="mt-1 text-xs leading-5">This interface uses sample services and an in-memory demo balance. It does not connect to a supplier, accept payments or submit real orders.</p>
                </div>
              </div>
            </div>
          )}

          {page === "New Order" && (
            <div className="grid items-start gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-7">
                <div className="mb-6">
                  <h2 className="text-xl font-extrabold">Create New Order</h2>
                  <p className="mt-1 text-sm text-slate-500">Choose an available database service and enter the order details.</p>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-bold">Platform</label>
                    <select
                      value={platform}
                      onChange={(e) => {
                        setPlatform(e.target.value);
                        const next = services.find((s) => e.target.value === "All Platforms" || s.platform === e.target.value);
                        if (next) setSelectedService(String(next.id));
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    >
                      {["All Platforms", "Instagram", "YouTube", "Telegram", "TikTok"].map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold">Service</label>
                    {servicesLoading ? <p className="text-sm text-slate-500">Loading services…</p> : services.length === 0 ? <p className="text-sm text-amber-700">No active services found. Add services in Supabase first.</p> : null}
                    <select
                      disabled={servicesLoading || services.length === 0}
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    >
                      {services.filter((s) => platform === "All Platforms" || s.platform === platform).map((s) => (
                        <option key={s.id} value={s.id}>{s.id} — {s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold">Link</label>
                    <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://instagram.com/yourprofile" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
                    <p className="mt-2 text-xs text-slate-500">Enter the public profile, post or channel URL relevant to the service.</p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold">Quantity</label>
                    <input type="number" min={service?.min ?? 1} max={service?.max ?? 1000000} value={quantity} onChange={(e) => setQuantity(e.target.value)} disabled={!service} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
                    <div className="mt-2 flex justify-between text-xs text-slate-500"><span>Minimum: {service ? service.min.toLocaleString("en-IN") : "—"}</span><span>Maximum: {service ? service.max.toLocaleString("en-IN") : "—"}</span></div>
                  </div>
                  <button onClick={placeOrder} disabled={!service || servicesLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                    <ShoppingCart className="h-4 w-4" /> Submit Demo Order
                  </button>
                  <p className="text-center text-xs leading-5 text-slate-500">Demo only: this will not send an order to a supplier.</p>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                <h3 className="font-extrabold">Order Summary</h3>
                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <div className="text-xs text-slate-500">Selected service</div>
                  <div className="mt-1 text-sm font-bold">{service?.name ?? (servicesLoading ? "Loading services…" : "No service selected")}</div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>Platform</span><span className="font-semibold text-slate-700">{service?.platform ?? "—"}</span></div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500"><span>Rate per 1,000</span><span className="font-semibold text-slate-700">{service ? money(service.price) : "—"}</span></div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500"><span>Quantity</span><span className="font-semibold text-slate-700">{qty.toLocaleString("en-IN")}</span></div>
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between"><span className="text-sm font-bold">Estimated charge</span><span className="text-xl font-extrabold text-indigo-700">{money(charge)}</span></div>
                  </div>
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                  <Activity className="mt-0.5 h-4 w-4 shrink-0" />
                  Rates shown are placeholders, not verified supplier prices.
                </div>
              </section>
            </div>
          )}

          {page === "Services" && (
            <section className="rounded-2xl border border-slate-200 bg-white">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between md:p-6">
                <div>
                  <h2 className="text-lg font-extrabold">Service Catalogue</h2>
                  <p className="mt-1 text-sm text-slate-500">{filteredServices.length} available services</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services..." className="min-w-0 py-2.5 text-sm outline-none" />
                  </div>
                  <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none">
                    {["All Platforms", "Instagram", "YouTube", "Telegram", "TikTok"].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr><th className="px-5 py-4">ID / Service</th><th className="px-5 py-4">Platform</th><th className="px-5 py-4">Rate / 1K</th><th className="px-5 py-4">Min / Max</th><th className="px-5 py-4">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredServices.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4"><div className="font-bold">{s.name}</div><div className="mt-1 text-xs text-slate-500">ID: {s.id} · {s.category}</div></td>
                        <td className="px-5 py-4"><span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold">{s.platform}</span></td>
                        <td className="px-5 py-4 font-bold">{money(s.price)}</td>
                        <td className="px-5 py-4 text-xs text-slate-500">{s.min.toLocaleString("en-IN")} / {s.max.toLocaleString("en-IN")}</td>
                        <td className="px-5 py-4"><button onClick={() => { setSelectedService(String(s.id)); setPlatform("All Platforms"); setPage("New Order"); }} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700">Order</button></td>
                      </tr>
                    ))}
                    {filteredServices.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">No matching services found.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-100 p-4 text-xs text-slate-500">Services are loaded from your Supabase database. Supplier API integration is not connected.</div>
            </section>
          )}
                    {page === "Order History" && (
            <section className="rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 p-5 md:p-6">
                <div>
                  <h2 className="text-lg font-extrabold">Order History</h2>
                  <p className="mt-1 text-sm text-slate-500">Demo orders from the current session</p>
                </div>
                <button onClick={() => goTo("New Order")} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white">
                  <Plus className="h-4 w-4" /> New Order
                </button>
              </div>
              {orders.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <Clock3 className="h-10 w-10 text-slate-300" />
                  <h3 className="mt-4 font-bold">No orders to show</h3>
                  <p className="mt-1 text-sm text-slate-500">Your demo orders will appear here after submission.</p>
                  <button onClick={() => goTo("New Order")} className="mt-4 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold hover:bg-slate-50">Create an order</button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr><th className="px-5 py-4">Order ID</th><th className="px-5 py-4">Service</th><th className="px-5 py-4">Quantity</th><th className="px-5 py-4">Charge</th><th className="px-5 py-4">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((o) => (
                        <tr key={o.id}>
                          <td className="px-5 py-4 font-mono text-xs">{o.id}</td>
                          <td className="px-5 py-4">
                            <div className="font-bold">{o.service}</div>
                            <a className="mt-1 block max-w-xs truncate text-xs text-indigo-600" href={o.link} target="_blank" rel="noreferrer">{o.link}</a>
                          </td>
                          <td className="px-5 py-4">{o.quantity.toLocaleString("en-IN")}</td>
                          <td className="px-5 py-4 font-bold">{money(o.charge)}</td>
                          <td className="px-5 py-4"><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{o.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {page === "Add Funds" && (
            <div className="grid items-start gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-7">
                <h2 className="text-xl font-extrabold">Add Funds</h2>
                <p className="mt-1 text-sm text-slate-500">Wallet top-up screen preview</p>
                <div className="mt-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 p-6 text-white">
                  <div className="flex items-center justify-between"><span className="text-sm text-slate-300">Current balance</span><Wallet className="h-5 w-5 text-indigo-300" /></div>
                  <div className="mt-3 text-3xl font-extrabold">{money(balance)}</div>
                  <div className="mt-2 text-xs text-slate-400">Demo balance — no real funds held</div>
                </div>
                <label className="mb-2 mt-6 block text-sm font-bold">Amount (INR)</label>
                <input type="number" min="100" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {["500", "1000", "2000"].map((amount) => (
                    <button key={amount} onClick={() => setFundAmount(amount)} className={`rounded-xl border px-3 py-2.5 text-sm font-bold ${fundAmount === amount ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 hover:bg-slate-50"}`}>₹{amount}</button>
                  ))}
                </div>
                <button onClick={() => notify("Payments are not configured yet. No money was charged.")} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-indigo-700">
                  <CreditCard className="h-4 w-4" /> Continue to Payment
                </button>
                <p className="mt-3 text-center text-xs leading-5 text-slate-500">Payment gateway not connected. This button will not charge you.</p>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                <h3 className="font-extrabold">Payment Methods</h3>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><CreditCard className="h-5 w-5" /></div>
                    <div><div className="text-sm font-bold">UPI / QR</div><div className="mt-1 text-xs text-slate-500">Integration pending</div></div>
                    <span className="ml-auto text-xs text-amber-600">Setup needed</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><Globe className="h-5 w-5" /></div>
                    <div><div className="text-sm font-bold">USDT BEP20</div><div className="mt-1 text-xs text-slate-500">Payment verification pending</div></div>
                    <span className="ml-auto text-xs text-amber-600">Setup needed</span>
                  </div>
                </div>
                <div className="mt-5 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">Before enabling deposits, configure a suitable payment provider, transaction verification, reconciliation and refund handling.</div>
              </section>
            </div>
          )}

          {page === "Admin Panel" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-indigo-900">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0" />
                  <div>
                    <h2 className="font-extrabold">Admin Preview</h2>
                    <p className="mt-1 text-sm leading-6">This is a visual preview only. There is no real admin authentication or server-side authorization yet.</p>
                  </div>
                </div>
              </div>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { title: "Service Management", detail: "Supplier import and markup controls", icon: Package },
                  { title: "Order Management", detail: "View and manage customer orders", icon: ShoppingCart },
                  { title: "Wallet & Payments", detail: "Deposit review and reconciliation", icon: Wallet },
                  { title: "Customer Accounts", detail: "Account and access management", icon: ShieldCheck },
                  { title: "Supplier API", detail: "Server-side connection configuration", icon: Globe },
                  { title: "Panel Settings", detail: "Branding and general configuration", icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon className="h-5 w-5" /></div>
                      <h3 className="mt-4 font-extrabold">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{item.detail}</p>
                      <button onClick={() => notify("This admin function requires a secure backend.")} className="mt-4 text-xs font-bold text-indigo-600">Configure later <ArrowUpRight className="ml-1 inline h-3 w-3" /></button>
                    </div>
                  );
                })}
              </section>
            </div>
          )}

          {page === "Support" && (
            <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><CircleHelp className="h-6 w-6" /></div>
              <h2 className="mt-4 text-xl font-extrabold">How can we help?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Support tickets need a backend and a support contact. This page is currently a preview.</p>
              <div className="mt-6 space-y-3">
                {["How do I place an order?", "How do wallet deposits work?", "Where can I check my order status?"].map((q, i) => (
                  <details key={q} className="rounded-xl border border-slate-200 p-4">
                    <summary className="cursor-pointer text-sm font-bold">{q}</summary>
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {[
                        "Open New Order, select a service, enter the target URL and quantity, then submit. In this demo no real supplier order is created.",
                        "The wallet screen is only a preview. No payments or deposits are processed yet.",
                        "Order History shows demo orders created during the current browser session.",
                      ][i]}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {page === "Settings" && (
            <section className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 md:p-7">
              <h2 className="text-xl font-extrabold">Workspace Settings</h2>
              <p className="mt-1 text-sm text-slate-500">Preview of account and panel settings.</p>
              <div className="mt-6 space-y-5">
                <div><label className="mb-2 block text-sm font-bold">Panel name</label><input defaultValue="SocialFlow" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" /></div>
                <div><label className="mb-2 block text-sm font-bold">Support email</label><input type="email" placeholder="support@example.com" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" /></div>
                <div><label className="mb-2 block text-sm font-bold">Default currency</label><select className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"><option>INR — Indian Rupee</option><option>USD — US Dollar</option></select></div>
                <button onClick={() => notify("Settings are preview-only and have not been saved.")} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700">Save Settings</button>
                <p className="text-xs leading-5 text-slate-500">Settings are not persisted. Login, permissions and database storage must be implemented on the server.</p>
              </div>
            </section>
          )}

          <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row">
            <span>© 2026 SocialFlow. Panel preview.</span>
            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-400" /> Demo mode · Supplier API not connected</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
