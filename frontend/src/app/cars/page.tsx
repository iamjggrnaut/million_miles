"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  fetchCars,
  logout,
  isAuthenticated,
  type Car,
  type CarsQuery,
} from "@/lib/api";

function formatPrice(price: number | null): string {
  if (price == null) return "—";
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)} млн ¥`;
  return `${price.toLocaleString()} ¥`;
}

function formatMileage(km: number | null): string {
  if (km == null) return "—";
  return `${km.toLocaleString()} км`;
}

const BRANDS = [
  "Toyota",
  "Nissan",
  "Honda",
  "Mazda",
  "Subaru",
  "Mitsubishi",
  "Mercedes-Benz",
  "BMW",
  "Lexus",
];

export default function CarsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<{
    items: Car[];
    total: number;
    page: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<CarsQuery>({
    page: 1,
    limit: 12,
    sort: "created",
    order: "desc",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchCars(params)
      .then((res) => {
        if (!cancelled)
          setData({
            items: res.items,
            total: res.total,
            page: res.page,
            totalPages: res.totalPages,
          });
      })
      .catch(() => {
        if (!cancelled)
          setData({ items: [], total: 0, page: 1, totalPages: 0 });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mounted, router, params]);

  const updateParams = (next: Partial<CarsQuery>) => {
    setParams((p) => ({ ...p, ...next, page: 1 }));
  };

  const clearFilters = () => {
    setParams((p) => ({
      ...p,
      page: 1,
      brand: undefined,
      year_min: undefined,
      year_max: undefined,
      price_min: undefined,
      price_max: undefined,
      mileage_max: undefined,
    }));
  };

  const hasFilters =
    params.brand != null ||
    params.year_min != null ||
    params.year_max != null ||
    params.price_min != null ||
    params.price_max != null ||
    params.mileage_max != null;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-500">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href="/cars" className="font-semibold text-zinc-900">
            Million Miles
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
            }}
            className="text-sm text-zinc-600 hover:text-zinc-900"
          >
            Выйти
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-xl font-semibold text-zinc-900">
              Каталог автомобилей
            </h1>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={() => setFiltersOpen((o) => !o)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-1"
              >
                Фильтры {hasFilters ? "(есть)" : ""}
              </button>
              <select
                value={`${params.sort ?? "created"}-${params.order ?? "desc"}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split("-") as [
                    CarsQuery["sort"],
                    "asc" | "desc",
                  ];
                  updateParams({ sort, order });
                }}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="created-desc">Новые сначала</option>
                <option value="created-asc">Старые сначала</option>
                <option value="price-asc">Цена: по возрастанию</option>
                <option value="price-desc">Цена: по убыванию</option>
                <option value="year-desc">Год: новые</option>
                <option value="year-asc">Год: старые</option>
                <option value="mileage-asc">Пробег: меньше</option>
                <option value="mileage-desc">Пробег: больше</option>
              </select>
            </div>
          </div>

          {filtersOpen && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Марка
                </label>
                <select
                  value={params.brand ?? ""}
                  onChange={(e) =>
                    updateParams({
                      brand: e.target.value || undefined,
                    })
                  }
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                >
                  <option value="">Все</option>
                  {BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Год от
                </label>
                <input
                  type="number"
                  min={1990}
                  max={2030}
                  value={params.year_min ?? ""}
                  onChange={(e) =>
                    updateParams({
                      year_min: e.target.value
                        ? parseInt(e.target.value, 10)
                        : undefined,
                    })
                  }
                  placeholder="—"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Год до
                </label>
                <input
                  type="number"
                  min={1990}
                  max={2030}
                  value={params.year_max ?? ""}
                  onChange={(e) =>
                    updateParams({
                      year_max: e.target.value
                        ? parseInt(e.target.value, 10)
                        : undefined,
                    })
                  }
                  placeholder="—"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Цена до (¥)
                </label>
                <input
                  type="number"
                  min={0}
                  value={params.price_max ?? ""}
                  onChange={(e) =>
                    updateParams({
                      price_max: e.target.value
                        ? parseInt(e.target.value, 10)
                        : undefined,
                    })
                  }
                  placeholder="—"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Пробег до (км)
                </label>
                <input
                  type="number"
                  min={0}
                  value={params.mileage_max ?? ""}
                  onChange={(e) =>
                    updateParams({
                      mileage_max: e.target.value
                        ? parseInt(e.target.value, 10)
                        : undefined,
                    })
                  }
                  placeholder="—"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm text-zinc-600 hover:text-zinc-900"
                >
                  Сбросить фильтры
                </button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-200 bg-white overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-zinc-200" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-zinc-200 rounded w-3/4" />
                  <div className="h-4 bg-zinc-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : data ? (
          <>
            <p className="text-sm text-zinc-500 mb-4">
              Найдено: {data.total}{" "}
              {data.total === 1 ? "авто" : "авто"}
            </p>
            {data.items.length === 0 ? (
              <p className="py-12 text-center text-zinc-500">
                Нет объявлений. Запустите воркер парсинга или измените фильтры.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.items.map((car) => (
                  <Link
                    key={car.id}
                    href={`/cars/${car.id}`}
                    className="group rounded-xl border border-zinc-200 bg-white overflow-hidden hover:shadow-md hover:border-zinc-300 transition-all"
                  >
                    <div className="aspect-[4/3] bg-zinc-100 relative overflow-hidden">
                      {car.photos?.[0] ? (
                        <img
                          src={car.photos[0]}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">
                          Нет фото
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h2 className="font-medium text-zinc-900 truncate">
                        {car.brand} {car.model_ru ?? car.model_en ?? car.model}
                      </h2>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0 text-sm text-zinc-500">
                        {car.year != null && <span>{car.year} г.</span>}
                        {car.mileage_km != null && (
                          <span>{formatMileage(car.mileage_km)}</span>
                        )}
                      </div>
                      <p className="mt-2 font-semibold text-zinc-900">
                        {formatPrice(car.price_jpy ?? car.price_total_jpy)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {data.totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  type="button"
                  disabled={params.page <= 1}
                  onClick={() =>
                    setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))
                  }
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50"
                >
                  Назад
                </button>
                <span className="flex items-center px-4 text-sm text-zinc-600">
                  {params.page} / {data.totalPages}
                </span>
                <button
                  type="button"
                  disabled={(params.page ?? 1) >= data.totalPages}
                  onClick={() =>
                    setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))
                  }
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50"
                >
                  Вперёд
                </button>
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
