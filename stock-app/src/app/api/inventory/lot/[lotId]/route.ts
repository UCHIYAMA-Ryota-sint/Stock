import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ロット別在庫取得
export async function GET(
  request: NextRequest,
  { params }: { params: { lotId: string } }
) {
  try {
    const lotId = parseInt(params.lotId);

    if (isNaN(lotId)) {
      return NextResponse.json(
        { error: '無効なロットIDです' },
        { status: 400 }
      );
    }

    // ロットの存在確認
    const lot = await prisma.lot.findUnique({
      where: { id: lotId },
      include: {
        item: true,
      },
    });

    if (!lot) {
      return NextResponse.json(
        { error: 'ロットが見つかりません' },
        { status: 404 }
      );
    }

    // ロットの在庫データを取得
    const inventory = await prisma.inventory.findMany({
      where: {
        lotId,
      },
      include: {
        warehouse: true,
        unit: true,
      },
      orderBy: {
        warehouse: {
          name: 'asc',
        },
      },
    });

    // 在庫合計を計算（単位ごと）
    const totals = inventory.reduce((acc, inv) => {
      const unitId = inv.unitId;

      if (!acc[unitId]) {
        acc[unitId] = {
          unit: inv.unit,
          quantity: 0,
        };
      }

      acc[unitId].quantity += inv.quantity;

      return acc;
    }, {} as Record<number, { unit: any; quantity: number }>);

    // 結果を作成
    const result = {
      lot,
      item: lot.item,
      inventory,
      totals: Object.values(totals),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('ロット別在庫取得エラー:', error);
    return NextResponse.json(
      { error: 'ロット別在庫の取得に失敗しました' },
      { status: 500 }
    );
  }
}