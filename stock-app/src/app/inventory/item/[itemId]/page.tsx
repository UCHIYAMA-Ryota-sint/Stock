"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Layout from "@/components/Layout";
import Link from "next/link";
import { ItemType } from "@prisma/client";

interface Item {
  id: number;
  code: string;
  name: string;
  itemType: ItemType;
}

interface Inventory {
  lot: {
    id: number;
    lotNumber: string;
    productionDate: string;
  };
  warehouse: {
    id: number;
    name: string;
  };
  quantity: number;
  unit: {
    id: number;
    name: string;
  };
  allocatedQuantity: number;
  availableQuantity: number;
}

interface ItemInventory {
  item: Item;
  inventory: Inventory[];
}

export default function ItemInventory() {
  const params = useParams();
  const [data, setData] = useState<ItemInventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch(`/api/inventory/item/${params.itemId}`);
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

    if (params.itemId) {
      fetchInventory();
    }
  }, [params.itemId]);

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

  // 倉庫ごとに在庫をグループ化
  const groupByWarehouse = (inventory: Inventory[]) => {
    const grouped: Record<number, {
      warehouse: { id: number; name: string };
      lots: Inventory[];
      totalQuantity: number;
      totalAllocatedQuantity: number;
      totalAvailableQuantity: number;
    }> = {};

    inventory.forEach(inv => {
      if (!grouped[inv.warehouse.id]) {
        grouped[inv.warehouse.id] = {
          warehouse: inv.warehouse,
          lots: [],
          totalQuantity: 0,
          totalAllocatedQuantity: 0,
          totalAvailableQuantity: 0,
        };
      }

      grouped[inv.warehouse.id].lots.push(inv);
      grouped[inv.warehouse.id].totalQuantity += inv.quantity;
      grouped[inv.warehouse.id].totalAllocatedQuantity += inv.allocatedQuantity;
      grouped[inv.warehouse.id].totalAvailableQuantity += inv.availableQuantity;
    });

    return Object.values(grouped);
  };

  return (
    <Layout title="商品別在庫照会">
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
                商品情報
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">商品コード</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {data.item.code}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">商品名</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {data.item.name}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">種類</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {getItemTypeName(data.item.itemType)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {data.inventory.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
              この商品の在庫データはありません。
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">在庫状況</h3>

              {groupByWarehouse(data.inventory).map(warehouseGroup => (
                <div key={warehouseGroup.warehouse.id} className="mb-6 bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <h4 className="text-md font-medium text-gray-900">
                      倉庫: {warehouseGroup.warehouse.name}
                    </h4>
                    <div className="text-sm text-gray-500">
                      合計: {warehouseGroup.totalQuantity} /
                      引当: {warehouseGroup.totalAllocatedQuantity} /
                      有効: {warehouseGroup.totalAvailableQuantity}
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
                        {warehouseGroup.lots.map((inv, index) => (
                          <tr key={`${inv.lot.id}-${index}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {inv.lot.lotNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(inv.lot.productionDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {inv.quantity} {inv.unit.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {inv.allocatedQuantity} {inv.unit.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {inv.availableQuantity} {inv.unit.name}
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
          商品が見つかりません。
        </div>
      )}
    </Layout>
  );
}