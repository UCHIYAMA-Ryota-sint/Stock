"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import Link from "next/link";
import { ItemType } from "@prisma/client";

interface Item {
  id: number;
  code: string;
  name: string;
  description: string | null;
  itemType: ItemType;
  createdAt: string;
  updatedAt: string;
  itemUnits: {
    id: number;
    itemId: number;
    unitId: number;
    conversionRate: number;
    isDefault: boolean;
    unit: {
      id: number;
      name: string;
    };
  }[];
  lots: {
    id: number;
    lotNumber: string;
    productionDate: string;
  }[];
}

export default function ItemDetail() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(`/api/items/${params.id}`);
        if (!response.ok) {
          throw new Error("商品データの取得に失敗しました");
        }
        const data = await response.json();
        setItem(data);
      } catch (err) {
        console.error("商品データの取得エラー:", err);
        setError("商品データの取得に失敗しました。再度お試しください。");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchItem();
    }
  }, [params.id]);

  const getItemTypeName = (type: ItemType) => {
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
    if (!confirm("この商品を削除してもよろしいですか？")) {
      return;
    }

    try {
      const response = await fetch(`/api/items/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "商品の削除に失敗しました");
      }

      // 削除成功後、商品一覧ページに遷移
      router.push("/master/items");
    } catch (err: any) {
      console.error("商品削除エラー:", err);
      alert(err.message || "商品の削除に失敗しました");
    }
  };

  return (
    <Layout title="商品詳細">
      <div className="mb-6">
        <Link
          href="/master/items"
          className="text-indigo-600 hover:text-indigo-800"
        >
          ← 商品一覧に戻る
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
      ) : item ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                商品情報
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                商品の詳細情報
              </p>
            </div>
            <div className="flex space-x-2">
              <Link
                href={`/master/items/${item.id}/edit`}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
              >
                編集
              </Link>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                削除
              </button>
            </div>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">商品コード</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {item.code}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">商品名</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {item.name}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">種類</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {getItemTypeName(item.itemType)}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">説明</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {item.description || "-"}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">単位</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {item.itemUnits.length > 0 ? (
                    <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                      {item.itemUnits.map((itemUnit) => (
                        <li
                          key={itemUnit.id}
                          className="pl-3 pr-4 py-3 flex items-center justify-between text-sm"
                        >
                          <div className="w-0 flex-1 flex items-center">
                            <span className="ml-2 flex-1 w-0 truncate">
                              {itemUnit.unit.name}
                              {itemUnit.isDefault && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  デフォルト
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <span className="font-medium">
                              換算率: {itemUnit.conversionRate}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-500">単位が設定されていません</span>
                  )}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">ロット</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {item.lots && item.lots.length > 0 ? (
                    <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                      {item.lots.map((lot) => (
                        <li
                          key={lot.id}
                          className="pl-3 pr-4 py-3 flex items-center justify-between text-sm"
                        >
                          <div className="w-0 flex-1 flex items-center">
                            <span className="ml-2 flex-1 w-0 truncate">
                              {lot.lotNumber}
                            </span>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <span className="font-medium">
                              {new Date(lot.productionDate).toLocaleDateString()}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-500">ロットが登録されていません</span>
                  )}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">登録日時</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(item.createdAt).toLocaleString()}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">更新日時</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(item.updatedAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          商品が見つかりません。
        </div>
      )}
    </Layout>
  );
}