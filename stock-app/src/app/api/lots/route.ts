import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ロット一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    let whereClause = {};

    // 商品IDによるフィルタリング
    if (itemId) {
      const parsedItemId = parseInt(itemId);
      if (!isNaN(parsedItemId)) {
        whereClause = {
          itemId: parsedItemId,
        };
      }
    }

    const lots = await prisma.lot.findMany({
      where: whereClause,
      include: {
        item: true,
      },
      orderBy: {
        productionDate: 'desc',
      },
    });

    return NextResponse.json(lots);
  } catch (error) {
    console.error('ロット一覧取得エラー:', error);
    return NextResponse.json(
      { error: 'ロット一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// ロット登録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    if (!body.lotNumber || !body.itemId || !body.productionDate) {
      return NextResponse.json(
        { error: 'ロット番号、商品ID、製造日/入荷日は必須です' },
        { status: 400 }
      );
    }

    // 商品の存在確認
    const item = await prisma.item.findUnique({
      where: { id: body.itemId },
    });

    if (!item) {
      return NextResponse.json(
        { error: '指定された商品が存在しません' },
        { status: 400 }
      );
    }

    // ロット番号の重複チェック
    const existingLot = await prisma.lot.findUnique({
      where: { lotNumber: body.lotNumber },
    });

    if (existingLot) {
      return NextResponse.json(
        { error: 'ロット番号が既に存在します' },
        { status: 400 }
      );
    }

    // 日付の処理
    let productionDate;
    try {
      productionDate = new Date(body.productionDate);
      if (isNaN(productionDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      return NextResponse.json(
        { error: '無効な日付形式です' },
        { status: 400 }
      );
    }

    // ロットの作成
    const newLot = await prisma.lot.create({
      data: {
        lotNumber: body.lotNumber,
        itemId: body.itemId,
        productionDate,
      },
      include: {
        item: true,
      },
    });

    return NextResponse.json(newLot);
  } catch (error) {
    console.error('ロット登録エラー:', error);
    return NextResponse.json(
      { error: 'ロットの登録に失敗しました' },
      { status: 500 }
    );
  }
}