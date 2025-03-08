import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 引当詳細取得
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

    const allocation = await prisma.allocation.findUnique({
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

    if (!allocation) {
      return NextResponse.json(
        { error: '引当が見つかりません' },
        { status: 404 }
      );
    }

    // 在庫情報も取得
    const inventory = await prisma.inventory.findUnique({
      where: {
        lotId_warehouseId_unitId: {
          lotId: allocation.lotId,
          warehouseId: allocation.warehouseId,
          unitId: allocation.unitId,
        },
      },
    });

    // 他の引当情報も取得
    const otherAllocations = await prisma.allocation.findMany({
      where: {
        lotId: allocation.lotId,
        warehouseId: allocation.warehouseId,
        unitId: allocation.unitId,
        id: {
          not: id,
        },
      },
    });

    // 他の引当数量の合計を計算
    const totalOtherAllocations = otherAllocations.reduce(
      (sum, a) => sum + a.quantity, 0
    );

    // 在庫情報を追加
    const result = {
      ...allocation,
      inventoryQuantity: inventory ? inventory.quantity : 0,
      otherAllocationsQuantity: totalOtherAllocations,
      availableQuantity: inventory ? inventory.quantity - totalOtherAllocations : 0,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('引当詳細取得エラー:', error);
    return NextResponse.json(
      { error: '引当詳細の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 引当更新
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
    if (body.quantity === undefined) {
      return NextResponse.json(
        { error: '数量は必須です' },
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

    // 引当の存在確認
    const existingAllocation = await prisma.allocation.findUnique({
      where: { id },
    });

    if (!existingAllocation) {
      return NextResponse.json(
        { error: '引当が見つかりません' },
        { status: 404 }
      );
    }

    // 在庫の確認
    const inventory = await prisma.inventory.findUnique({
      where: {
        lotId_warehouseId_unitId: {
          lotId: existingAllocation.lotId,
          warehouseId: existingAllocation.warehouseId,
          unitId: existingAllocation.unitId,
        },
      },
    });

    if (!inventory) {
      return NextResponse.json(
        { error: '対応する在庫が存在しません' },
        { status: 400 }
      );
    }

    // 他の引当を取得
    const otherAllocations = await prisma.allocation.findMany({
      where: {
        lotId: existingAllocation.lotId,
        warehouseId: existingAllocation.warehouseId,
        unitId: existingAllocation.unitId,
        id: {
          not: id,
        },
      },
    });

    // 他の引当数量の合計を計算
    const totalOtherAllocations = otherAllocations.reduce(
      (sum, a) => sum + a.quantity, 0
    );

    // 引当可能数量を計算
    const availableQuantity = inventory.quantity - totalOtherAllocations;

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
    const allocationDate = body.allocationDate ? new Date(body.allocationDate) : existingAllocation.allocationDate;

    // 引当の更新
    const updatedAllocation = await prisma.allocation.update({
      where: { id },
      data: {
        quantity: body.quantity,
        referenceNumber: body.referenceNumber || existingAllocation.referenceNumber,
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

    return NextResponse.json(updatedAllocation);
  } catch (error) {
    console.error('引当更新エラー:', error);
    return NextResponse.json(
      { error: '引当の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// 引当解除
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

    // 引当の存在確認
    const allocation = await prisma.allocation.findUnique({
      where: { id },
      include: {
        lot: true,
        warehouse: true,
        unit: true,
      },
    });

    if (!allocation) {
      return NextResponse.json(
        { error: '引当が見つかりません' },
        { status: 404 }
      );
    }

    // 引当の削除
    await prisma.allocation.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '引当を解除しました',
      deletedAllocation: allocation,
    });
  } catch (error) {
    console.error('引当解除エラー:', error);
    return NextResponse.json(
      { error: '引当の解除に失敗しました' },
      { status: 500 }
    );
  }
}