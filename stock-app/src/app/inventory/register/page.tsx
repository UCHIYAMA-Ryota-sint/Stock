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

interface InventoryFormData {
  lotId: number;
  warehouseId: number;
  quantity: number;
  unitId: number;
}

export default function RegisterInventory() {
  const router = useRouter();
  const [formData, setFormData] = useState<InventoryFormData>({
    lotId: 0,
    warehouseId: 0,
    quantity: 0,
    unitId: 0,
  });
  const [items, setItems] = useState<Item[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [filteredLots, setFilteredLots] = useState<Lot[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [selectedItemId, lots]);

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedItemId(value ? parseInt(value) : "");
    // 商品が変更されたらロットをリセット
    setFormData({
      ...formData,
      lotId: 0,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "quantity" ? parseFloat(value) || 0 : parseInt(value) || 0,
    });
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

      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "在庫の登録に失敗しました");
      }

      // 登録成功
      router.push("/inventory");
    } catch (err: any) {
      console.error("在庫登録エラー:", err);
      setError(err.message || "在庫の登録に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="在庫登録">
      <div className="mb-6">
        <Link
          href="/inventory"
          className="text-indigo-600 hover:text-indigo-800"
        >
          ← 在庫一覧に戻る
        </Link>
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

          <div className="flex items-center justify-between">
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
              disabled={loading}
            >
              {loading ? "登録中..." : "登録"}
            </button>
            <Link
              href="/inventory"
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