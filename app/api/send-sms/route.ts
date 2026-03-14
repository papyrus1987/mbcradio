import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phone, name, formUrl, productNames, uniqueCode, hasTaxable } = await request.json();

    // 환경 변수 확인
    const apiKey = process.env.ALIGO_API_KEY;
    const userId = process.env.ALIGO_USER_ID;
    const sender = process.env.ALIGO_SENDER;

    if (!apiKey || !userId || !sender || apiKey === 'your_api_key_here') {
      return NextResponse.json(
        { success: false, error: '알리고 API 설정이 필요합니다. 환경변수를 확인해주세요.' },
        { status: 400 }
      );
    }

    // 전화번호 형식 정리 (하이픈 제거)
    const cleanPhone = phone.replace(/-/g, '');

    // 과세/비과세에 따른 SMS 메시지 내용
    const message = hasTaxable
      ? `[MBC라디오 여성시대]

${name}님, 축하합니다!
이벤트에 당첨되셨습니다.

▶ 당첨 상품: ${productNames}
▶ 고유번호: ${uniqueCode}

상품 수령을 위해 아래 링크에서 정보를 입력해주세요.
${formUrl}

※ 과세 상품이 포함되어 있어 본인인증 및 주민등록번호 입력이 필요합니다.
※ 3개월 이내 미입력 시 당첨이 취소될 수 있습니다.`
      : `[MBC라디오 여성시대]

${name}님, 축하합니다!
이벤트에 당첨되셨습니다.

▶ 당첨 상품: ${productNames}
▶ 고유번호: ${uniqueCode}

상품 수령을 위해 아래 링크에서 정보를 입력해주세요.
${formUrl}

※ 3개월 이내 미입력 시 당첨이 취소될 수 있습니다.`;

    // 알리고 SMS API 호출 (LMS - 장문)
    const smsFormData = new FormData();
    smsFormData.append('key', apiKey);
    smsFormData.append('user_id', userId);
    smsFormData.append('sender', sender);
    smsFormData.append('receiver', cleanPhone);
    smsFormData.append('msg', message);
    smsFormData.append('msg_type', 'LMS'); // 장문 메시지
    smsFormData.append('title', '[MBC 여성시대] 당첨 안내');

    const response = await fetch('https://apis.aligo.in/send/', {
      method: 'POST',
      body: smsFormData,
    });

    const result = await response.json();

    if (result.result_code === '1') {
      return NextResponse.json({
        success: true,
        message: 'SMS가 발송되었습니다.',
        result
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.message || 'SMS 발송에 실패했습니다.', result },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
