"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Link from "next/link";

interface DashboardStats {
  totalItems: number;
  totalWarehouses: number;
  totalInventory: number;
  lowStockItems: number;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    totalWarehouses: 0,
    totalInventory: 0,
    lowStockItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 商品数の取得
        const itemsResponse = await fetch("/api/items");
        const itemsData = await itemsResponse.json();

        // 倉庫数の取得
        const warehousesResponse = await fetch("/api/warehouses");
        const warehousesData = await warehousesResponse.json();

        // 在庫データの取得
        const inventoryResponse = await fetch("/api/inventory");
        const inventoryData = await inventoryResponse.json();

        // 統計データの計算
        const totalItems = itemsData.length || 0;
        const totalWarehouses = warehousesData.length || 0;
        const totalInventory = inventoryData.length || 0;

        // 在庫が少ない商品の数（仮の実装）
        const lowStockItems = inventoryData.filter(
          (item: any) => item.quantity < 10
        ).length;

        setStats({
          totalItems,
          totalWarehouses,
          totalInventory,
          lowStockItems,
        });
      } catch (err) {
        console.error("ダッシュボードデータの取得に失敗しました", err);
        setError("データの取得に失敗しました。再度お試しください。");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const dashboardItems = [
    {
      title: "マスタ管理",
      description: "商品、単位、倉庫、ロットのマスタデータを管理します",
      link: "/master",
      color: "bg-blue-500",
    },
    {
      title: "在庫管理",
      description: "現在の在庫状況を確認・管理します",
      link: "/inventory",
      color: "bg-green-500",
    },
    {
      title: "入出庫管理",
      description: "入庫・出庫の登録と履歴の確認を行います",
      link: "/transactions",
      color: "bg-yellow-500",
    },
    {
      title: "月次在庫",
      description: "月次在庫の計算と照会を行います",
      link: "/monthly",
      color: "bg-purple-500",
    },
    {
      title: "在庫引当",
      description: "出荷予定に対する在庫の引当を管理します",
      link: "/allocations",
      color: "bg-pink-500",
    },
    {
      title: "レポート",
      description: "在庫一覧や在庫推移などのレポートを出力します",
      link: "/reports",
      color: "bg-indigo-500",
    },
  ];

  return (
    <Layout title="ダッシュボード">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : (
        <>
          {/* 統計情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    登録商品数
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {stats.totalItems}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    登録倉庫数
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {stats.totalWarehouses}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    在庫アイテム数
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {stats.totalInventory}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    在庫少アイテム
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {stats.lowStockItems}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          {/* 機能一覧 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardItems.map((item) => (
              <Link
                key={item.title}
                href={item.link}
                className="block group"
              >
                <div className="bg-white overflow-hidden shadow rounded-lg transition-all duration-200 transform group-hover:shadow-lg group-hover:-translate-y-1">
                  <div className={`h-2 ${item.color}`}></div>
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </Layout>
  );
}
