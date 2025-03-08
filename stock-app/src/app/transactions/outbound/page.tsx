"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import Link from "next/link";

interface Item {
  id: number;
  code: string;
  name: string;
}

interface Lot {
  id: number;
  lotNumber: string;
  itemId: number;
  productionDate: string;
  item: Item;
}

interface Warehouse {
  id: number;
  code: string;
  name: string;
}

interface Unit {
  id: number;
  name: string;
}

interface Inventory {
  lotId: number;
  warehouseId: number;
  unitId: number;
  quantity: number;
  allocatedQuantity: number;
  availableQuantity: number;
}

interface Allocation {
  id: number;
  lotId: number;
  warehouseId: number;
  unitId: number;
  quantity: number;
  referenceNumber: string | null;
}

interface OutboundFormData {
  lotId: number;
  warehouseId: number;
  quantity: number;
  unitId: number;
  transactionDate: string;
  referenceNumber: string;
  barcodeData: string;
  allocationId?: number;
}

export default function OutboundTransaction() {
  const router = useRouter();
  const [formData, setFormData] = useState<OutboundFormData>({
    lotId: 0,
    warehouseId: 0,
    quantity: 0,
    unitId: 0,
    transactionDate: new Date().toISOString().split('T')[0],
    referenceNumber: "",
    barcodeData: "",
  });
  const [items, setItems] = useState<Item[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [filteredLots, setFilteredLots] = useState<Lot[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | "">("");
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [selectedAllocationId, setSelectedAllocationId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [parsedBarcode, setParsedBarcode] = useState<{
    itemCode?: string;
    lotNumber?: string;
    quantity?: number;
    unit?: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 商品データの取得
        const itemsResponse = await fetch("/api/items");
        if (!itemsResponse.ok) {
          throw new Error("商品データの取得に失敗しました");
        }
        const itemsData = await itemsResponse.json();
        setItems(itemsData);

        // ロットデータの取得
        const lotsResponse = await fetch("/api/lots");
        if (!lotsResponse.ok) {
          throw new Error("ロットデータの取得に失敗しました");
        }
        const lotsData = await lotsResponse.json();
        setLots(lotsData);
        setFilteredLots(lotsData);

        // 倉庫データの取得
        const warehousesResponse = await fetch("/api/warehouses");
        if (!warehousesResponse.ok) {
          throw new Error("倉庫データの取得に失敗しました");
        }
        const warehousesData = await warehousesResponse.json();
        setWarehouses(warehousesData);

        // 単位データの取得
        const unitsResponse = await fetch("/api/units");
        if (!unitsResponse.ok) {
          throw new Error("単位データの取得に失敗しました");
        }
        const unitsData = await unitsResponse.json();
        setUnits(unitsData);

        // 引当データの取得
        const allocationsResponse = await fetch("/api/allocations");
        if (!allocationsResponse.ok) {
          throw new Error("引当データの取得に失敗しました");
        }
        const allocationsData = await allocationsResponse.json();
        setAllocations(allocationsData);
      } catch (err) {
        console.error("データ取得エラー:", err);
        setError("データの取得に失敗しました。再度お試しください。");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, []);

  // 商品が選択されたときにロットをフィルタリング
  useEffect(() => {
    if (selectedItemId === "") {
      setFilteredLots(lots);
    } else {
      setFilteredLots(
        lots.filter((lot) => lot.itemId === selectedItemId)
      );
    }
    // 商品が変更されたら在庫情報をリセット
    setInventory(null);
    setFormData(prev => ({
      ...prev,
      lotId: 0,
      warehouseId: 0,
      unitId: 0,
      quantity: 0,
    }));
  }, [selectedItemId, lots]);

  // ロット、倉庫、単位が選択されたときに在庫情報を取得
  useEffect(() => {
    const fetchInventory = async () => {
      if (formData.lotId && formData.warehouseId && formData.unitId) {
        try {
          const response = await fetch(`/api/inventory?lotId=${formData.lotId}&warehouseId=${formData.warehouseId}&unitId=${formData.unitId}`);
          if (!response.ok) {
            throw new Error("在庫データの取得に失敗しました");
          }
          const data = await response.json();

          if (data.length > 0) {
            // 在庫データが存在する場合
            const inventoryItem = data[0];

            // 引当情報を計算
            const matchingAllocations = allocations.filter(
              alloc =>
                alloc.lotId === formData.lotId &&
                alloc.warehouseId === formData.warehouseId &&
                alloc.unitId === formData.unitId
            );

            const allocatedQuantity = matchingAllocations.reduce(
              (sum, alloc) => sum + alloc.quantity, 0
            );

            setInventory({
              lotId: inventoryItem.lotId,
              warehouseId: inventoryItem.warehouseId,
              unitId: inventoryItem.unitId,
              quantity: inventoryItem.quantity,
              allocatedQuantity,
              availableQuantity: inventoryItem.quantity - allocatedQuantity,
            });

            // 引当リストを更新
            setAllocations(matchingAllocations);
          } else {
            // 在庫データが存在しない場合
            setInventory(null);
            setAllocations([]);
          }
        } catch (err) {
          console.error("在庫データの取得エラー:", err);
          setInventory(null);
        }
      }
    };

    fetchInventory();
  }, [formData.lotId, formData.warehouseId, formData.unitId, allocations]);

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedItemId(value ? parseInt(value) : "");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "quantity" ? parseFloat(value) || 0 : value,
    });
  };

  const handleAllocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedAllocationId(value ? parseInt(value) : "");

    if (value) {
      // 引当が選択された場合、その情報をフォームに反映
      const allocation = allocations.find(a => a.id === parseInt(value));
      if (allocation) {
        setFormData(prev => ({
          ...prev,
          quantity: allocation.quantity,
          allocationId: allocation.id,
          referenceNumber: allocation.referenceNumber || "",
        }));
      }
    } else {
      // 引当が選択解除された場合
      setFormData(prev => ({
        ...prev,
        allocationId: undefined,
      }));
    }
  };

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const barcodeData = e.target.value;
    setFormData({
      ...formData,
      barcodeData,
    });

    // バーコードデータの解析（仮の実装）
    try {
      // 例: "ITEM:ABC123|LOT:L20250308|QTY:10|UNIT:個"
      const parts = barcodeData.split('|');
      const parsed: {
        itemCode?: string;
        lotNumber?: string;
        quantity?: number;
        unit?: string;
      } = {};

      parts.forEach(part => {
        const [key, value] = part.split(':');
        if (key === 'ITEM') parsed.itemCode = value;
        if (key === 'LOT') parsed.lotNumber = value;
        if (key === 'QTY') parsed.quantity = parseFloat(value);
        if (key === 'UNIT') parsed.unit = value;
      });

      setParsedBarcode(parsed);

      // 商品コードから商品IDを検索
      if (parsed.itemCode) {
        const item = items.find(i => i.code === parsed.itemCode);
        if (item) {
          setSelectedItemId(item.id);

          // ロット番号からロットIDを検索
          if (parsed.lotNumber) {
            setTimeout(() => {
              const lot = lots.find(l => l.lotNumber === parsed.lotNumber && l.itemId === item.id);
              if (lot) {
                setFormData(prev => ({
                  ...prev,
                  lotId: lot.id,
                }));
              }
            }, 100); // ロットフィルタリングが適用されるのを待つ
          }
        }
      }

      // 数量を設定
      if (parsed.quantity) {
        setFormData(prev => ({
          ...prev,
          quantity: parsed.quantity || 0,
        }));
      }

      // 単位を設定
      if (parsed.unit) {
        const unit = units.find(u => u.name === parsed.unit);
        if (unit) {
          setFormData(prev => ({
            ...prev,
            unitId: unit.id,
          }));
        }
      }
    } catch (err) {
      console.error("バーコード解析エラー:", err);
      // 解析エラーは無視
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // バリデーション
      if (formData.lotId === 0) {
        throw new Error("ロットを選択してください");
      }
      if (formData.warehouseId === 0) {
        throw new Error("倉庫を選択してください");
      }
      if (formData.unitId === 0) {
        throw new Error("単位を選択してください");
      }
      if (formData.quantity <= 0) {
        throw new Error("数量は0より大きい値を入力してください");
      }

      // 在庫チェック
      if (!inventory) {
        throw new Error("選択された条件の在庫が存在しません");
      }
      if (formData.quantity > inventory.quantity) {
        throw new Error(`出庫数量が在庫数量を超えています（在庫: ${inventory.quantity}）`);
      }

      const response = await fetch("/api/transactions/outbound", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "出庫処理に失敗しました");
      }

      // 登録成功
      router.push("/transactions");
    } catch (err: any) {
      console.error("出庫登録エラー:", err);
      setError(err.message || "出庫処理に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="出庫登録">
      <div className="mb-6">
        <Link
          href="/transactions"
          className="text-indigo-600 hover:text-indigo-800"
        >
          ← 入出庫一覧に戻る
        </Link>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">出庫データ登録</h2>
        <button
          type="button"
          onClick={() => setBarcodeMode(!barcodeMode)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
        >
          {barcodeMode ? "手動入力モード" : "バーコードモード"}
        </button>
      </div>

      {initialLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          {barcodeMode ? (
            <div className="mb-6">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="barcodeData"
              >
                バーコードデータ
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="barcodeData"
                name="barcodeData"
                value={formData.barcodeData}
                onChange={handleBarcodeChange}
                rows={4}
                placeholder="バーコードデータを入力または貼り付けてください"
              />
              {parsedBarcode && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <h3 className="font-semibold text-gray-700 mb-2">解析結果:</h3>
                  <ul className="text-sm text-gray-600">
                    <li>商品コード: {parsedBarcode.itemCode || "未検出"}</li>
                    <li>ロット番号: {parsedBarcode.lotNumber || "未検出"}</li>
                    <li>数量: {parsedBarcode.quantity || "未検出"}</li>
                    <li>単位: {parsedBarcode.unit || "未検出"}</li>
                  </ul>
                </div>
              )}
            </div>
          ) : null}

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="transactionDate"
            >
              出庫日 *
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="transactionDate"
              type="date"
              name="transactionDate"
              value={formData.transactionDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="itemId"
            >
              商品 *
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="itemId"
              value={selectedItemId}
              onChange={handleItemChange}
              required
            >
              <option value="">選択してください</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="lotId"
            >
              ロット *
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="lotId"
              name="lotId"
              value={formData.lotId}
              onChange={handleChange}
              required
              disabled={selectedItemId === ""}
            >
              <option value="0">選択してください</option>
              {filteredLots.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.lotNumber} ({new Date(lot.productionDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="warehouseId"
            >
              倉庫 *
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="warehouseId"
              name="warehouseId"
              value={formData.warehouseId}
              onChange={handleChange}
              required
            >
              <option value="0">選択してください</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.code} - {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="unitId"
            >
              単位 *
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="unitId"
              name="unitId"
              value={formData.unitId}
              onChange={handleChange}
              required
            >
              <option value="0">選択してください</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>

          {inventory && (
            <div className="mb-4 p-4 bg-blue-50 rounded">
              <h3 className="font-semibold text-blue-700 mb-2">在庫情報:</h3>
              <ul className="text-sm text-blue-600">
                <li>在庫数量: {inventory.quantity}</li>
                <li>引当数量: {inventory.allocatedQuantity}</li>
                <li>有効在庫数量: {inventory.availableQuantity}</li>
              </ul>
            </div>
          )}

          {allocations.length > 0 && (
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="allocationId"
              >
                引当
              </label>
              <select
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="allocationId"
                value={selectedAllocationId}
                onChange={handleAllocationChange}
              >
                <option value="">引当なし</option>
                {allocations.map((allocation) => (
                  <option key={allocation.id} value={allocation.id}>
                    {allocation.referenceNumber || `引当 #${allocation.id}`} ({allocation.quantity})
                  </option>
                ))}
              </select>
            </div>
          )}

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
              placeholder="出荷番号など"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
              disabled={loading}
            >
              {loading ? "処理中..." : "出庫登録"}
            </button>
            <Link
              href="/transactions"
              className="inline-block align-baseline font-bold text-sm text-indigo-600 hover:text-indigo-800"
            >
              キャンセル
            </Link>
          </div>
        </form>
      )}
    </Layout>
  );
}