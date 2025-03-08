"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Link from "next/link";
import { TransactionType } from "@prisma/client";

interface Transaction {
  id: number;
  transactionType: TransactionType;
  lotId: number;
  warehouseId: number;
  quantity: number;
  unitId: number;
  transactionDate: string;
  referenceNumber: string | null;
  barcodeData: string | null;
  lot: {
    lotNumber: string;
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
}

export default function TransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    startDate: "",
    endDate: "",
    itemName: "",
    warehouseName: "",
    transactionType: "",
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // クエリパラメータの構築
        const queryParams = new URLSearchParams();
        if (filter.startDate) queryParams.append("startDate", filter.startDate);
        if (filter.endDate) queryParams.append("endDate", filter.endDate);
        if (filter.transactionType) queryParams.append("transactionType", filter.transactionType);

        const response = await fetch(`/api/transactions?${queryParams.toString()}`);
        if (!response.ok) {
          throw new Error("入出庫データの取得に失敗しました");
        }
        const data = await response.json();
        setTransactions(data);
      } catch (err) {
        console.error("入出庫データの取得エラー:", err);
        setError("入出庫データの取得に失敗しました。再度お試しください。");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [filter.startDate, filter.endDate, filter.transactionType]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilter({
      ...filter,
      [name]: value,
    });
  };

  const filteredTransactions = transactions.filter((transaction) => {
    return (
      transaction.lot.item.name
        .toLowerCase()
        .includes(filter.itemName.toLowerCase()) &&
      transaction.warehouse.name
        .toLowerCase()
        .includes(filter.warehouseName.toLowerCase())
    );
  });

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

  const getTransactionTypeName = (type: TransactionType) => {
    switch (type) {
      case "INBOUND":
        return "入庫";
      case "OUTBOUND":
        return "出庫";
      default:
        return type;
    }
  };

  const getTransactionTypeColor = (type: TransactionType) => {
    switch (type) {
      case "INBOUND":
        return "bg-green-100 text-green-800";
      case "OUTBOUND":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Layout title="入出庫管理">
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-700">
          入出庫の履歴を確認・管理することができます。
        </p>
        <div className="flex space-x-2">
          <Link
            href="/transactions/inbound"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            入庫登録
          </Link>
          <Link
            href="/transactions/outbound"
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            出庫登録
          </Link>
        </div>
      </div>

      {/* フィルター */}
      <div className="mb-6 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">検索フィルター</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="startDate"
            >
              開始日
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="startDate"
              type="date"
              name="startDate"
              value={filter.startDate}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="endDate"
            >
              終了日
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="endDate"
              type="date"
              name="endDate"
              value={filter.endDate}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="transactionType"
            >
              取引種類
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="transactionType"
              name="transactionType"
              value={filter.transactionType}
              onChange={handleFilterChange}
            >
              <option value="">すべて</option>
              <option value="INBOUND">入庫</option>
              <option value="OUTBOUND">出庫</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="itemName"
            >
              商品名
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="itemName"
              type="text"
              name="itemName"
              value={filter.itemName}
              onChange={handleFilterChange}
              placeholder="商品名で検索"
            />
          </div>
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="warehouseName"
            >
              倉庫名
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="warehouseName"
              type="text"
              name="warehouseName"
              value={filter.warehouseName}
              onChange={handleFilterChange}
              placeholder="倉庫名で検索"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          入出庫データがありません。「入庫登録」または「出庫登録」ボタンから登録してください。
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  日時
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  種類
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  商品
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  ロット番号
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  倉庫
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  数量
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  参照番号
                </th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {new Date(transaction.transactionDate).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionTypeColor(
                        transaction.transactionType
                      )}`}
                    >
                      {getTransactionTypeName(transaction.transactionType)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{transaction.lot.item.name}</div>
                      <div className="text-gray-500 text-xs">
                        {transaction.lot.item.code} ({getItemTypeName(transaction.lot.item.itemType)})
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {transaction.lot.lotNumber}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {transaction.warehouse.name}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {transaction.quantity} {transaction.unit.name}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {transaction.referenceNumber || "-"}
                  </td>
                  <td className="py-4 px-4 text-sm text-center">
                    <Link
                      href={`/transactions/${transaction.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      詳細
                    </Link>
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