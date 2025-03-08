"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Layout from "@/components/Layout";
import Link from "next/link";
import { ItemType } from "@prisma/client";

interface Warehouse {
  id: number;
  code: string;
  name: string;
  description: string | null;
}

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
  quantity: number;
  allocatedQuantity: number;
  availableQuantity: number;
  unit: {
    id: number;
    name: string;
  };
}

interface ItemInventory {
  item: Item;
  lots: Lot[];
  warehouseTotalQuantity: number;
  warehouseTotalAllocatedQuantity: number;
  warehouseTotalAvailableQuantity: number;
}

interface WarehouseInventory {
  warehouse: Warehouse;
  inventory: ItemInventory[];
}

export default function WarehouseInventory() {
  const params = useParams();
  const [data, setData] = useState<WarehouseInventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch(`/api/inventory/warehouse/${params.warehouseId}`);
        if (!response.ok) {
          throw new Error("在庫データの取得に失敗しました");
        }
        const responseData = await response.json();
        setData(responseData);
      } catch (err) {
        console.error("在庫データの取得エラー:", err);
        setError("在庫データの取得に失敗しました。再度お試しください。");
      } finally {
        setLoading(false);
      }
    };

    if (params.warehouseId) {
      fetchInventory();
    }
  }, [params.warehouseId]);

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

  return (
    <Layout title="倉庫別在庫照会">
      <div className="mb-6">
        <Link
          href="/inventory"
          className="text-indigo-600 hover:text-indigo-800"
        >
          ← 在庫一覧に戻る
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
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                倉庫情報
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">倉庫コード</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {data.warehouse.code}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">倉庫名</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {data.warehouse.name}
                  </dd>
                </div>
                {data.warehouse.description && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">説明</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {data.warehouse.description}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {data.inventory.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
              この倉庫の在庫データはありません。
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">在庫状況</h3>

              {data.inventory.map(itemInventory => (
                <div key={itemInventory.item.id} className="mb-6 bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <div>
                      <h4 className="text-md font-medium text-gray-900">
                        {itemInventory.item.code} - {itemInventory.item.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {getItemTypeName(itemInventory.item.itemType)}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      合計: {itemInventory.warehouseTotalQuantity} /
                      引当: {itemInventory.warehouseTotalAllocatedQuantity} /
                      有効: {itemInventory.warehouseTotalAvailableQuantity}
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
                            製造日/入荷日
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            在庫数量
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            引当数量
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            有効在庫数量
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {itemInventory.lots.map(lot => (
                          <tr key={lot.lotId}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {lot.lotNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(lot.productionDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {lot.quantity} {lot.unit.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {lot.allocatedQuantity} {lot.unit.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {lot.availableQuantity} {lot.unit.name}
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
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          倉庫が見つかりません。
        </div>
      )}
    </Layout>
  );
}