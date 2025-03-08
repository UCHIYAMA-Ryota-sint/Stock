import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 倉庫別在庫取得
export async function GET(
  request: NextRequest,
  { params }: { params: { warehouseId: string } }
) {
  try {
    const warehouseId = parseInt(params.warehouseId);

    if (isNaN(warehouseId)) {
      return NextResponse.json(
        { error: '無効な倉庫IDです' },
        { status: 400 }
      );
    }

    // 倉庫の存在確認
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: '倉庫が見つかりません' },
        { status: 404 }
      );
    }

    // 倉庫の在庫データを取得
    const inventory = await prisma.inventory.findMany({
      where: {
        warehouseId,
      },
      include: {
        lot: {
          include: {
            item: true,
          },
        },
        unit: true,
      },
      orderBy: [
        {
          lot: {
            item: {
              name: 'asc',
            },
          },
        },
        {
          lot: {
            lotNumber: 'asc',
          },
        },
      ],
    });

    // 商品ごとにグループ化
    const groupedInventory = inventory.reduce((acc, inv) => {
      const itemId = inv.lot.item.id;

      if (!acc[itemId]) {
        acc[itemId] = {
          item: inv.lot.item,
          lots: [],
        };
      }

      acc[itemId].lots.push({
        lot: inv.lot,
        quantity: inv.quantity,
        unit: inv.unit,
      });

      return acc;
    }, {} as Record<number, { item: any; lots: any[] }>);

    // 結果を配列に変換
    const result = {
      warehouse,
      inventory: Object.values(groupedInventory),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('倉庫別在庫取得エラー:', error);
    return NextResponse.json(
      { error: '倉庫別在庫の取得に失敗しました' },
      { status: 500 }
    );
  }
}