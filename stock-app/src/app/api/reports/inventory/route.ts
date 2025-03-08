import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 在庫一覧レポート取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // フィルタリングパラメータの取得
    const itemId = searchParams.get('itemId');
    const warehouseId = searchParams.get('warehouseId');
    const format = searchParams.get('format') || 'json';

    // 在庫データの取得
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
      where: {
        ...(itemId ? { lot: { itemId: parseInt(itemId) } } : {}),
        ...(warehouseId ? { warehouseId: parseInt(warehouseId) } : {}),
      },
      orderBy: [
        {
          lot: {
            item: {
              name: 'asc',
            },
          },
        },
        {
          warehouse: {
            name: 'asc',
          },
        },
        {
          lot: {
            lotNumber: 'asc',
          },
        },
      ],
    });

    // 引当データの取得
    const allocations = await prisma.allocation.findMany({
      include: {
        lot: true,
        warehouse: true,
        unit: true,
      },
    });

    // 在庫データに引当情報を追加
    const inventoryWithAllocations = inventory.map(inv => {
      // この在庫に対する引当を検索
      const matchingAllocations = allocations.filter(
        alloc =>
          alloc.lotId === inv.lotId &&
          alloc.warehouseId === inv.warehouseId &&
          alloc.unitId === inv.unitId
      );

      // 引当数量の合計を計算
      const allocatedQuantity = matchingAllocations.reduce(
        (sum, alloc) => sum + alloc.quantity, 0
      );

      // 有効在庫数量を計算
      const availableQuantity = inv.quantity - allocatedQuantity;

      return {
        ...inv,
        allocatedQuantity,
        availableQuantity,
        allocations: matchingAllocations,
      };
    });

    // 商品ごとにグループ化
    const groupedByItem = inventoryWithAllocations.reduce((acc, inv) => {
      const itemId = inv.lot.itemId;
      const itemName = inv.lot.item.name;
      const itemCode = inv.lot.item.code;
      const itemType = inv.lot.item.itemType;

      if (!acc[itemId]) {
        acc[itemId] = {
          itemId,
          itemName,
          itemCode,
          itemType,
          warehouses: {},
          totalQuantity: 0,
          totalAllocatedQuantity: 0,
          totalAvailableQuantity: 0,
        };
      }

      // 倉庫ごとにグループ化
      const warehouseId = inv.warehouseId;
      const warehouseName = inv.warehouse.name;

      if (!acc[itemId].warehouses[warehouseId]) {
        acc[itemId].warehouses[warehouseId] = {
          warehouseId,
          warehouseName,
          lots: [],
          warehouseTotalQuantity: 0,
          warehouseTotalAllocatedQuantity: 0,
          warehouseTotalAvailableQuantity: 0,
        };
      }

      // ロット情報を追加
      acc[itemId].warehouses[warehouseId].lots.push({
        lotId: inv.lotId,
        lotNumber: inv.lot.lotNumber,
        productionDate: inv.lot.productionDate,
        quantity: inv.quantity,
        allocatedQuantity: inv.allocatedQuantity,
        availableQuantity: inv.availableQuantity,
        unit: inv.unit,
      });

      // 倉庫合計を更新
      acc[itemId].warehouses[warehouseId].warehouseTotalQuantity += inv.quantity;
      acc[itemId].warehouses[warehouseId].warehouseTotalAllocatedQuantity += inv.allocatedQuantity;
      acc[itemId].warehouses[warehouseId].warehouseTotalAvailableQuantity += inv.availableQuantity;

      // 商品合計を更新
      acc[itemId].totalQuantity += inv.quantity;
      acc[itemId].totalAllocatedQuantity += inv.allocatedQuantity;
      acc[itemId].totalAvailableQuantity += inv.availableQuantity;

      return acc;
    }, {} as Record<number, any>);

    // 結果を配列に変換
    const result = Object.values(groupedByItem).map(item => {
      return {
        ...item,
        warehouses: Object.values(item.warehouses),
      };
    });

    // フォーマットに応じてレスポンスを返す
    if (format === 'csv') {
      // CSVフォーマットでの出力
      const csvRows = [];

      // ヘッダー行
      csvRows.push([
        '商品コード',
        '商品名',
        '商品種類',
        '倉庫',
        'ロット番号',
        '製造日/入荷日',
        '数量',
        '単位',
        '引当数量',
        '有効在庫数量',
      ].join(','));

      // データ行
      result.forEach(item => {
        item.warehouses.forEach((warehouse: any) => {
          warehouse.lots.forEach((lot: any) => {
            csvRows.push([
              `"${item.itemCode}"`,
              `"${item.itemName}"`,
              `"${item.itemType}"`,
              `"${warehouse.warehouseName}"`,
              `"${lot.lotNumber}"`,
              `"${new Date(lot.productionDate).toISOString().split('T')[0]}"`,
              lot.quantity,
              `"${lot.unit.name}"`,
              lot.allocatedQuantity,
              lot.availableQuantity,
            ].join(','));
          });
        });
      });

      const csvContent = csvRows.join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="inventory-report.csv"',
        },
      });
    } else {
      // JSONフォーマットでの出力
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        totalItems: result.length,
        data: result,
      });
    }
  } catch (error) {
    console.error('在庫一覧レポート取得エラー:', error);
    return NextResponse.json(
      { error: '在庫一覧レポートの取得に失敗しました' },
      { status: 500 }
    );
  }
}