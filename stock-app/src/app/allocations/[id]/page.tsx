"use client";

import { useEffect, useState } from "react";
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
  createdAt: string;
  updatedAt: string;
  lot: {
    id: number;
    lotNumber: string;
    productionDate: string;
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
  inventoryQuantity: number;
  otherAllocationsQuantity: number;
  availableQuantity: number;
}

export default function AllocationDetail() {
  const params = useParams();
  const router = useRouter();
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchAllocation = async () => {
      try {
        const response = await fetch(`/api/allocations/${params.id}`);
        if (!response.ok) {
          throw new Error("引当データの取得に失敗しました");
        }
        const data = await response.json();
        setAllocation(data);
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

  const handleDelete = async () => {
    if (!confirm("この引当を解除してもよろしいですか？")) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/allocations/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "引当の解除に失敗しました");
      }

      // 削除成功後、引当一覧ページに遷移
      router.push("/allocations");
    } catch (err: any) {
      console.error("引当解除エラー:", err);
      setError(err.message || "引当の解除に失敗しました");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout title="引当詳細">
      <div className="mb-6">
        <Link
          href="/allocations"
          className="text-indigo-600 hover:text-indigo-800"
        >
          ← 引当一覧に戻る
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : allocation ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                引当情報
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                ID: {allocation.id}
              </p>
            </div>
            <div className="flex space-x-2">
              <Link
                href={`/allocations/${allocation.id}/edit`}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
              >
                編集
              </Link>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                disabled={deleting}
              >
                {deleting ? "処理中..." : "引当解除"}
              </button>
            </div>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">引当日</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(allocation.allocationDate).toLocaleDateString()}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">商品</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="font-medium">
                    {allocation.lot.item.name}
                  </div>
                  <div className="text-gray-500">
                    {allocation.lot.item.code} ({getItemTypeName(allocation.lot.item.itemType)})
                  </div>
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">ロット</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div>
                    {allocation.lot.lotNumber}
                  </div>
                  <div className="text-gray-500">
                    製造日/入荷日: {new Date(allocation.lot.productionDate).toLocaleDateString()}
                  </div>
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">倉庫</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {allocation.warehouse.name} ({allocation.warehouse.code})
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">数量</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {allocation.quantity} {allocation.unit.name}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">参照番号</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {allocation.referenceNumber || "-"}
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
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">登録日時</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(allocation.createdAt).toLocaleString()}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">更新日時</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(allocation.updatedAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          引当データが見つかりません。
        </div>
      )}
    </Layout>
  );
}