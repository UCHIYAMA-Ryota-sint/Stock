import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 単位詳細取得
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

    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        itemUnits: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!unit) {
      return NextResponse.json(
        { error: '単位が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(unit);
  } catch (error) {
    console.error('単位詳細取得エラー:', error);
    return NextResponse.json(
      { error: '単位詳細の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 単位更新
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
    if (!body.name) {
      return NextResponse.json(
        { error: '単位名は必須です' },
        { status: 400 }
      );
    }

    // 単位の存在確認
    const existingUnit = await prisma.unit.findUnique({
      where: { id },
    });

    if (!existingUnit) {
      return NextResponse.json(
        { error: '単位が見つかりません' },
        { status: 404 }
      );
    }

    // 単位名の変更がある場合は重複チェック
    if (body.name !== existingUnit.name) {
      const duplicateName = await prisma.unit.findUnique({
        where: { name: body.name },
      });

      if (duplicateName) {
        return NextResponse.json(
          { error: '単位名が既に存在します' },
          { status: 400 }
        );
      }
    }

    // 単位の更新
    const updatedUnit = await prisma.unit.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
      },
    });

    return NextResponse.json(updatedUnit);
  } catch (error) {
    console.error('単位更新エラー:', error);
    return NextResponse.json(
      { error: '単位の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// 単位削除
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

    // 単位の存在確認
    const existingUnit = await prisma.unit.findUnique({
      where: { id },
      include: {
        itemUnits: true,
        inventory: true,
        inventoryTransaction: true,
        monthlyInventory: true,
        allocation: true,
      },
    });

    if (!existingUnit) {
      return NextResponse.json(
        { error: '単位が見つかりません' },
        { status: 404 }
      );
    }

    // 関連データの確認
    if (
      existingUnit.itemUnits.length > 0 ||
      existingUnit.inventory.length > 0 ||
      existingUnit.inventoryTransaction.length > 0 ||
      existingUnit.monthlyInventory.length > 0 ||
      existingUnit.allocation.length > 0
    ) {
      return NextResponse.json(
        { error: 'この単位は使用されているため削除できません' },
        { status: 400 }
      );
    }

    // 単位の削除
    await prisma.unit.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('単位削除エラー:', error);
    return NextResponse.json(
      { error: '単位の削除に失敗しました' },
      { status: 500 }
    );
  }
}