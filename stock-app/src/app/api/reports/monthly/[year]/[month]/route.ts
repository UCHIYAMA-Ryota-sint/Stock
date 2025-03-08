import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TransactionType } from '@prisma/client';

// 在庫推移レポート取得
export async function GET(
  request: NextRequest,
  { params }: { params: { year: string; month: string } }
) {
  try {
    const year = parseInt(params.year);
    const month = parseInt(params.month);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { error: '無効な年月です' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);

    // フィルタリングパラメータの取得
    const itemId = searchParams.get('itemId');
    const warehouseId = searchParams.get('warehouseId');
    const format = searchParams.get('format') || 'json';

    // 指定月の範囲を設定
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // 月次在庫データの取得
    const monthlyInventory = await prisma.monthlyInventory.findMany({
      where: {
        month: {
          gte: startDate,
          lte: endDate,
        },
        ...(itemId ? { itemId: parseInt(itemId) } : {}),
        ...(warehouseId ? { warehouseId: parseInt(warehouseId) } : {}),
      },
      include: {
        item: true,
        lot: true,
        warehouse: true,
        unit: true,
      },
      orderBy: [
        {
          item: {
            name: 'asc',
          },
        },
        {
          warehouse: {
            name: 'asc',
          },
        },
      ],
    });

    // 当月の入出庫データを取得
    const transactions = await prisma.inventoryTransaction.findMany({
      where: {
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(itemId ? { lot: { itemId: parseInt(itemId) } } : {}),
        ...(warehouseId ? { warehouseId: parseInt(warehouseId) } : {}),
      },
      include: {
        lot: {
          include: {
            item: true,
          },
        },
        warehouse: true,
        unit: true,
      },
      orderBy: {
        transactionDate: 'asc',
      },
    });

    // 日付ごとの入出庫データを集計
    const dailyTransactions: Record<string, any> = {};

    // 月の各日を初期化
    const daysInMonth = endDate.getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      dailyTransactions[dateStr] = {
        date: dateStr,
        inbound: [],
        outbound: [],
      };
    }

    // 入出庫データを日付ごとに分類
    transactions.forEach(transaction => {
      const date = new Date(transaction.transactionDate);
      const dateStr = date.toISOString().split('T')[0];

      if (transaction.transactionType === TransactionType.INBOUND) {
        if (!dailyTransactions[dateStr]) {
          dailyTransactions[dateStr] = {
            date: dateStr,
            inbound: [],
            outbound: [],
          };
        }
        dailyTransactions[dateStr].inbound.push(transaction);
      } else {
        if (!dailyTransactions[dateStr]) {
          dailyTransactions[dateStr] = {
            date: dateStr,
            inbound: [],
            outbound: [],
          };
        }
        dailyTransactions[dateStr].outbound.push(transaction);
      }
    });

    // 商品ごとにグループ化
    const groupedByItem: Record<number, any> = {};

    // 月次在庫データから商品ごとの初期状態を設定
    monthlyInventory.forEach(inv => {
      const itemId = inv.itemId;

      if (!groupedByItem[itemId]) {
        groupedByItem[itemId] = {
          itemId,
          itemName: inv.item.name,
          itemCode: inv.item.code,
          itemType: inv.item.itemType,
          warehouses: {},
          dailyData: {},
        };

        // 日付ごとのデータを初期化
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          groupedByItem[itemId].dailyData[dateStr] = {
            date: dateStr,
            inboundQuantity: 0,
            outboundQuantity: 0,
            balance: 0, // 当日の残高（前日の残高 + 入庫 - 出庫）
          };
        }
      }

      const warehouseId = inv.warehouseId;

      if (!groupedByItem[itemId].warehouses[warehouseId]) {
        groupedByItem[itemId].warehouses[warehouseId] = {
          warehouseId,
          warehouseName: inv.warehouse.name,
          openingQuantity: 0,
          incomingQuantity: 0,
          outgoingQuantity: 0,
          closingQuantity: 0,
        };
      }

      // 倉庫ごとの月次データを更新
      groupedByItem[itemId].warehouses[warehouseId].openingQuantity += inv.openingQuantity;
      groupedByItem[itemId].warehouses[warehouseId].incomingQuantity += inv.incomingQuantity;
      groupedByItem[itemId].warehouses[warehouseId].outgoingQuantity += inv.outgoingQuantity;
      groupedByItem[itemId].warehouses[warehouseId].closingQuantity += inv.closingQuantity;
    });

    // 日次データを計算
    Object.values(dailyTransactions).forEach((dayData: any) => {
      const dateStr = dayData.date;

      // 入庫データを処理
      dayData.inbound.forEach((transaction: any) => {
        const itemId = transaction.lot.itemId;

        if (groupedByItem[itemId]) {
          groupedByItem[itemId].dailyData[dateStr].inboundQuantity += transaction.quantity;
        }
      });

      // 出庫データを処理
      dayData.outbound.forEach((transaction: any) => {
        const itemId = transaction.lot.itemId;

        if (groupedByItem[itemId]) {
          groupedByItem[itemId].dailyData[dateStr].outboundQuantity += transaction.quantity;
        }
      });
    });

    // 日次残高を計算
    Object.values(groupedByItem).forEach((itemData: any) => {
      let balance = 0;

      // 期首在庫を取得
      Object.values(itemData.warehouses).forEach((warehouseData: any) => {
        balance += warehouseData.openingQuantity;
      });

      // 日次残高を計算
      Object.keys(itemData.dailyData).sort().forEach(dateStr => {
        const dayData = itemData.dailyData[dateStr];
        balance = balance + dayData.inboundQuantity - dayData.outboundQuantity;
        dayData.balance = balance;
      });
    });

    // 結果を配列に変換
    const result = Object.values(groupedByItem).map((item: any) => {
      return {
        ...item,
        warehouses: Object.values(item.warehouses),
        dailyData: Object.values(item.dailyData).sort((a: any, b: any) => a.date.localeCompare(b.date)),
      };
    });

    // フォーマットに応じてレスポンスを返す
    if (format === 'csv') {
      // CSVフォーマットでの出力
      const csvRows = [];

      // ヘッダー行
      csvRows.push([
        '商品コード',
        '商品名',
        '商品種類',
        '日付',
        '入庫数量',
        '出庫数量',
        '在庫残高',
      ].join(','));

      // データ行
      result.forEach((item: any) => {
        item.dailyData.forEach((dayData: any) => {
          csvRows.push([
            `"${item.itemCode}"`,
            `"${item.itemName}"`,
            `"${item.itemType}"`,
            `"${dayData.date}"`,
            dayData.inboundQuantity,
            dayData.outboundQuantity,
            dayData.balance,
          ].join(','));
        });
      });

      const csvContent = csvRows.join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="inventory-monthly-report-${year}-${month}.csv"`,
        },
      });
    } else {
      // JSONフォーマットでの出力
      return NextResponse.json({
        year,
        month,
        timestamp: new Date().toISOString(),
        totalItems: result.length,
        data: result,
      });
    }
  } catch (error) {
    console.error('在庫推移レポート取得エラー:', error);
    return NextResponse.json(
      { error: '在庫推移レポートの取得に失敗しました' },
      { status: 500 }
    );
  }
}