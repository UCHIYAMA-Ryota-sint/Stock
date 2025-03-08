"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Link from "next/link";

interface MonthlyInventory {
  id: number;
  itemId: number;
  lotId: number;
  warehouseId: number;
  unitId: number;
  month: string;
  openingQuantity: number;
  incomingQuantity: number;
  outgoingQuantity: number;
  closingQuantity: number;
  item: {
    id: number;
    code: string;
    name: string;
    itemType: string;
  };
  lot: {
    id: number;
    lotNumber: string;
  };
  warehouse: {
    id: number;
    name: string;
  };
  unit: {
    id: number;
    name: string;
  };
}

export default function MonthlyInventoryList() {
  const [monthlyInventory, setMonthlyInventory] = useState<MonthlyInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
    itemName: "",
    warehouseName: "",
  });
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    // 利用可能な年のリストを生成（現在から3年前まで）
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 4; i++) {
      years.push(currentYear - i);
    }
    setAvailableYears(years);

    fetchMonthlyInventory();
  }, []);

  const fetchMonthlyInventory = async () => {
    try {
      setLoading(true);
      // クエリパラメータの構築
      const queryParams = new URLSearchParams();
      if (filter.year && filter.month) {
        queryParams.append("year", filter.year);
        queryParams.append("month", filter.month);
      }

      const response = await fetch(`/api/monthly-inventory?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error("月次在庫データの取得に失敗しました");
      }
      const data = await response.json();
      setMonthlyInventory(data);
    } catch (err) {
      console.error("月次在庫データの取得エラー:", err);
      setError("月次在庫データの取得に失敗しました。再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilter({
      ...filter,
      [name]: value,
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMonthlyInventory();
  };

  const calculateMonthlyInventory = async () => {
    try {
      setCalculating(true);
      const response = await fetch(`/api/monthly-inventory/calculate/${filter.year}/${filter.month}`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "月次在庫計算に失敗しました");
      }

      // 計算成功後、データを再取得
      fetchMonthlyInventory();
    } catch (err: any) {
      console.error("月次在庫計算エラー:", err);
      setError(err.message || "月次在庫計算に失敗しました");
    } finally {
      setCalculating(false);
    }
  };

  const filteredInventory = monthlyInventory.filter((item) => {
    return (
      item.item.name
        .toLowerCase()
        .includes(filter.itemName.toLowerCase()) &&
      item.warehouse.name
        .toLowerCase()
        .includes(filter.warehouseName.toLowerCase())
    );
  });

  const getItemTypeName = (type: string) => {
    switch (type) {
      case "MANUFACTURED":
        return "製造品";
      case "EXTERNAL":
        return "社外品";
      case "RAW_MATERIAL":
        return "原材料";
      default:
        return type;
    }
  };

  return (
    <Layout title="月次在庫管理">
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-700">
          月次在庫の計算と照会を行うことができます。
        </p>
        <Link
          href={`/monthly/${filter.year}/${filter.month}`}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
        >
          詳細表示
        </Link>
      </div>

      {/* フィルター */}
      <div className="mb-6 bg-white p-4 rounded shadow">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="year"
              >
                年
              </label>
              <select
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="year"
                name="year"
                value={filter.year}
                onChange={handleFilterChange}
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}年
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="month"
              >
                月
              </label>
              <select
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="month"
                name="month"
                value={filter.month}
                onChange={handleFilterChange}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month.toString().padStart(2, '0')}>
                    {month}月
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="itemName"
              >
                商品名
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="itemName"
                type="text"
                name="itemName"
                value={filter.itemName}
                onChange={handleFilterChange}
                placeholder="商品名で検索"
              />
            </div>
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="warehouseName"
              >
                倉庫名
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="warehouseName"
                type="text"
                name="warehouseName"
                value={filter.warehouseName}
                onChange={handleFilterChange}
                placeholder="倉庫名で検索"
              />
            </div>
          </div>
          <div className="flex justify-between">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              検索
            </button>
            <button
              type="button"
              onClick={calculateMonthlyInventory}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={calculating}
            >
              {calculating ? "計算中..." : "月次在庫計算"}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          月次在庫データがありません。「月次在庫計算」ボタンをクリックして計算してください。
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  商品
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  ロット番号
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  倉庫
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  単位
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  期首在庫
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  入庫数量
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  出庫数量
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  期末在庫
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{item.item.name}</div>
                      <div className="text-gray-500 text-xs">
                        {item.item.code} ({getItemTypeName(item.item.itemType)})
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {item.lot.lotNumber}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {item.warehouse.name}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {item.unit.name}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {item.openingQuantity}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {item.incomingQuantity}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {item.outgoingQuantity}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {item.closingQuantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}