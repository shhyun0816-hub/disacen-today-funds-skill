# 디자센 · 오늘의 인기펀드 스킬 (Render / Docker)
# puppeteer(Chromium) 실행에 필요한 시스템 라이브러리 + 한글 폰트 포함
FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    fonts-noto-cjk \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
# puppeteer 가 번들 Chromium 을 이 경로로 내려받도록 고정 (이미지에 포함됨)
ENV PUPPETEER_CACHE_DIR=/app/.cache/puppeteer

WORKDIR /app

# 의존성 먼저 설치 (레이어 캐시 활용). puppeteer postinstall 이 Chromium 다운로드
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Render 는 PORT 환경변수를 자동 주입 (server.js 가 process.env.PORT 사용)
EXPOSE 3000

CMD ["node", "server.js"]
