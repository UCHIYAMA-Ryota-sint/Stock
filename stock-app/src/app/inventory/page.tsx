"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Link from "next/link";

interface Inventory {
  id: number;
  lotId: number;
  warehouseId: number;
  quantity: number;
  unitId: number;
  lot: {
    id: number;
    lotNumber: string;
    item: {
      id: number;
      code: string;
      name: string;
      itemType: string;
    };
  };
  warehouse: {
    id: number;
    code: string;
    name: string;
  };
  unit: {
    id: number;
    name: string;
  };
  allocatedQuantity?: number;
  availableQuantity?: number;
}

export default function InventoryList() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    itemName: "",
    warehouseName: "",
    lotNumber: "",
  });

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch("/api/inventory");
        if (!response.ok) {
          throw new Error("在庫データの取得に失敗しました");
        }
        const data = await response.json();

        // 引当情報を取得
        const allocationsResponse = await fetch("/api/allocations");
        if (!allocationsResponse.ok) {
          throw new Error("引当データの取得に失敗しました");
        }
        const allocationsData = await allocationsResponse.json();

        // 在庫データに引当情報を追加
        const inventoryWithAllocations = data.map((item: Inventory) => {
          // この在庫に対する引当を検索
          const matchingAllocations = allocationsData.filter(
            (alloc: any) =>
              alloc.lotId === item.lotId &&
              alloc.warehouseId === item.warehouseId &&
              alloc.unitId === item.unitId
          );

          // 引当数量の合計を計算
          const allocatedQuantity = matchingAllocations.reduce(
            (sum: number, alloc: any) => sum + alloc.quantity,
            0
          );

          // 有効在庫数量を計算
          const availableQuantity = item.quantity - allocatedQuantity;

          return {
            ...item,
            allocatedQuantity,
            availableQuantity,
          };
        });

        setInventory(inventoryWithAllocations);
      } catch (err) {
        console.error("在庫データの取得エラー:", err);
        setError("在庫データの取得に失敗しました。再度お試しください。");
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFilter({
      ...filter,
      [name]: value,
    });
  };

  const filteredInventory = inventory.filter((item) => {
    return (
      item.lot.item.name
        .toLowerCase()
        .includes(filter.itemName.toLowerCase()) &&
      item.warehouse.name
        .toLowerCase()
        .includes(filter.warehouseName.toLowerCase()) &&
      item.lot.lotNumber
        .toLowerCase()
        .includes(filter.lotNumber.toLowerCase())
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
    <Layout title="在庫管理">
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-700">
          現在の在庫状況を確認・管理することができます。
        </p>
        <Link
          href="/inventory/register"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
        >
          在庫登録
        </Link>
      </div>

      {/* フィルター */}
      <div className="mb-6 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">検索フィルター</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="lotNumber"
            >
              ロット番号
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="lotNumber"
              type="text"
              name="lotNumber"
              value={filter.lotNumber}
              onChange={handleFilterChange}
              placeholder="ロット番号で検索"
            />
          </div>
        </div>
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
          在庫データがありません。「在庫登録」ボタンから在庫を登録してください。
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  商品コード
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  商品名
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  種類
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  ロット番号
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  倉庫
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  在庫数量
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  引当数量
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  有効在庫数量
                </th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {item.lot.item.code}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {item.lot.item.name}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {getItemTypeName(item.lot.item.itemType)}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {item.lot.lotNumber}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {item.warehouse.name}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {item.quantity} {item.unit.name}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {item.allocatedQuantity} {item.unit.name}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {item.availableQuantity} {item.unit.name}
                  </td>
                  <td className="py-4 px-4 text-sm text-center">
                    <div className="flex justify-center space-x-2">
                      <Link
                        href={`/inventory/item/${item.lot.item.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        商品別
                      </Link>
                      <Link
                        href={`/inventory/warehouse/${item.warehouse.id}`}
                        className="text-green-600 hover:text-green-900"
                      >
                        倉庫別
                      </Link>
                      <Link
                        href={`/inventory/lot/${item.lot.id}`}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        ロット別
                      </Link>
                    </div>
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