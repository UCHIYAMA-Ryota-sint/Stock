import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TransactionType } from '@prisma/client';

// 月次在庫計算
export async function POST(
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

    // 指定月の範囲を設定
    const targetMonth = new Date(year, month - 1, 1);
    const nextMonth = new Date(year, month, 1);
    const prevMonth = new Date(year, month - 2, 1);

    // 前月の最終日
    const lastDayOfPrevMonth = new Date(year, month - 1, 0);

    // トランザクションで月次在庫計算を実行
    const result = await prisma.$transaction(async (tx) => {
      // 既存の月次在庫データを削除
      await tx.monthlyInventory.deleteMany({
        where: {
          month: targetMonth,
        },
      });

      // 全ての商品を取得
      const items = await tx.item.findMany();

      // 全てのロットを取得
      const lots = await tx.lot.findMany({
        where: {
          productionDate: {
            lte: lastDayOfPrevMonth,
          },
        },
      });

      // 全ての倉庫を取得
      const warehouses = await tx.warehouse.findMany();

      // 前月の月次在庫データを取得
      const prevMonthInventory = await tx.monthlyInventory.findMany({
        where: {
          month: prevMonth,
        },
      });

      // 当月の入出庫データを取得
      const transactions = await tx.inventoryTransaction.findMany({
        where: {
          transactionDate: {
            gte: targetMonth,
            lt: nextMonth,
          },
        },
      });

      // 現在の在庫データを取得
      const currentInventory = await tx.inventory.findMany({
        include: {
          lot: true,
        },
      });

      // 月次在庫データを作成
      const monthlyInventoryData = [];

      // 各ロット、倉庫、単位の組み合わせに対して処理
      for (const lot of lots) {
        for (const warehouse of warehouses) {
          // 単位ごとの在庫を取得
          const units = await tx.unit.findMany();

          for (const unit of units) {
            // 前月の期末在庫を取得（期首在庫として使用）
            const prevInventory = prevMonthInventory.find(
              inv => inv.lotId === lot.id &&
                    inv.warehouseId === warehouse.id &&
                    inv.unitId === unit.id
            );

            // 当月の入庫数量を計算
            const inboundTransactions = transactions.filter(
              t => t.lotId === lot.id &&
                  t.warehouseId === warehouse.id &&
                  t.unitId === unit.id &&
                  t.transactionType === TransactionType.INBOUND
            );

            const incomingQuantity = inboundTransactions.reduce(
              (sum, t) => sum + t.quantity, 0
            );

            // 当月の出庫数量を計算
            const outboundTransactions = transactions.filter(
              t => t.lotId === lot.id &&
                  t.warehouseId === warehouse.id &&
                  t.unitId === unit.id &&
                  t.transactionType === TransactionType.OUTBOUND
            );

            const outgoingQuantity = outboundTransactions.reduce(
              (sum, t) => sum + t.quantity, 0
            );

            // 期首在庫数量を設定
            const openingQuantity = prevInventory ? prevInventory.closingQuantity : 0;

            // 期末在庫数量を計算
            const closingQuantity = openingQuantity + incomingQuantity - outgoingQuantity;

            // 在庫がある場合のみ月次在庫データを作成
            if (openingQuantity > 0 || incomingQuantity > 0 || outgoingQuantity > 0 || closingQuantity > 0) {
              monthlyInventoryData.push({
                itemId: lot.itemId,
                lotId: lot.id,
                warehouseId: warehouse.id,
                unitId: unit.id,
                openingQuantity,
                incomingQuantity,
                outgoingQuantity,
                closingQuantity,
                month: targetMonth,
              });
            }
          }
        }
      }

      // 月次在庫データを一括作成
      if (monthlyInventoryData.length > 0) {
        await tx.monthlyInventory.createMany({
          data: monthlyInventoryData,
        });
      }

      // 作成した月次在庫データを取得
      const createdMonthlyInventory = await tx.monthlyInventory.findMany({
        where: {
          month: targetMonth,
        },
        include: {
          item: true,
          lot: true,
          warehouse: true,
          unit: true,
        },
      });

      return {
        year,
        month,
        count: createdMonthlyInventory.length,
        data: createdMonthlyInventory,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('月次在庫計算エラー:', error);
    return NextResponse.json(
      { error: '月次在庫計算に失敗しました' },
      { status: 500 }
    );
  }
}