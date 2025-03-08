import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TransactionType } from '@prisma/client';

// 入庫登録
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

    // トランザクション日時の設定
    const transactionDate = body.transactionDate ? new Date(body.transactionDate) : new Date();

    // トランザクションで入庫処理を実行
    const result = await prisma.$transaction(async (tx) => {
      // 入庫トランザクションの作成
      const transaction = await tx.inventoryTransaction.create({
        data: {
          transactionType: TransactionType.INBOUND,
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

      // 既存の在庫を確認
      const existingInventory = await tx.inventory.findUnique({
        where: {
          lotId_warehouseId_unitId: {
            lotId: body.lotId,
            warehouseId: body.warehouseId,
            unitId: body.unitId,
          },
        },
      });

      if (existingInventory) {
        // 既存の在庫を更新
        await tx.inventory.update({
          where: { id: existingInventory.id },
          data: {
            quantity: existingInventory.quantity + body.quantity,
          },
        });
      } else {
        // 新規在庫を作成
        await tx.inventory.create({
          data: {
            lotId: body.lotId,
            warehouseId: body.warehouseId,
            quantity: body.quantity,
            unitId: body.unitId,
          },
        });
      }

      return transaction;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('入庫登録エラー:', error);
    return NextResponse.json(
      { error: '入庫処理に失敗しました' },
      { status: 500 }
    );
  }
}