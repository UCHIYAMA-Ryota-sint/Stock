import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ItemType } from '@prisma/client';

// 商品詳細取得
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

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        itemUnits: {
          include: {
            unit: true,
          },
        },
        lots: true,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: '商品が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('商品詳細取得エラー:', error);
    return NextResponse.json(
      { error: '商品詳細の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 商品更新
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
    if (!body.name || !body.itemType) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    // 商品タイプの検証
    if (!Object.values(ItemType).includes(body.itemType)) {
      return NextResponse.json(
        { error: '無効な商品タイプです' },
        { status: 400 }
      );
    }

    // 商品の存在確認
    const existingItem = await prisma.item.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: '商品が見つかりません' },
        { status: 404 }
      );
    }

    // 商品コードの変更がある場合は重複チェック
    if (body.code && body.code !== existingItem.code) {
      const duplicateCode = await prisma.item.findUnique({
        where: { code: body.code },
      });

      if (duplicateCode) {
        return NextResponse.json(
          { error: '商品コードが既に存在します' },
          { status: 400 }
        );
      }
    }

    // 商品の更新
    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        code: body.code || existingItem.code,
        name: body.name,
        description: body.description,
        itemType: body.itemType as ItemType,
      },
    });

    // 単位情報の更新
    if (body.units && Array.isArray(body.units) && body.units.length > 0) {
      // 既存の単位情報を削除
      await prisma.itemUnit.deleteMany({
        where: { itemId: id },
      });

      // 新しい単位情報を作成
      const itemUnits = await Promise.all(
        body.units.map(async (unitData: any) => {
          return prisma.itemUnit.create({
            data: {
              itemId: id,
              unitId: unitData.unitId,
              conversionRate: unitData.conversionRate || 1.0,
              isDefault: unitData.isDefault || false,
            },
          });
        })
      );

      return NextResponse.json({ ...updatedItem, itemUnits });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('商品更新エラー:', error);
    return NextResponse.json(
      { error: '商品の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// 商品削除
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

    // 商品の存在確認
    const existingItem = await prisma.item.findUnique({
      where: { id },
      include: {
        lots: true,
        itemUnits: true,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: '商品が見つかりません' },
        { status: 404 }
      );
    }

    // 関連データの確認
    if (existingItem.lots.length > 0) {
      return NextResponse.json(
        { error: 'この商品に関連するロットが存在するため削除できません' },
        { status: 400 }
      );
    }

    // トランザクションで関連データも含めて削除
    await prisma.$transaction([
      // 商品単位の削除
      prisma.itemUnit.deleteMany({
        where: { itemId: id },
      }),
      // 商品の削除
      prisma.item.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('商品削除エラー:', error);
    return NextResponse.json(
      { error: '商品の削除に失敗しました' },
      { status: 500 }
    );
  }
}