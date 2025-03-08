import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 倉庫詳細取得
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

    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        inventory: {
          include: {
            lot: {
              include: {
                item: true,
              },
            },
            unit: true,
          },
        },
      },
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: '倉庫が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(warehouse);
  } catch (error) {
    console.error('倉庫詳細取得エラー:', error);
    return NextResponse.json(
      { error: '倉庫詳細の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 倉庫更新
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
        { error: '倉庫名は必須です' },
        { status: 400 }
      );
    }

    // 倉庫の存在確認
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id },
    });

    if (!existingWarehouse) {
      return NextResponse.json(
        { error: '倉庫が見つかりません' },
        { status: 404 }
      );
    }

    // 倉庫コードの変更がある場合は重複チェック
    if (body.code && body.code !== existingWarehouse.code) {
      const duplicateCode = await prisma.warehouse.findUnique({
        where: { code: body.code },
      });

      if (duplicateCode) {
        return NextResponse.json(
          { error: '倉庫コードが既に存在します' },
          { status: 400 }
        );
      }
    }

    // 倉庫の更新
    const updatedWarehouse = await prisma.warehouse.update({
      where: { id },
      data: {
        code: body.code || existingWarehouse.code,
        name: body.name,
        description: body.description,
      },
    });

    return NextResponse.json(updatedWarehouse);
  } catch (error) {
    console.error('倉庫更新エラー:', error);
    return NextResponse.json(
      { error: '倉庫の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// 倉庫削除
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

    // 倉庫の存在確認
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        inventory: true,
        inventoryTransaction: true,
        monthlyInventory: true,
        allocation: true,
      },
    });

    if (!existingWarehouse) {
      return NextResponse.json(
        { error: '倉庫が見つかりません' },
        { status: 404 }
      );
    }

    // 関連データの確認
    if (
      existingWarehouse.inventory.length > 0 ||
      existingWarehouse.inventoryTransaction.length > 0 ||
      existingWarehouse.monthlyInventory.length > 0 ||
      existingWarehouse.allocation.length > 0
    ) {
      return NextResponse.json(
        { error: 'この倉庫は使用されているため削除できません' },
        { status: 400 }
      );
    }

    // 倉庫の削除
    await prisma.warehouse.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('倉庫削除エラー:', error);
    return NextResponse.json(
      { error: '倉庫の削除に失敗しました' },
      { status: 500 }
    );
  }
}