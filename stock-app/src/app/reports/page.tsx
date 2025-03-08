"use client";

import { useState } from "react";
import Layout from "@/components/Layout";
import Link from "next/link";

export default function ReportsList() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportParams, setReportParams] = useState({
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
    format: "csv",
  });

  const reports = [
    {
      id: "inventory",
      name: "在庫一覧レポート",
      description: "現在の在庫状況を商品、ロット、倉庫ごとに出力します",
      formats: ["csv", "json"],
      endpoint: "/api/reports/inventory",
    },
    {
      id: "monthly",
      name: "月次在庫推移レポート",
      description: "指定月の在庫推移を商品ごとに出力します",
      formats: ["csv", "json"],
      endpoint: "/api/reports/monthly",
      requiresYearMonth: true,
    },
    {
      id: "transactions",
      name: "入出庫履歴レポート",
      description: "指定期間の入出庫履歴を出力します",
      formats: ["csv", "json"],
      endpoint: "/api/transactions",
      requiresYearMonth: true,
    },
    {
      id: "allocations",
      name: "引当状況レポート",
      description: "現在の引当状況を出力します",
      formats: ["csv", "json"],
      endpoint: "/api/allocations",
    },
  ];

  const handleReportSelect = (reportId: string) => {
    setSelectedReport(reportId);
  };

  const handleParamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setReportParams({
      ...reportParams,
      [name]: value,
    });
  };

  const generateReportUrl = () => {
    if (!selectedReport) return "";

    const report = reports.find(r => r.id === selectedReport);
    if (!report) return "";

    let url = report.endpoint;

    // フォーマットパラメータを追加
    url += `?format=${reportParams.format}`;

    // 年月が必要なレポートの場合
    if (report.requiresYearMonth) {
      if (report.id === "monthly") {
        url = `/api/reports/monthly/${reportParams.year}/${reportParams.month}?format=${reportParams.format}`;
      } else {
        // 入出庫履歴の場合は日付範囲を設定
        const startDate = `${reportParams.year}-${reportParams.month}-01`;
        const lastDay = new Date(parseInt(reportParams.year), parseInt(reportParams.month), 0).getDate();
        const endDate = `${reportParams.year}-${reportParams.month}-${lastDay}`;
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
    }

    return url;
  };

  const downloadReport = () => {
    if (!selectedReport) return;

    const url = generateReportUrl();
    window.open(url, '_blank');
  };

  return (
    <Layout title="レポート">
      <div className="mb-6">
        <p className="text-gray-700">
          在庫一覧や在庫推移などのレポートを出力することができます。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {reports.map((report) => (
          <div
            key={report.id}
            className={`bg-white overflow-hidden shadow rounded-lg transition-all duration-200 cursor-pointer ${
              selectedReport === report.id
                ? "ring-2 ring-indigo-500"
                : "hover:shadow-lg hover:-translate-y-1"
            }`}
            onClick={() => handleReportSelect(report.id)}
          >
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">
                {report.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {report.description}
              </p>
              <div className="mt-2 text-xs text-gray-400">
                利用可能フォーマット: {report.formats.join(", ")}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedReport && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            レポート設定
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {reports.find(r => r.id === selectedReport)?.requiresYearMonth && (
              <>
                <div>
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="year"
                  >
                    年
                  </label>
                  <select
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="year"
                    name="year"
                    value={reportParams.year}
                    onChange={handleParamChange}
                  >
                    {Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <option key={year} value={year}>
                        {year}年
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="month"
                  >
                    月
                  </label>
                  <select
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="month"
                    name="month"
                    value={reportParams.month}
                    onChange={handleParamChange}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month.toString().padStart(2, '0')}>
                        {month}月
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="format"
              >
                フォーマット
              </label>
              <select
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="format"
                name="format"
                value={reportParams.format}
                onChange={handleParamChange}
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={downloadReport}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              レポート出力
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          レポート機能について
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          各レポートの概要:
        </p>
        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
          <li>
            <span className="font-medium">在庫一覧レポート:</span> 現在の在庫状況を商品、ロット、倉庫ごとに出力します。引当情報も含まれます。
          </li>
          <li>
            <span className="font-medium">月次在庫推移レポート:</span> 指定月の在庫推移を商品ごとに出力します。期首在庫、入庫数、出庫数、期末在庫が含まれます。
          </li>
          <li>
            <span className="font-medium">入出庫履歴レポート:</span> 指定期間の入出庫履歴を出力します。入庫、出庫の詳細情報が含まれます。
          </li>
          <li>
            <span className="font-medium">引当状況レポート:</span> 現在の引当状況を出力します。引当日、商品、ロット、倉庫、数量などの情報が含まれます。
          </li>
        </ul>
      </div>
    </Layout>
  );
}