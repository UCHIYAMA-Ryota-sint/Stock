"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import Link from "next/link";
import { ItemType } from "@prisma/client";

interface Unit {
  id: number;
  name: string;
}

interface ItemUnit {
  id: number;
  unitId: number;
  conversionRate: number;
  isDefault: boolean;
  unit: {
    id: number;
    name: string;
  };
}

interface ItemFormData {
  code: string;
  name: string;
  description: string;
  itemType: ItemType;
  units: {
    unitId: number;
    conversionRate: number;
    isDefault: boolean;
  }[];
}

export default function EditItem() {
  const params = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState<ItemFormData>({
    code: "",
    name: "",
    description: "",
    itemType: "MANUFACTURED",
    units: [],
  });
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<number | "">("");
  const [conversionRate, setConversionRate] = useState<number>(1);
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 商品データの取得
        const itemResponse = await fetch(`/api/items/${params.id}`);
        if (!itemResponse.ok) {
          throw new Error("商品データの取得に失敗しました");
        }
        const itemData = await itemResponse.json();

        // 単位データの取得
        const unitsResponse = await fetch("/api/units");
        if (!unitsResponse.ok) {
          throw new Error("単位データの取得に失敗しました");
        }
        const unitsData = await unitsResponse.json();

        // フォームデータの設定
        setFormData({
          code: itemData.code,
          name: itemData.name,
          description: itemData.description || "",
          itemType: itemData.itemType,
          units: itemData.itemUnits.map((iu: ItemUnit) => ({
            unitId: iu.unitId,
            conversionRate: iu.conversionRate,
            isDefault: iu.isDefault,
          })),
        });

        setUnits(unitsData);
      } catch (err) {
        console.error("データ取得エラー:", err);
        setError("データの取得に失敗しました。再度お試しください。");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUnit(e.target.value ? parseInt(e.target.value) : "");
  };

  const handleConversionRateChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConversionRate(parseFloat(e.target.value) || 1);
  };

  const handleDefaultChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsDefault(e.target.checked);
  };

  const addUnit = () => {
    if (selectedUnit === "") return;

    // 既に追加済みの単位かチェック
    if (formData.units.some((u) => u.unitId === selectedUnit)) {
      alert("この単位は既に追加されています");
      return;
    }

    // 単位を追加
    setFormData({
      ...formData,
      units: [
        ...formData.units,
        {
          unitId: selectedUnit as number,
          conversionRate,
          isDefault,
        },
      ],
    });

    // フォームをリセット
    setSelectedUnit("");
    setConversionRate(1);
    setIsDefault(false);
  };

  const removeUnit = (unitId: number) => {
    setFormData({
      ...formData,
      units: formData.units.filter((u) => u.unitId !== unitId),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/items/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "商品の更新に失敗しました");
      }

      // 更新成功
      router.push(`/master/items/${params.id}`);
    } catch (err: any) {
      console.error("商品更新エラー:", err);
      setError(err.message || "商品の更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="商品マスタ - 編集">
      <div className="mb-6">
        <Link
          href={`/master/items/${params.id}`}
          className="text-indigo-600 hover:text-indigo-800"
        >
          ← 商品詳細に戻る
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
      ) : (
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="code"
            >
              商品コード *
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="code"
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="name"
            >
              商品名 *
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="description"
            >
              説明
            </label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
            />
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="itemType"
            >
              種類 *
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="itemType"
              name="itemType"
              value={formData.itemType}
              onChange={handleChange}
              required
            >
              <option value="MANUFACTURED">製造品</option>
              <option value="EXTERNAL">社外品</option>
              <option value="RAW_MATERIAL">原材料</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              単位
            </label>
            <div className="flex flex-wrap items-end gap-2 mb-2">
              <div>
                <label
                  className="block text-gray-700 text-xs mb-1"
                  htmlFor="unitId"
                >
                  単位
                </label>
                <select
                  className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="unitId"
                  value={selectedUnit}
                  onChange={handleUnitChange}
                >
                  <option value="">選択してください</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="block text-gray-700 text-xs mb-1"
                  htmlFor="conversionRate"
                >
                  換算率
                </label>
                <input
                  className="shadow appearance-none border rounded w-24 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="conversionRate"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={conversionRate}
                  onChange={handleConversionRateChange}
                />
              </div>
              <div className="flex items-center">
                <input
                  id="isDefault"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={isDefault}
                  onChange={handleDefaultChange}
                />
                <label
                  htmlFor="isDefault"
                  className="ml-2 block text-sm text-gray-700"
                >
                  デフォルト単位
                </label>
              </div>
              <button
                type="button"
                onClick={addUnit}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={selectedUnit === ""}
              >
                追加
              </button>
            </div>

            {/* 追加された単位のリスト */}
            {formData.units.length > 0 && (
              <div className="mt-4 border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        単位
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        換算率
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        デフォルト
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.units.map((unitData) => {
                      const unit = units.find((u) => u.id === unitData.unitId);
                      return (
                        <tr key={unitData.unitId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {unit?.name || "不明"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {unitData.conversionRate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {unitData.isDefault ? "はい" : "いいえ"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              type="button"
                              onClick={() => removeUnit(unitData.unitId)}
                              className="text-red-600 hover:text-red-900"
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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
              href={`/master/items/${params.id}`}
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