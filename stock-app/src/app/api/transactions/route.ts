import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 入出庫履歴取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // フィルタリングパラメータの取得
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const itemId = searchParams.get('itemId');
    const warehouseId = searchParams.get('warehouseId');
    const lotId = searchParams.get('lotId');
    const transactionType = searchParams.get('transactionType');

    // クエリ条件の構築
    let whereClause: any = {};

    // 日付範囲
    if (startDate || endDate) {
      whereClause.transactionDate = {};

      if (startDate) {
        whereClause.transactionDate.gte = new Date(startDate);
      }

      if (endDate) {
        // 終了日の23:59:59まで含める
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        whereClause.transactionDate.lte = endDateTime;
      }
    }

    // 倉庫ID
    if (warehouseId) {
      const parsedWarehouseId = parseInt(warehouseId);
      if (!isNaN(parsedWarehouseId)) {
        whereClause.warehouseId = parsedWarehouseId;
      }
    }

    // ロットID
    if (lotId) {
      const parsedLotId = parseInt(lotId);
      if (!isNaN(parsedLotId)) {
        whereClause.lotId = parsedLotId;
      }
    }

    // 取引種類
    if (transactionType && ['INBOUND', 'OUTBOUND'].includes(transactionType)) {
      whereClause.transactionType = transactionType;
    }

    // 商品ID（ロットを通じて）
    if (itemId) {
      const parsedItemId = parseInt(itemId);
      if (!isNaN(parsedItemId)) {
        whereClause.lot = {
          itemId: parsedItemId,
        };
      }
    }

    // 入出庫履歴の取得
    const transactions = await prisma.inventoryTransaction.findMany({
      where: whereClause,
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
        transactionDate: 'desc',
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('入出庫履歴取得エラー:', error);
    return NextResponse.json(
      { error: '入出庫履歴の取得に失敗しました' },
      { status: 500 }
    );
  }
}