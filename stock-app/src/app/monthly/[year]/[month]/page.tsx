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
  itemType: ItemType;
}

interface Lot {
  lotId: number;
  lotNumber: string;
  productionDate: string;
  openingQuantity: number;
  incomingQuantity: number;
  outgoingQuantity: number;
  closingQuantity: number;
  unit: {
    id: number;
    name: string;
  };
}

interface Warehouse {
  warehouseId: number;
  warehouseName: string;
  lots: Lot[];
  warehouseTotalQuantity: number;
  warehouseTotalAllocatedQuantity: number;
  warehouseTotalAvailableQuantity: number;
}

interface ItemInventory {
  item: Item;
  warehouses: Warehouse[];
  dailyData: {
    date: string;
    inboundQuantity: number;
    outboundQuantity: number;
    balance: number;
  }[];
}

interface MonthlyReport {
  year: number;
  month: number;
  timestamp: string;
  totalItems: number;
  data: ItemInventory[];
}

export default function MonthlyInventoryDetail() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  useEffect(() => {
    const fetchMonthlyInventory = async () => {
      try {
        const response = await fetch(`/api/reports/monthly/${params.year}/${params.month}`);
        if (!response.ok) {
          throw new Error("月次在庫データの取得に失敗しました");
        }
        const responseData = await response.json();
        setData(responseData);

        // 最初の商品を選択
        if (responseData.data.length > 0) {
          setSelectedItemId(responseData.data[0].item.id);
        }
      } catch (err) {
        console.error("月次在庫データの取得エラー:", err);
        setError("月次在庫データの取得に失敗しました。再度お試しください。");
      } finally {
        setLoading(false);
      }
    };

    if (params.year && params.month) {
      fetchMonthlyInventory();
    }
  }, [params.year, params.month]);

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

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedItemId(parseInt(e.target.value));
  };

  const selectedItemData = data?.data.find(item => item.item.id === selectedItemId);

  const downloadCsv = () => {
    if (!data) return;

    const url = `/api/reports/monthly/${params.year}/${params.month}?format=csv`;
    window.open(url, '_blank');
  };

  return (
    <Layout title={`月次在庫詳細 (${params.year}年${params.month}月)`}>
      <div className="mb-6">
        <Link
          href="/monthly"
          className="text-indigo-600 hover:text-indigo-800"
        >
          ← 月次在庫一覧に戻る
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
      ) : data ? (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {data.year}年{data.month}月 月次在庫レポート
            </h2>
            <button
              onClick={downloadCsv}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              CSVダウンロード
            </button>
          </div>

          {data.data.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
              この月の在庫データはありません。
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="itemSelector"
                >
                  商品選択
                </label>
                <select
                  id="itemSelector"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={selectedItemId || ""}
                  onChange={handleItemChange}
                >
                  {data.data.map(item => (
                    <option key={item.item.id} value={item.item.id}>
                      {item.item.code} - {item.item.name} ({getItemTypeName(item.item.itemType)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedItemData && (
                <div>
                  {/* 商品情報 */}
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        商品情報
                      </h3>
                    </div>
                    <div className="border-t border-gray-200">
                      <dl>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">商品コード</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {selectedItemData.item.code}
                          </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">商品名</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {selectedItemData.item.name}
                          </dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">種類</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {getItemTypeName(selectedItemData.item.itemType)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* 日次推移グラフ */}
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        日次在庫推移
                      </h3>
                    </div>
                    <div className="border-t border-gray-200 p-4">
                      <div className="h-64 relative">
                        {/* 簡易的なグラフ表示（実際のプロジェクトではChart.jsなどのライブラリを使用） */}
                        <div className="absolute inset-0 flex items-end">
                          {selectedItemData.dailyData.map((day, index) => (
                            <div
                              key={day.date}
                              className="flex-1 mx-1 flex flex-col items-center"
                            >
                              <div
                                className="w-full bg-blue-500"
                                style={{
                                  height: `${Math.min(
                                    (day.balance / Math.max(...selectedItemData.dailyData.map(d => d.balance))) * 100,
                                    100
                                  )}%`,
                                }}
                              ></div>
                              <div className="text-xs mt-1 transform -rotate-45 origin-top-left">
                                {new Date(day.date).getDate()}日
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 倉庫別在庫 */}
                  {selectedItemData.warehouses.map(warehouse => (
                    <div key={warehouse.warehouseId} className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          倉庫: {warehouse.warehouseName}
                        </h3>
                        <div className="text-sm text-gray-500">
                          合計在庫: {warehouse.warehouseTotalQuantity}
                        </div>
                      </div>
                      <div className="border-t border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ロット番号
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                期首在庫
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                入庫数量
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                出庫数量
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                期末在庫
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                単位
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {warehouse.lots.map(lot => (
                              <tr key={lot.lotId}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {lot.lotNumber}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {lot.openingQuantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {lot.incomingQuantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {lot.outgoingQuantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {lot.closingQuantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {lot.unit.name}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          データが見つかりません。
        </div>
      )}
    </Layout>
  );
}