import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 引当一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // フィルタリングパラメータの取得
    const itemId = searchParams.get('itemId');
    const warehouseId = searchParams.get('warehouseId');
    const lotId = searchParams.get('lotId');
    const referenceNumber = searchParams.get('referenceNumber');

    // クエリ条件の構築
    let whereClause: any = {};

    // 商品IDによるフィルタリング（ロットを通じて）
    if (itemId) {
      const parsedItemId = parseInt(itemId);
      if (!isNaN(parsedItemId)) {
        whereClause.lot = {
          itemId: parsedItemId,
        };
      }
    }

    // 倉庫IDによるフィルタリング
    if (warehouseId) {
      const parsedWarehouseId = parseInt(warehouseId);
      if (!isNaN(parsedWarehouseId)) {
        whereClause.warehouseId = parsedWarehouseId;
      }
    }

    // ロットIDによるフィルタリング
    if (lotId) {
      const parsedLotId = parseInt(lotId);
      if (!isNaN(parsedLotId)) {
        whereClause.lotId = parsedLotId;
      }
    }

    // 参照番号によるフィルタリング
    if (referenceNumber) {
      whereClause.referenceNumber = {
        contains: referenceNumber,
      };
    }

    // 引当データの取得
    const allocations = await prisma.allocation.findMany({
      where: whereClause,
      include: {
        lot: {
          include: {
            item: true,
          },
        },
        warehouse: true,
        unit: true,
      },
      orderBy: {
        allocationDate: 'desc',
      },
    });

    return NextResponse.json(allocations);
  } catch (error) {
    console.error('引当一覧取得エラー:', error);
    return NextResponse.json(
      { error: '引当一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 引当登録
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

    // 数量が正の値であることを確認
    if (body.quantity <= 0) {
      return NextResponse.json(
        { error: '数量は正の値である必要があります' },
        { status: 400 }
      );
    }

    // ロットの存在確認
    const lot = await prisma.lot.findUnique({
      where: { id: body.lotId },
      include: {
        item: true,
      },
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

    // 在庫の確認
    const inventory = await prisma.inventory.findUnique({
      where: {
        lotId_warehouseId_unitId: {
          lotId: body.lotId,
          warehouseId: body.warehouseId,
          unitId: body.unitId,
        },
      },
    });

    if (!inventory) {
      return NextResponse.json(
        { error: '指定されたロット、倉庫、単位の在庫が存在しません' },
        { status: 400 }
      );
    }

    // 既存の引当を取得
    const existingAllocations = await prisma.allocation.findMany({
      where: {
        lotId: body.lotId,
        warehouseId: body.warehouseId,
        unitId: body.unitId,
      },
    });

    // 既存の引当数量の合計を計算
    const totalAllocatedQuantity = existingAllocations.reduce(
      (sum, allocation) => sum + allocation.quantity, 0
    );

    // 引当可能数量を計算
    const availableQuantity = inventory.quantity - totalAllocatedQuantity;

    // 引当可能数量の確認
    if (availableQuantity < body.quantity) {
      return NextResponse.json(
        {
          error: '引当数量が引当可能数量を超えています',
          availableQuantity,
          requestedQuantity: body.quantity,
        },
        { status: 400 }
      );
    }

    // 引当日時の設定
    const allocationDate = body.allocationDate ? new Date(body.allocationDate) : new Date();

    // 引当の作成
    const allocation = await prisma.allocation.create({
      data: {
        lotId: body.lotId,
        warehouseId: body.warehouseId,
        quantity: body.quantity,
        unitId: body.unitId,
        referenceNumber: body.referenceNumber,
        allocationDate,
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

    return NextResponse.json(allocation);
  } catch (error) {
    console.error('引当登録エラー:', error);
    return NextResponse.json(
      { error: '引当登録に失敗しました' },
      { status: 500 }
    );
  }
}