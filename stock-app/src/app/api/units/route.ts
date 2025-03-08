import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 単位一覧取得
export async function GET(request: NextRequest) {
  try {
    const units = await prisma.unit.findMany();
    return NextResponse.json(units);
  } catch (error) {
    console.error('単位一覧取得エラー:', error);
    return NextResponse.json(
      { error: '単位一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 単位登録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    if (!body.name) {
      return NextResponse.json(
        { error: '単位名は必須です' },
        { status: 400 }
      );
    }

    // 単位名の重複チェック
    const existingUnit = await prisma.unit.findUnique({
      where: { name: body.name },
    });

    if (existingUnit) {
      return NextResponse.json(
        { error: '単位名が既に存在します' },
        { status: 400 }
      );
    }

    // 単位の作成
    const newUnit = await prisma.unit.create({
      data: {
        name: body.name,
        description: body.description,
      },
    });

    return NextResponse.json(newUnit);
  } catch (error) {
    console.error('単位登録エラー:', error);
    return NextResponse.json(
      { error: '単位の登録に失敗しました' },
      { status: 500 }
    );
  }
}