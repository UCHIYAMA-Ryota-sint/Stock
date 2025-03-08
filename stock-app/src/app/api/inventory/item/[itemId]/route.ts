import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 商品別在庫取得
export async function GET(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const itemId = parseInt(params.itemId);

    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: '無効な商品IDです' },
        { status: 400 }
      );
    }

    // 商品の存在確認
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json(
        { error: '商品が見つかりません' },
        { status: 404 }
      );
    }

    // 商品に関連するロットを取得
    const lots = await prisma.lot.findMany({
      where: { itemId },
    });

    if (lots.length === 0) {
      return NextResponse.json([]);
    }

    // ロットIDのリストを作成
    const lotIds = lots.map(lot => lot.id);

    // 在庫データを取得
    const inventory = await prisma.inventory.findMany({
      where: {
        lotId: {
          in: lotIds,
        },
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
      orderBy: [
        {
          warehouse: {
            name: 'asc',
          },
        },
        {
          lot: {
            lotNumber: 'asc',
          },
        },
      ],
    });

    // 商品情報を追加
    const result = {
      item,
      inventory,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('商品別在庫取得エラー:', error);
    return NextResponse.json(
      { error: '商品別在庫の取得に失敗しました' },
      { status: 500 }
    );
  }
}