import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ロット詳細取得
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

    const lot = await prisma.lot.findUnique({
      where: { id },
      include: {
        item: true,
        inventory: {
          include: {
            warehouse: true,
            unit: true,
          },
        },
      },
    });

    if (!lot) {
      return NextResponse.json(
        { error: 'ロットが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(lot);
  } catch (error) {
    console.error('ロット詳細取得エラー:', error);
    return NextResponse.json(
      { error: 'ロット詳細の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// ロット更新
export async function PUT(
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

    const body = await request.json();

    // バリデーション
    if (!body.lotNumber || !body.productionDate) {
      return NextResponse.json(
        { error: 'ロット番号と製造日/入荷日は必須です' },
        { status: 400 }
      );
    }

    // ロットの存在確認
    const existingLot = await prisma.lot.findUnique({
      where: { id },
    });

    if (!existingLot) {
      return NextResponse.json(
        { error: 'ロットが見つかりません' },
        { status: 404 }
      );
    }

    // ロット番号の変更がある場合は重複チェック
    if (body.lotNumber !== existingLot.lotNumber) {
      const duplicateLotNumber = await prisma.lot.findUnique({
        where: { lotNumber: body.lotNumber },
      });

      if (duplicateLotNumber) {
        return NextResponse.json(
          { error: 'ロット番号が既に存在します' },
          { status: 400 }
        );
      }
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

    // ロットの更新
    const updatedLot = await prisma.lot.update({
      where: { id },
      data: {
        lotNumber: body.lotNumber,
        productionDate,
      },
      include: {
        item: true,
      },
    });

    return NextResponse.json(updatedLot);
  } catch (error) {
    console.error('ロット更新エラー:', error);
    return NextResponse.json(
      { error: 'ロットの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// ロット削除
export async function DELETE(
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

    // ロットの存在確認
    const existingLot = await prisma.lot.findUnique({
      where: { id },
      include: {
        inventory: true,
        inventoryTransaction: true,
        monthlyInventory: true,
        allocation: true,
      },
    });

    if (!existingLot) {
      return NextResponse.json(
        { error: 'ロットが見つかりません' },
        { status: 404 }
      );
    }

    // 関連データの確認
    if (
      existingLot.inventory.length > 0 ||
      existingLot.inventoryTransaction.length > 0 ||
      existingLot.monthlyInventory.length > 0 ||
      existingLot.allocation.length > 0
    ) {
      return NextResponse.json(
        { error: 'このロットは使用されているため削除できません' },
        { status: 400 }
      );
    }

    // ロットの削除
    await prisma.lot.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('ロット削除エラー:', error);
    return NextResponse.json(
      { error: 'ロットの削除に失敗しました' },
      { status: 500 }
    );
  }
}