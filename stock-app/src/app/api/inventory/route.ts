import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 在庫一覧取得
export async function GET(request: NextRequest) {
  try {
    const inventory = await prisma.inventory.findMany({
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

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('在庫一覧取得エラー:', error);
    return NextResponse.json(
      { error: '在庫一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 在庫登録/更新
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    if (!body.lotId || !body.warehouseId || body.quantity === undefined || !body.unitId) {
      return NextResponse.json(
        { error: 'ロットID、倉庫ID、数量、単位IDは必須です' },
        { status: 400 }
      );
    }

    // ロットの存在確認
    const lot = await prisma.lot.findUnique({
      where: { id: body.lotId },
    });

    if (!lot) {
      return NextResponse.json(
        { error: '指定されたロットが存在しません' },
        { status: 400 }
      );
    }

    // 倉庫の存在確認
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: body.warehouseId },
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: '指定された倉庫が存在しません' },
        { status: 400 }
      );
    }

    // 単位の存在確認
    const unit = await prisma.unit.findUnique({
      where: { id: body.unitId },
    });

    if (!unit) {
      return NextResponse.json(
        { error: '指定された単位が存在しません' },
        { status: 400 }
      );
    }

    // 既存の在庫を確認
    const existingInventory = await prisma.inventory.findUnique({
      where: {
        lotId_warehouseId_unitId: {
          lotId: body.lotId,
          warehouseId: body.warehouseId,
          unitId: body.unitId,
        },
      },
    });

    let result;

    if (existingInventory) {
      // 既存の在庫を更新
      result = await prisma.inventory.update({
        where: { id: existingInventory.id },
        data: {
          quantity: body.quantity,
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
      });
    } else {
      // 新規在庫を作成
      result = await prisma.inventory.create({
        data: {
          lotId: body.lotId,
          warehouseId: body.warehouseId,
          quantity: body.quantity,
          unitId: body.unitId,
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
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('在庫登録/更新エラー:', error);
    return NextResponse.json(
      { error: '在庫の登録/更新に失敗しました' },
      { status: 500 }
    );
  }
}