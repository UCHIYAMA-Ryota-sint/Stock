import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ItemType } from '@prisma/client';

// 商品一覧取得
export async function GET(request: NextRequest) {
  try {
    const items = await prisma.item.findMany({
      include: {
        itemUnits: {
          include: {
            unit: true,
          },
        },
      },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('商品一覧取得エラー:', error);
    return NextResponse.json(
      { error: '商品一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 商品登録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    if (!body.code || !body.name || !body.itemType) {
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

    // 商品コードの重複チェック
    const existingItem = await prisma.item.findUnique({
      where: { code: body.code },
    });

    if (existingItem) {
      return NextResponse.json(
        { error: '商品コードが既に存在します' },
        { status: 400 }
      );
    }

    // 商品の作成
    const newItem = await prisma.item.create({
      data: {
        code: body.code,
        name: body.name,
        description: body.description,
        itemType: body.itemType as ItemType,
      },
    });

    // 単位情報がある場合は商品単位も作成
    if (body.units && Array.isArray(body.units) && body.units.length > 0) {
      const itemUnits = await Promise.all(
        body.units.map(async (unitData: any) => {
          return prisma.itemUnit.create({
            data: {
              itemId: newItem.id,
              unitId: unitData.unitId,
              conversionRate: unitData.conversionRate || 1.0,
              isDefault: unitData.isDefault || false,
            },
          });
        })
      );

      return NextResponse.json({ ...newItem, itemUnits });
    }

    return NextResponse.json(newItem);
  } catch (error) {
    console.error('商品登録エラー:', error);
    return NextResponse.json(
      { error: '商品の登録に失敗しました' },
      { status: 500 }
    );
  }
}