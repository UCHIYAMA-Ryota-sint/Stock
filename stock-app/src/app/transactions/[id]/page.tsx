"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
}

export default function TransactionDetail() {
  const params = useParams();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const response = await fetch(`/api/transactions/${params.id}`);
        if (!response.ok) {
          throw new Error("入出庫データの取得に失敗しました");
        }
        const data = await response.json();
        setTransaction(data);
      } catch (err) {
        console.error("入出庫データの取得エラー:", err);
        setError("入出庫データの取得に失敗しました。再度お試しください。");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchTransaction();
    }
  }, [params.id]);

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

  return (
    <Layout title="入出庫詳細">
      <div className="mb-6">
        <Link
          href="/transactions"
          className="text-indigo-600 hover:text-indigo-800"
        >
          ← 入出庫一覧に戻る
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
      ) : transaction ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                入出庫情報
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                ID: {transaction.id}
              </p>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTransactionTypeColor(
                transaction.transactionType
              )}`}
            >
              {getTransactionTypeName(transaction.transactionType)}
            </span>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">取引日時</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(transaction.transactionDate).toLocaleString()}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">商品</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="font-medium">
                    {transaction.lot.item.name}
                  </div>
                  <div className="text-gray-500">
                    {transaction.lot.item.code} ({getItemTypeName(transaction.lot.item.itemType)})
                  </div>
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">ロット</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div>
                    {transaction.lot.lotNumber}
                  </div>
                  <div className="text-gray-500">
                    製造日/入荷日: {new Date(transaction.lot.productionDate).toLocaleDateString()}
                  </div>
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">倉庫</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {transaction.warehouse.name} ({transaction.warehouse.code})
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">数量</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {transaction.quantity} {transaction.unit.name}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">参照番号</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {transaction.referenceNumber || "-"}
                </dd>
              </div>
              {transaction.barcodeData && (
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">バーコードデータ</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <code className="bg-gray-100 p-2 rounded block whitespace-pre-wrap">
                      {transaction.barcodeData}
                    </code>
                  </dd>
                </div>
              )}
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">登録日時</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(transaction.createdAt).toLocaleString()}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">更新日時</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(transaction.updatedAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          入出庫データが見つかりません。
        </div>
      )}
    </Layout>
  );
}