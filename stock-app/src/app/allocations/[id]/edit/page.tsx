"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
    id: number;
    lotNumber: string;
    productionDate: string;
    itemId: number;
    item: {
      id: number;
      code: string;
      name: string;
    };
  };
  warehouse: {
    id: number;
    name: string;
  };
  unit: {
    id: number;
    name: string;
  };
  inventoryQuantity: number;
  otherAllocationsQuantity: number;
  availableQuantity: number;
}

interface AllocationFormData {
  quantity: number;
  allocationDate: string;
  referenceNumber: string;
}

export default function EditAllocation() {
  const params = useParams();
  const router = useRouter();
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [formData, setFormData] = useState<AllocationFormData>({
    quantity: 0,
    allocationDate: "",
    referenceNumber: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllocation = async () => {
      try {
        const response = await fetch(`/api/allocations/${params.id}`);
        if (!response.ok) {
          throw new Error("引当データの取得に失敗しました");
        }
        const data = await response.json();
        setAllocation(data);

        // フォームデータの初期化
        setFormData({
          quantity: data.quantity,
          allocationDate: new Date(data.allocationDate).toISOString().split('T')[0],
          referenceNumber: data.referenceNumber || "",
        });
      } catch (err) {
        console.error("引当データの取得エラー:", err);
        setError("引当データの取得に失敗しました。再度お試しください。");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAllocation();
    }
  }, [params.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "quantity" ? parseFloat(value) || 0 : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // バリデーション
      if (formData.quantity <= 0) {
        throw new Error("数量は0より大きい値を入力してください");
      }

      // 在庫チェック
      if (!allocation) {
        throw new Error("引当データが見つかりません");
      }

      // 最大引当可能数量 = 在庫数量 - 他の引当数量
      const maxAllowedQuantity = allocation.inventoryQuantity - allocation.otherAllocationsQuantity;
      if (formData.quantity > maxAllowedQuantity) {
        throw new Error(`引当数量が有効在庫数量を超えています（最大引当可能数量: ${maxAllowedQuantity}）`);
      }

      const response = await fetch(`/api/allocations/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "引当の更新に失敗しました");
      }

      // 更新成功
      router.push(`/allocations/${params.id}`);
    } catch (err: any) {
      console.error("引当更新エラー:", err);
      setError(err.message || "引当の更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="引当編集">
      <div className="mb-6">
        <Link
          href={`/allocations/${params.id}`}
          className="text-indigo-600 hover:text-indigo-800"
        >
          ← 引当詳細に戻る
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : allocation ? (
        <div>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                引当情報
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">商品</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {allocation.lot.item.code} - {allocation.lot.item.name}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">ロット</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {allocation.lot.lotNumber} ({new Date(allocation.lot.productionDate).toLocaleDateString()})
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">倉庫</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {allocation.warehouse.name}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">単位</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {allocation.unit.name}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">在庫情報</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="bg-blue-50 p-3 rounded">
                      <ul className="text-sm">
                        <li className="mb-1">
                          <span className="font-medium">在庫数量:</span> {allocation.inventoryQuantity} {allocation.unit.name}
                        </li>
                        <li className="mb-1">
                          <span className="font-medium">他の引当数量:</span> {allocation.otherAllocationsQuantity} {allocation.unit.name}
                        </li>
                        <li>
                          <span className="font-medium">有効在庫数量:</span> {allocation.availableQuantity} {allocation.unit.name}
                        </li>
                      </ul>
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="allocationDate"
              >
                引当日 *
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="allocationDate"
                type="date"
                name="allocationDate"
                value={formData.allocationDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="quantity"
              >
                数量 *
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="quantity"
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                step="0.01"
                min="0.01"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                最大引当可能数量: {allocation.inventoryQuantity - allocation.otherAllocationsQuantity} {allocation.unit.name}
              </p>
            </div>
            <div className="mb-6">
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
                value={formData.referenceNumber}
                onChange={handleChange}
                placeholder="受注番号など"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="submit"
                disabled={saving}
              >
                {saving ? "保存中..." : "保存"}
              </button>
              <Link
                href={`/allocations/${params.id}`}
                className="inline-block align-baseline font-bold text-sm text-indigo-600 hover:text-indigo-800"
              >
                キャンセル
              </Link>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          引当データが見つかりません。
        </div>
      )}
    </Layout>
  );
}