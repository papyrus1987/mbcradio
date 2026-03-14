import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { winnerId, code } = await request.json();

    // OTP 확인
    const { data: otpData, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('winner_id', winnerId)
      .eq('code', code)
      .single();

    if (otpError || !otpData) {
      return NextResponse.json(
        { success: false, error: '인증번호가 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    // 만료 시간 확인
    if (new Date(otpData.expires_at) < new Date()) {
      // 만료된 OTP 삭제
      await supabase
        .from('otp_codes')
        .delete()
        .eq('id', otpData.id);

      return NextResponse.json(
        { success: false, error: '인증번호가 만료되었습니다. 다시 요청해주세요.' },
        { status: 400 }
      );
    }

    // 인증 성공 - OTP 삭제
    await supabase
      .from('otp_codes')
      .delete()
      .eq('id', otpData.id);

    // winners 테이블에 인증 완료 표시
    await supabase
      .from('winners')
      .update({ phone_verified: true })
      .eq('id', winnerId);

    return NextResponse.json({
      success: true,
      message: '인증이 완료되었습니다.',
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
