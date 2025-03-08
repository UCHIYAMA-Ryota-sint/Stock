import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 月次在庫一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // フィルタリングパラメータの取得
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const itemId = searchParams.get('itemId');
    const warehouseId = searchParams.get('warehouseId');

    // クエリ条件の構築
    let whereClause: any = {};

    // 年月によるフィルタリング
    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);

      whereClause.month = {
        gte: startDate,
        lte: endDate,
      };
    } else if (year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31);

      whereClause.month = {
        gte: startDate,
        lte: endDate,
      };
    }

    // 商品IDによるフィルタリング
    if (itemId) {
      const parsedItemId = parseInt(itemId);
      if (!isNaN(parsedItemId)) {
        whereClause.itemId = parsedItemId;
      }
    }

    // 倉庫IDによるフィルタリング
    if (warehouseId) {
      const parsedWarehouseId = parseInt(warehouseId);
      if (!isNaN(parsedWarehouseId)) {
        whereClause.warehouseId = parsedWarehouseId;
      }
    }

    // 月次在庫データの取得
    const monthlyInventory = await prisma.monthlyInventory.findMany({
      where: whereClause,
      include: {
        item: true,
        lot: true,
        warehouse: true,
        unit: true,
      },
      orderBy: [
        {
          month: 'desc',
        },
        {
          item: {
            name: 'asc',
          },
        },
      ],
    });

    return NextResponse.json(monthlyInventory);
  } catch (error) {
    console.error('月次在庫一覧取得エラー:', error);
    return NextResponse.json(
      { error: '月次在庫一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}