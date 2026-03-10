import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phone, name, formUrl, productNames, uniqueCode, hasTaxable } = await request.json();

    // 환경 변수 확인
    const apiKey = process.env.ALIGO_API_KEY;
    const userId = process.env.ALIGO_USER_ID;
    const sender = process.env.ALIGO_SENDER;
    const channelKey = process.env.ALIGO_KAKAO_CHANNEL_KEY;
    const templateCode = process.env.ALIGO_KAKAO_TEMPLATE_CODE;

    if (!apiKey || !userId || !sender || apiKey === 'your_api_key_here') {
      return NextResponse.json(
        { success: false, error: '알리고 API 설정이 필요합니다. .env.local 파일을 확인해주세요.' },
        { status: 400 }
      );
    }

    // 전화번호 형식 정리 (하이픈 제거)
    const cleanPhone = phone.replace(/-/g, '');

    // 알리고 카카오 알림톡 API 호출
    const formData = new FormData();
    formData.append('apikey', apiKey);
    formData.append('userid', userId);
    formData.append('senderkey', channelKey || '');
    formData.append('tpl_code', templateCode || '');
    formData.append('sender', sender);
    formData.append('receiver_1', cleanPhone);
    formData.append('subject_1', 'MBC 여성시대 당첨 안내');

    // 템플릿 변수 (알리고에서 템플릿 등록 시 설정한 변수명에 맞춰 수정 필요)
    const taxableNotice = hasTaxable
      ? '\n※ 과세 상품이 포함되어 있어 주민등록번호 입력이 필요합니다.'
      : '';

    const message = `[MBC라디오 여성시대]

${name}님, 축하합니다!
이벤트에 당첨되셨습니다.

▶ 당첨 상품: ${productNames}
▶ 고유번호: ${uniqueCode}

상품 수령을 위해 아래 링크에서 정보를 입력해주세요.
${formUrl}
${taxableNotice}
※ 3개월 이내 미입력 시 당첨이 취소될 수 있습니다.`;

    formData.append('message_1', message);

    // 알림톡 발송이 실패하면 SMS로 대체 발송
    formData.append('failover', 'Y');
    formData.append('fsubject_1', 'MBC 여성시대 당첨 안내');
    formData.append('fmessage_1', message);

    const response = await fetch('https://kakaoapi.aligo.in/akv10/alimtalk/send/', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.code === 0 || result.code === '0') {
      return NextResponse.json({
        success: true,
        message: '카카오톡 알림톡이 발송되었습니다.',
        result
      });
    } else {
      // 알림톡 실패 시 일반 SMS로 발송 시도
      const smsFormData = new FormData();
      smsFormData.append('key', apiKey);
      smsFormData.append('user_id', userId);
      smsFormData.append('sender', sender);
      smsFormData.append('receiver', cleanPhone);
      smsFormData.append('msg', `[MBC 여성시대] ${name}님 당첨 축하드립니다! 고유번호: ${uniqueCode} / 정보입력: ${formUrl}`);
      smsFormData.append('msg_type', 'LMS');

      const smsResponse = await fetch('https://apis.aligo.in/send/', {
        method: 'POST',
        body: smsFormData,
      });

      const smsResult = await smsResponse.json();

      if (smsResult.result_code === '1') {
        return NextResponse.json({
          success: true,
          message: 'SMS로 발송되었습니다. (카카오톡 발송 실패)',
          result: smsResult
        });
      }

      return NextResponse.json(
        { success: false, error: result.message || smsResult.message || '발송에 실패했습니다.', result },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error sending KakaoTalk:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
