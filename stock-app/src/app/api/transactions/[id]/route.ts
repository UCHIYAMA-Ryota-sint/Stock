import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 入出庫詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: '無効なIDです' },
        { status: 400 }
      );
    }

    const transaction = await prisma.inventoryTransaction.findUnique({
      where: { id },
      include: {
        lot: {
          include: {
            item: true,
          },
        },
        warehouse: true,
        unit: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: '入出庫データが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('入出庫詳細取得エラー:', error);
    return NextResponse.json(
      { error: '入出庫詳細の取得に失敗しました' },
      { status: 500 }
    );
  }
}