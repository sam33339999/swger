import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 從URL參數中獲取目標URL
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json(
      { success: false, error: '缺少URL參數' },
      { status: 400 }
    );
  }
  
  try {
    // 發送請求到目標URL
    const response = await fetch(url);
    
    // 檢查響應狀態
    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: `請求失敗: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      );
    }
    
    // 獲取原始內容
    const textContent = await response.text();
    
    // 返回原始內容
    return new Response(textContent, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('代理請求失敗:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '代理請求失敗' 
      },
      { status: 500 }
    );
  }
}
