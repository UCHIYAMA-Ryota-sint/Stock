import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TransactionType } from '@prisma/client';

// 出庫登録
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
    const existingInventory = await prisma.inventory.findUnique({
      where: {
        lotId_warehouseId_unitId: {
          lotId: body.lotId,
          warehouseId: body.warehouseId,
          unitId: body.unitId,
        },
      },
    });

    if (!existingInventory) {
      return NextResponse.json(
        { error: '指定されたロット、倉庫、単位の在庫が存在しません' },
        { status: 400 }
      );
    }

    // 在庫数量の確認
    if (existingInventory.quantity < body.quantity) {
      return NextResponse.json(
        { error: '出庫数量が在庫数量を超えています' },
        { status: 400 }
      );
    }

    // トランザクション日時の設定
    const transactionDate = body.transactionDate ? new Date(body.transactionDate) : new Date();

    // トランザクションで出庫処理を実行
    const result = await prisma.$transaction(async (tx) => {
      // 出庫トランザクションの作成
      const transaction = await tx.inventoryTransaction.create({
        data: {
          transactionType: TransactionType.OUTBOUND,
          lotId: body.lotId,
          warehouseId: body.warehouseId,
          quantity: body.quantity,
          unitId: body.unitId,
          transactionDate,
          referenceNumber: body.referenceNumber,
          barcodeData: body.barcodeData,
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

      // 在庫を更新
      const newQuantity = existingInventory.quantity - body.quantity;

      if (newQuantity > 0) {
        // 在庫数量を減らす
        await tx.inventory.update({
          where: { id: existingInventory.id },
          data: {
            quantity: newQuantity,
          },
        });
      } else {
        // 在庫数量が0になった場合は在庫レコードを削除
        await tx.inventory.delete({
          where: { id: existingInventory.id },
        });
      }

      // 引当がある場合は引当も更新（オプション）
      if (body.allocationId) {
        const allocation = await tx.allocation.findUnique({
          where: { id: body.allocationId },
        });

        if (allocation) {
          if (allocation.quantity <= body.quantity) {
            // 引当数量以下の出庫の場合は引当を削除
            await tx.allocation.delete({
              where: { id: body.allocationId },
            });
          } else {
            // 引当数量より少ない出庫の場合は引当数量を減らす
            await tx.allocation.update({
              where: { id: body.allocationId },
              data: {
                quantity: allocation.quantity - body.quantity,
              },
            });
          }
        }
      }

      return transaction;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('出庫登録エラー:', error);
    return NextResponse.json(
      { error: '出庫処理に失敗しました' },
      { status: 500 }
    );
  }
}