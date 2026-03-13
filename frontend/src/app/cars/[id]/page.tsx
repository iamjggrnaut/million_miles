"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { fetchCar, isAuthenticated, type Car } from "@/lib/api";

function formatPrice(price: number | null): string {
  if (price == null) return "—";
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)} млн ¥`;
  return `${price.toLocaleString()} ¥`;
}

function formatMileage(km: number | null): string {
  if (km == null) return "—";
  return `${km.toLocaleString()} км`;
}

const SPEC_LABELS: Record<string, string> = {
  brand: "Марка",
  model: "Модель",
  year: "Год",
  mileage_km: "Пробег",
  price_jpy: "Цена (¥)",
  price_total_jpy: "Цена с учётом (¥)",
  body_type: "Тип кузова",
  color: "Цвет",
  transmission: "КПП",
  fuel_type: "Топливо",
  drive_type: "Привод",
  dealer_name: "Дилер",
  region: "Регион",
};

export default function CarDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const [mounted, setMounted] = useState(false);
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    if (Number.isNaN(id) || id < 1) {
      setError("Неверный ID");
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchCar(id)
      .then((c) => {
        if (!cancelled) setCar(c);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Ошибка загрузки");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mounted, router, id]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-500">Загрузка...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-500">Загрузка...</p>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-red-600">{error || "Авто не найдено"}</p>
        <Link href="/cars" className="text-blue-600 hover:underline">
          ← К каталогу
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <Link href="/cars" className="text-zinc-600 hover:text-zinc-900 text-sm">
            ← Каталог
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <h1 className="text-2xl font-semibold text-zinc-900 mb-6">
          {car.brand} {car.model_ru ?? car.model_en ?? car.model}
        </h1>

        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden mb-6">
          {car.photos && car.photos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              <div className="aspect-[4/3] sm:aspect-auto sm:row-span-2">
                <img
                  src={car.photos[0]}
                  alt=""
                  className="w-full h-full object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
              {car.photos.slice(1, 5).map((url: string, i: number) => (
                <div key={i} className="aspect-[4/3] hidden sm:block">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="aspect-[4/3] bg-zinc-100 flex items-center justify-center text-zinc-400">
              Нет фото
            </div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100">
            <h2 className="font-medium text-zinc-900">Характеристики</h2>
          </div>
          <dl className="divide-y divide-zinc-100">
            {[
              { key: "year", value: car.year != null ? `${car.year} г.` : null },
              { key: "mileage_km", value: formatMileage(car.mileage_km) },
              { key: "price_jpy", value: formatPrice(car.price_jpy) },
              { key: "price_total_jpy", value: formatPrice(car.price_total_jpy) },
              { key: "body_type", value: car.body_type },
              { key: "color", value: car.color },
              { key: "transmission", value: car.transmission },
              { key: "fuel_type", value: car.fuel_type },
              { key: "drive_type", value: car.drive_type },
              { key: "dealer_name", value: car.dealer_name_ru ?? car.dealer_name_en ?? car.dealer_name },
              { key: "region", value: car.region_ru ?? car.region_en ?? car.region },
            ].map(
              (item) =>
                item.value != null && item.value !== "—" && (
                  <div key={item.key} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <dt className="text-sm text-zinc-500 sm:w-40">{SPEC_LABELS[item.key] ?? item.key}</dt>
                    <dd className="text-zinc-900 font-medium">{item.value}</dd>
                  </div>
                )
            )}
          </dl>
          {(!(car.dealer_name_ru ?? car.dealer_name_en) && car.dealer_name) ||
          (!(car.region_ru ?? car.region_en) && car.region) ? (
            <p className="px-4 py-2 text-xs text-zinc-400 border-t border-zinc-100">
              Дилер/регион на японском — для перевода запустите воркер с Argos и перезапустите скрап.
            </p>
          ) : null}
        </div>

        {(car.description_ru ?? car.description_en ?? car.description) && (
          <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="font-medium text-zinc-900 mb-2">Описание</h2>
            <p className="text-zinc-600 text-sm whitespace-pre-wrap">
              {car.description_ru ?? car.description_en ?? car.description}
            </p>
            {!(car.description_ru ?? car.description_en) && (
              <p className="mt-2 text-xs text-zinc-400">
                Перевод недоступен. Для перевода на русский запустите воркер с Argos и перезапустите скрап.
              </p>
            )}
          </div>
        )}

        {car.source_url && (
          <p className="mt-4 text-sm">
            <a
              href={car.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Открыть на CarSensor →
            </a>
          </p>
        )}
      </main>
    </div>
  );
}
