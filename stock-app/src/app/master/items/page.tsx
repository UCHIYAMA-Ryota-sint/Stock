"use client";

import { useEffect, useState } from "react";
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
}

export default function ItemsList() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("/api/items");
        if (!response.ok) {
          throw new Error("商品データの取得に失敗しました");
        }
        const data = await response.json();
        setItems(data);
      } catch (err) {
        console.error("商品データの取得エラー:", err);
        setError("商品データの取得に失敗しました。再度お試しください。");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

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

  const handleDelete = async (id: number) => {
    if (!confirm("この商品を削除してもよろしいですか？")) {
      return;
    }

    try {
      const response = await fetch(`/api/items/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "商品の削除に失敗しました");
      }

      // 削除成功後、商品リストを更新
      setItems(items.filter((item) => item.id !== id));
    } catch (err: any) {
      console.error("商品削除エラー:", err);
      alert(err.message || "商品の削除に失敗しました");
    }
  };

  return (
    <Layout title="商品マスタ">
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-700">
          商品の登録・編集・削除を行うことができます。
        </p>
        <Link
          href="/master/items/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
        >
          新規登録
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
      ) : items.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          商品が登録されていません。「新規登録」ボタンから商品を登録してください。
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
                  説明
                </th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 text-sm text-gray-900">{item.code}</td>
                  <td className="py-4 px-4 text-sm text-gray-900">{item.name}</td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {getItemTypeName(item.itemType)}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    {item.description || "-"}
                  </td>
                  <td className="py-4 px-4 text-sm text-center">
                    <div className="flex justify-center space-x-2">
                      <Link
                        href={`/master/items/${item.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        詳細
                      </Link>
                      <Link
                        href={`/master/items/${item.id}/edit`}
                        className="text-green-600 hover:text-green-900"
                      >
                        編集
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        削除
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