import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 指定月の在庫取得
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

    // 商品ごとにグループ化
    const groupedByItem = monthlyInventory.reduce((acc, inv) => {
      const itemId = inv.itemId;

      if (!acc[itemId]) {
        acc[itemId] = {
          item: inv.item,
          warehouses: {},
        };
      }

      const warehouseId = inv.warehouseId;

      if (!acc[itemId].warehouses[warehouseId]) {
        acc[itemId].warehouses[warehouseId] = {
          warehouse: inv.warehouse,
          lots: [],
        };
      }

      acc[itemId].warehouses[warehouseId].lots.push({
        lot: inv.lot,
        openingQuantity: inv.openingQuantity,
        incomingQuantity: inv.incomingQuantity,
        outgoingQuantity: inv.outgoingQuantity,
        closingQuantity: inv.closingQuantity,
        unit: inv.unit,
      });

      return acc;
    }, {} as Record<number, any>);

    // 結果を配列に変換
    const result = Object.values(groupedByItem).map(item => {
      return {
        ...item,
        warehouses: Object.values(item.warehouses),
      };
    });

    return NextResponse.json({
      year,
      month,
      data: result,
    });
  } catch (error) {
    console.error('指定月の在庫取得エラー:', error);
    return NextResponse.json(
      { error: '指定月の在庫取得に失敗しました' },
      { status: 500 }
    );
  }
}