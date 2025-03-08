import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 倉庫一覧取得
export async function GET(request: NextRequest) {
  try {
    const warehouses = await prisma.warehouse.findMany();
    return NextResponse.json(warehouses);
  } catch (error) {
    console.error('倉庫一覧取得エラー:', error);
    return NextResponse.json(
      { error: '倉庫一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 倉庫登録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    if (!body.code || !body.name) {
      return NextResponse.json(
        { error: '倉庫コードと倉庫名は必須です' },
        { status: 400 }
      );
    }

    // 倉庫コードの重複チェック
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { code: body.code },
    });

    if (existingWarehouse) {
      return NextResponse.json(
        { error: '倉庫コードが既に存在します' },
        { status: 400 }
      );
    }

    // 倉庫の作成
    const newWarehouse = await prisma.warehouse.create({
      data: {
        code: body.code,
        name: body.name,
        description: body.description,
      },
    });

    return NextResponse.json(newWarehouse);
  } catch (error) {
    console.error('倉庫登録エラー:', error);
    return NextResponse.json(
      { error: '倉庫の登録に失敗しました' },
      { status: 500 }
    );
  }
}