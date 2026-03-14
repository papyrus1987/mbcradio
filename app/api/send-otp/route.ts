import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { phone, winnerId } = await request.json();

    // 환경 변수 확인
    const apiKey = process.env.ALIGO_API_KEY;
    const userId = process.env.ALIGO_USER_ID;
    const sender = process.env.ALIGO_SENDER;

    if (!apiKey || !userId || !sender || apiKey === 'your_api_key_here') {
      return NextResponse.json(
        { success: false, error: '알리고 API 설정이 필요합니다.' },
        { status: 400 }
      );
    }

    // 6자리 인증번호 생성
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 전화번호 형식 정리 (하이픈 제거)
    const cleanPhone = phone.replace(/-/g, '');

    // OTP 코드를 DB에 저장 (5분 후 만료)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // 기존 OTP 삭제 후 새로 저장
    await supabase
      .from('otp_codes')
      .delete()
      .eq('winner_id', winnerId);

    const { error: insertError } = await supabase
      .from('otp_codes')
      .insert([{
        winner_id: winnerId,
        phone: cleanPhone,
        code: otpCode,
        expires_at: expiresAt,
      }]);

    if (insertError) {
      console.error('Error saving OTP:', insertError);
      return NextResponse.json(
        { success: false, error: 'OTP 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    // SMS 발송
    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('user_id', userId);
    formData.append('sender', sender);
    formData.append('receiver', cleanPhone);
    formData.append('msg', `[MBC 여성시대] 본인인증 번호는 [${otpCode}]입니다. 5분 내 입력해주세요.`);
    formData.append('msg_type', 'SMS');

    const response = await fetch('https://apis.aligo.in/send/', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.result_code === '1') {
      return NextResponse.json({
        success: true,
        message: '인증번호가 발송되었습니다.',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.message || '인증번호 발송에 실패했습니다.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
