export interface NaverProfile {
  id: string;
  nickname?: string;
  gender?: "M" | "F" | "U";
  birthday?: string;
  birthyear?: string;
}

function getNaverConfig(): {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
} {
  const clientId = process.env.NAVER_CLIENT_ID?.trim();
  const clientSecret = process.env.NAVER_CLIENT_SECRET?.trim();
  const callbackUrl = process.env.NAVER_CALLBACK_URL?.trim();
  if (!clientId || !clientSecret || !callbackUrl) {
    throw new Error("네이버 로그인 환경변수가 설정되지 않았습니다.");
  }
  return { clientId, clientSecret, callbackUrl };
}

export function buildNaverAuthorizationUrl(state: string): string {
  const { clientId, callbackUrl } = getNaverConfig();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: callbackUrl,
    state,
  });
  return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
}

export async function exchangeNaverAuthorizationCode(code: string, state: string): Promise<string> {
  const { clientId, clientSecret, callbackUrl } = getNaverConfig();
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: callbackUrl,
    code,
    state,
  });
  const response = await fetch(`https://nid.naver.com/oauth2.0/token?${params.toString()}`);
  const result = await response.json() as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !result.access_token) {
    throw new Error(result.error_description ?? result.error ?? "네이버 액세스 토큰을 받지 못했습니다.");
  }
  return result.access_token;
}

export async function fetchNaverProfile(accessToken: string): Promise<NaverProfile> {
  const response = await fetch("https://openapi.naver.com/v1/nid/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const result = await response.json() as {
    resultcode?: string;
    message?: string;
    response?: NaverProfile;
  };
  if (!response.ok || result.resultcode !== "00" || !result.response?.id) {
    throw new Error(result.message ?? "네이버 사용자 정보를 받지 못했습니다.");
  }
  return result.response;
}
