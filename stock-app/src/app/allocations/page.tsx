"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Link from "next/link";

interface Allocation {
  id: number;
  lotId: number;
  warehouseId: number;
  quantity: number;
  unitId: number;
  referenceNumber: string | null;
  allocationDate: string;
  lot: {
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
}

export default function AllocationsList() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    itemName: "",
    warehouseName: "",
    referenceNumber: "",
  });

  useEffect(() => {
    const fetchAllocations = async () => {
      try {
        const response = await fetch("/api/allocations");
        if (!response.ok) {
          throw new Error("引当データの取得に失敗しました");
        }
        const data = await response.json();
        setAllocations(data);
      } catch (err) {
        console.error("引当データの取得エラー:", err);
        setError("引当データの取得に失敗しました。再度お試しください。");
      } finally {
        setLoading(false);
      }
    };

    fetchAllocations();
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

  const filteredAllocations = allocations.filter((allocation) => {
    return (
      allocation.lot.item.name
        .toLowerCase()
        .includes(filter.itemName.toLowerCase()) &&
      allocation.warehouse.name
        .toLowerCase()
        .includes(filter.warehouseName.toLowerCase()) &&
      (allocation.referenceNumber || "")
        .toLowerCase()
        .includes(filter.referenceNumber.toLowerCase())
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

  const handleDelete = async (id: number) => {
    if (!confirm("この引当を解除してもよろしいですか？")) {
      return;
    }

    try {
      const response = await fetch(`/api/allocations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "引当の解除に失敗しました");
      }

      // 削除成功後、引当リストを更新
      setAllocations(allocations.filter((allocation) => allocation.id !== id));
    } catch (err: any) {
      console.error("引当解除エラー:", err);
      alert(err.message || "引当の解除に失敗しました");
    }
  };

  return (
    <Layout title="在庫引当管理">
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-700">
          出荷予定に対する在庫の引当を管理することができます。
        </p>
        <Link
          href="/allocations/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
        >
          引当登録
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
              htmlFor="referenceNumber"
            >
              参照番号
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="referenceNumber"
              type="text"
              name="referenceNumber"
              value={filter.referenceNumber}
              onChange={handleFilterChange}
              placeholder="参照番号で検索"
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
      ) : filteredAllocations.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          引当データがありません。「引当登録」ボタンから引当を登録してください。
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  引当日
                </th>
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
                  数量
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  参照番号
                </th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAllocations.map((allocation) => (
                <tr key={allocation.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {new Date(allocation.allocationDate).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{allocation.lot.item.name}</div>
                      <div className="text-gray-500 text-xs">
                        {allocation.lot.item.code} ({getItemTypeName(allocation.lot.item.itemType)})
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {allocation.lot.lotNumber}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {allocation.warehouse.name}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {allocation.quantity} {allocation.unit.name}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {allocation.referenceNumber || "-"}
                  </td>
                  <td className="py-4 px-4 text-sm text-center">
                    <div className="flex justify-center space-x-2">
                      <Link
                        href={`/allocations/${allocation.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        詳細
                      </Link>
                      <Link
                        href={`/allocations/${allocation.id}/edit`}
                        className="text-green-600 hover:text-green-900"
                      >
                        編集
                      </Link>
                      <button
                        onClick={() => handleDelete(allocation.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        解除
                      </button>
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