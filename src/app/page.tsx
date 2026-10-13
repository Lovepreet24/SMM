
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Activity, ArrowUpRight, Bell, CheckCircle2, ChevronDown,
  CircleHelp, Clock3, CreditCard, Globe, LayoutDashboard, LogOut,
  Menu, Package, Plus, Search, Settings, ShieldCheck,
  ShoppingCart, TrendingUp, Wallet, X, Zap
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
  const [balance, setBalance] = useState(0);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [fundAmount, setFundAmount] = useState("500");

  const notify = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4000);
  }, []);

  const loadData = useCallback(async () => {
    const supabase = createClient();

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setLoggedIn(false);
      setBalance(0);
      setOrders([]);
      return;
    }

    setLoggedIn(true);
    const userId = authData.user.id;

    const [profileResult, servicesResult, ordersResult] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("wallet_balance")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("services")
          .select(
            "id, name, platform, description, price_per_1000, min_quantity, max_quantity"
          )
          .eq("active", true)
          .order("id"),
        supabase
          .from("orders")
          .select("id, service_id, target_url, quantity, charge, status")
          .eq("user_id", userId)
          .order("id", { ascending: false }),
      ]);

    if (profileResult.error) {
      console.error("Profile load error:", profileResult.error.message);
    } else {
      setBalance(Number(profileResult.data?.wallet_balance ?? 0));
    }

    if (servicesResult.error) {
      console.error("Services load error:", servicesResult.error.message);
      notify("Services load nahi hui. Refresh karke try karo.");
    } else {
      const mapped: Service[] = (servicesResult.data ?? []).map((item) => ({
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
          : mapped.length
            ? String(mapped[0].id)
            : ""
      );
    }

    if (ordersResult.error) {
      console.error("Orders load error:", ordersResult.error.message);
      notify("Order history load nahi hui.");
    } else {
      const serviceNames = new Map(
        (servicesResult.data ?? []).map((item) => [
          Number(item.id),
          item.name,
        ])
      );

      setOrders(
        (ordersResult.data ?? []).map((item) => ({
          id: Number(item.id),
          service: serviceNames.get(Number(item.service_id)) ??
            `Service #${item.service_id}`,
          link: item.target_url,
          quantity: Number(item.quantity),
          charge: Number(item.charge),
          status: item.status ?? "pending",
        }))
      );
    }

    setServicesLoading(false);
  }, [notify]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const service = services.find((s) => s.id === Number(selectedService));
  const qty = Number(quantity) || 0;
  const charge = service ? (service.price * qty) / 1000 : 0;

  const filteredServices = services.filter((s) => {
    const matchesSearch =
      `${s.name} ${s.platform} ${s.category}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesPlatform =
      platform === "All Platforms" || s.platform === platform;
    return matchesSearch && matchesPlatform;
  });

  async function placeOrder() {
    if (loading) return;

    if (!loggedIn) {
      notify("Order karne ke liye pehle Google login karo.");
      return;
    }

    if (!service) {
      notify("Available service select karo.");
      return;
    }

    if (!/^https?:\/\/\S+$/i.test(link.trim())) {
      notify("Valid URL enter karo, https:// se shuru hona chahiye.");
      return;
    }

    if (!Number.isInteger(qty) || qty < service.min || qty > service.max) {
      notify(`Quantity ${service.min} se ${service.max} ke beech honi chahiye.`);
      return;
    }

    if (charge > balance) {
      notify("Wallet balance kam hai. Funds add karne honge.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          targetUrl: link.trim(),
          quantity: qty,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        notify(result.error || "Order submit nahi hua.");
        return;
      }

      setLink("");
      notify(`Order #${result.orderId} database mein create ho gaya.`);
      await loadData();
      setPage("Order History");
    } catch (error) {
      console.error("Order submission error:", error);
      notify("Network error. Dobara try karo.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
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
      note: "Database orders",
      icon: ShoppingCart,
    },
    {
      label: "Wallet Balance",
      value: money(balance),
      note: "Database balance",
      icon: Wallet,
    },
    {
      label: "Services",
      value: servicesLoading ? "…" : String(services.length),
      note: "Active services",
      icon: Package,
    },
    {
      label: "Completed Orders",
      value: String(
        orders.filter((o) => o.status.toLowerCase() === "completed").length
      ),
      note: "Completed status",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {notice && (
        <div className="fixed right-4 top-4 z-[100] flex max-w-sm items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm font-medium shadow-xl">
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
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-white transition-transform lg:translate-x-0 ${
          mobileMenu ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center gap-3 border-b px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-extrabold">SMM Roy</div>
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

        <div className="px-4 pb-2 pt-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">
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
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:bg-slate-50"
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
          <Globe className="mb-3 h-6 w-6" />
          <div className="text-sm font-bold">Need help?</div>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            Contact support for assistance with your account.
          </p>
          <button
            onClick={() => goTo("Support")}
            className="mt-3 w-full rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-900"
          >
            Contact Support
          </button>
        </div>

        <div className="flex items-center gap-3 border-t p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
            {loggedIn ? "U" : "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">
              {loggedIn ? "Logged in user" : "Not logged in"}
            </div>
            <div className="text-xs text-slate-500">
              {loggedIn ? "Account connected" : "Please sign in"}
            </div>
          </div>
          <button onClick={logout} title="Log out" aria-label="Log out">
            <LogOut className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b bg-white/90 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileMenu(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="text-xs text-slate-500">
                Workspace / {page}
              </div>
              <h1 className="mt-1 text-xl font-extrabold">{page}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border px-3 py-2 sm:flex">
              <Wallet className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-500">Balance</span>
              <span className="text-sm font-bold">{money(balance)}</span>
            </div>
            <button
              className="rounded-xl border p-2.5 hover:bg-slate-50"
              aria-label="Refresh data"
              onClick={() => void loadData()}
            >
              <Bell className="h-5 w-5 text-slate-500" />
            </button>
            <button
              onClick={() => goTo("Settings")}
              className="hidden items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold sm:flex"
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
                  <p className="mt-3 max-w-lg text-sm leading-6 text-indigo-100">
                    Manage services, submit orders and view your order history.
                  </p>
                  <button
                    onClick={() => goTo("New Order")}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-700"
                  >
                    <Plus className="h-4 w-4" /> Create New Order
                  </button>
                </div>
                <div className="pointer-events-none absolute -right-10 -top-24 h-80 w-80 rounded-full border-[35px] border-white/10" />
                <div className="pointer-events-none absolute right-12 top-10 hidden h-36 w-36 items-center justify-center rounded-3xl border border-white/20 bg-white/10 md:flex">
                  <TrendingUp className="h-20 w-20" />
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="rounded-2xl border bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">{stat.label}</span>
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <Icon className="h-5 w-5" />
                        </span>
                      </div>
                      <div className="mt-4 text-2xl font-extrabold">{stat.value}</div>
                      <div className="mt-1 text-xs text-slate-500">{stat.note}</div>
                    </div>
                  );
                })}
              </section>

              <section className="rounded-2xl border bg-white p-5 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold">Recent Orders</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Orders saved in your database
                    </p>
                  </div>
                  <button
                    onClick={() => goTo("Order History")}
                    className="text-xs font-bold text-indigo-600"
                  >
                    View all
                  </button>
                </div>
                {orders.length === 0 ? (
                  <div className="py-12 text-center">
                    <Package className="mx-auto h-8 w-8 text-slate-300" />
                    <div className="mt-4 text-sm font-bold">No orders yet</div>
                    <button
                      onClick={() => goTo("New Order")}
                      className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white"
                    >
                      Place an order
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                      >
                        <div>
                          <div className="text-sm font-bold">{order.service}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            #{order.id} · Qty {order.quantity}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold">{money(order.charge)}</div>
                          <span className="text-xs font-semibold text-amber-600">
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {page === "New Order" && (
            <div className="grid items-start gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <section className="rounded-2xl border bg-white p-5 md:p-7">
                <h2 className="text-xl font-extrabold">Create New Order</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select a service and enter your target URL and quantity.
                </p>

                {!loggedIn && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    Order submit karne se pehle Google login karo.
                    <a href="/login" className="ml-1 font-bold underline">Login</a>
                  </div>
                )}

                <div className="mt-6 space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-bold">Platform</label>
                    <select
                      value={platform}
                      onChange={(e) => {
                        const nextPlatform = e.target.value;
                        setPlatform(nextPlatform);
                        const nextService = services.find(
                          (s) => nextPlatform === "All Platforms" ||
                            s.platform === nextPlatform
                        );
                        setSelectedService(nextService ? String(nextService.id) : "");
                      }}
                      className="w-full rounded-xl border bg-white px-4 py-3 text-sm"
                    >
                      {["All Platforms", "Instagram", "YouTube", "Telegram", "TikTok"].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">Service</label>
                    {servicesLoading && <p className="text-sm text-slate-500">Loading services…</p>}
                    <select
                      disabled={servicesLoading || services.length === 0}
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full rounded-xl border bg-white px-4 py-3 text-sm"
                    >
                      {services
                        .filter((s) => platform === "All Platforms" || s.platform === platform)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.id} — {s.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">Target URL</label>
                    <input
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="https://instagram.com/yourprofile"
                      className="w-full rounded-xl border px-4 py-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">Quantity</label>
                    <input
                      type="number"
                      min={service?.min ?? 1}
                      max={service?.max ?? 1000000}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      disabled={!service}
                      className="w-full rounded-xl border px-4 py-3 text-sm"
                    />
                    <div className="mt-2 flex justify-between text-xs text-slate-500">
                      <span>Minimum: {service?.min ?? "—"}</span>
                      <span>Maximum: {service?.max ?? "—"}</span>
                    </div>
                  </div>

                  <button
                    onClick={placeOrder}
                    disabled={!service || servicesLoading || loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {loading ? "Submitting..." : "Submit Order"}
                  </button>
                  <p className="text-center text-xs text-slate-500">
                    Orders are submitted to your backend. Supplier fulfilment is not connected yet.
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border bg-white p-5 md:p-6">
                <h3 className="font-extrabold">Order Summary</h3>
                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <div className="text-xs text-slate-500">Selected service</div>
                  <div className="mt-1 text-sm font-bold">
                    {service?.name ?? "No service selected"}
                  </div>
                  <div className="mt-3 flex justify-between text-xs text-slate-500">
                    <span>Platform</span><span>{service?.platform ?? "—"}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-slate-500">
                    <span>Rate per 1,000</span><span>{service ? money(service.price) : "—"}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-slate-500">
                    <span>Quantity</span><span>{qty.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="mt-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">Estimated charge</span>
                      <span className="text-xl font-extrabold text-indigo-700">{money(charge)}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between text-sm">
                    <span>Wallet balance</span><strong>{money(balance)}</strong>
                  </div>
                </div>
              </section>
            </div>
          )}

          {page === "Services" && (
            <section className="rounded-2xl border bg-white">
              <div className="flex flex-col gap-4 border-b p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-extrabold">Service Catalogue</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {filteredServices.length} available services
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex items-center gap-2 rounded-xl border px-3">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search services..."
                      className="min-w-0 py-2.5 text-sm outline-none"
                    />
                  </div>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="rounded-xl border bg-white px-3 py-2.5 text-sm"
                  >
                    {["All Platforms", "Instagram", "YouTube", "Telegram", "TikTok"].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Service</th>
                      <th className="px-5 py-4">Platform</th>
                      <th className="px-5 py-4">Rate / 1K</th>
                      <th className="px-5 py-4">Min / Max</th>
                      <th className="px-5 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredServices.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <div className="font-bold">{s.name}</div>
                          <div className="mt-1 text-xs text-slate-500">ID: {s.id} · {s.category}</div>
                        </td>
                        <td className="px-5 py-4">{s.platform}</td>
                        <td className="px-5 py-4 font-bold">{money(s.price)}</td>
                        <td className="px-5 py-4 text-xs">{s.min} / {s.max}</td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => {
                              setSelectedService(String(s.id));
                              setPlatform("All Platforms");
                              goTo("New Order");
                            }}
                            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white"
                          >
                            Order
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredServices.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                          No matching services found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {page === "Order History" && (
            <section className="rounded-2xl border bg-white">
              <div className="flex items-center justify-between border-b p-5">
                <div>
                  <h2 className="text-lg font-extrabold">Order History</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Orders stored in your database
                  </p>
                </div>
                <button
                  onClick={() => void loadData()}
                  className="rounded-xl border px-4 py-2.5 text-xs font-bold"
                >
                  Refresh
                </button>
              </div>
              {!loggedIn ? (
                <p className="p-8 text-center text-sm text-slate-500">
                  Please log in to view your orders.
                </p>
              ) : orders.length === 0 ? (
                <div className="py-16 text-center">
                  <Clock3 className="mx-auto h-10 w-10 text-slate-300" />
                  <h3 className="mt-4 font-bold">No orders to show</h3>
                  <button
                    onClick={() => goTo("New Order")}
                    className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white"
                  >
                    Create an order
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-4">Order ID</th>
                        <th className="px-5 py-4">Service / URL</th>
                        <th className="px-5 py-4">Quantity</th>
                        <th className="px-5 py-4">Charge</th>
                        <th className="px-5 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {orders.map((o) => (
                        <tr key={o.id}>
                          <td className="px-5 py-4 font-mono text-xs">{o.id}</td>
                          <td className="px-5 py-4">
                            <div className="font-bold">{o.service}</div>
                            <a
                              className="mt-1 block max-w-xs truncate text-xs text-indigo-600"
                              href={o.link}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {o.link}
                            </a>
                          </td>
                          <td className="px-5 py-4">{o.quantity.toLocaleString("en-IN")}</td>
                          <td className="px-5 py-4 font-bold">{money(o.charge)}</td>
                          <td className="px-5 py-4">
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                              {o.status}
                            </span>
                          </td>
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
              <section className="rounded-2xl border bg-white p-5 md:p-7">
                <h2 className="text-xl font-extrabold">Add Funds</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Current database wallet balance
                </p>
                <div className="mt-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Current balance</span>
                    <Wallet className="h-5 w-5 text-indigo-300" />
                  </div>
                  <div className="mt-3 text-3xl font-extrabold">{money(balance)}</div>
                </div>
                <label className="mb-2 mt-6 block text-sm font-bold">Amount (INR)</label>
                <input
                  type="number"
                  min="100"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3 text-sm"
                />
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {["500", "1000", "2000"].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setFundAmount(amount)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-bold ${
                        fundAmount === amount
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-slate-200"
                      }`}
                    >
                      ₹{amount}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => notify("Payment gateway connected nahi hai. No money was charged.")}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white"
                >
                  <CreditCard className="h-4 w-4" /> Continue to Payment
                </button>
                <p className="mt-3 text-center text-xs text-slate-500">
                  Payment gateway setup pending. This button does not charge money.
                </p>
              </section>
              <section className="rounded-2xl border bg-white p-5 md:p-6">
                <h3 className="font-extrabold">Payment Methods</h3>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3 rounded-xl border p-4">
                    <CreditCard className="h-5 w-5 text-indigo-600" />
                    <div>
                      <div className="text-sm font-bold">UPI / QR</div>
                      <div className="mt-1 text-xs text-slate-500">Integration pending</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border p-4">
                    <Globe className="h-5 w-5 text-violet-600" />
                    <div>
                      <div className="text-sm font-bold">USDT BEP20</div>
                      <div className="mt-1 text-xs text-slate-500">Verification setup pending</div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {page === "Admin Panel" && (
            <section className="rounded-2xl border bg-white p-6">
              <ShieldCheck className="h-8 w-8 text-indigo-600" />
              <h2 className="mt-4 text-xl font-extrabold">Admin Panel</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                This page is a preview. Admin-only authorization, service management,
                supplier integration and payment reconciliation must be implemented
                securely before using this panel for real customers.
              </p>
            </section>
          )}

          {page === "Support" && (
            <section className="mx-auto max-w-2xl rounded-2xl border bg-white p-6 md:p-8">
              <CircleHelp className="h-8 w-8 text-indigo-600" />
              <h2 className="mt-4 text-xl font-extrabold">How can we help?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                For order issues, note your order ID and contact your support team.
                A support ticket system has not been configured yet.
              </p>
            </section>
          )}

          {page === "Settings" && (
            <section className="max-w-2xl rounded-2xl border bg-white p-5 md:p-7">
              <h2 className="text-xl font-extrabold">Workspace Settings</h2>
              <p className="mt-2 text-sm text-slate-500">
                Account actions and preferences.
              </p>
              <button
                onClick={logout}
                className="mt-6 flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </section>
          )}

          <footer className="mt-10 flex flex-col justify-between gap-2 border-t py-5 text-xs text-slate-400 sm:flex-row">
            <span>© 2026 SMM Roy</span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Supplier API and payment gateway not connected
              <ArrowUpRight className="h-3 w-3" />
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
