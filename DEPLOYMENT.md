# 🚀 Руководство по деплою (Этап 11) — BLACKLINE BARBERS

Данный документ содержит пошаговую инструкцию по деплою монорепозитория в интернет на платформы **Vercel** и **Supabase**.

---

## 1. Загрузка репозитория в GitHub

1. Инициализируйте локальный git-репозиторий (если еще не сделано):
   ```bash
   git init
   git add .
   git commit -m "feat: complete Blackline Barbershop MVP with all 11 stages"
   ```
2. Создайте новый приватный или публичный репозиторий на [GitHub](https://github.com/new).
3. Привяжите remote и отправьте код:
   ```bash
   git remote add origin https://github.com/<your-username>/blackline-barbers.git
   git branch -M main
   git push -u origin main
   ```

---

## 2. Создание проектов в Vercel

В панели Vercel нажмите **Add New… -> Project** и выберите ваш GitHub-репозиторий 3 раза (для каждого приложения):

### Проект 1: `apps/web` (Главный сайт + Админка)
- **Project Name:** `blackline-barbers-web`
- **Root Directory:** `apps/web`
- **Framework Preset:** `Next.js`
- **Build Command:** `next build`
- **Environment Variables:**
  - `NEXT_PUBLIC_API_URL`: URL задеплоенного API (например `https://blackline-barbers-api.vercel.app`)

### Проект 2: `apps/miniapp` (Telegram Mini App)   
- **Project Name:** `blackline-barbers-miniapp`
- **Root Directory:** `apps/miniapp`
- **Framework Preset:** `Vite`
- **Build Command:** `vite build`
- **Output Directory:** `dist`
- **Environment Variables:**
  - `VITE_API_URL`: URL задеплоенного API (например `https://blackline-barbers-api.vercel.app`)

### Проект 3: `apps/api` (Fastify REST API & Webhook)
- **Project Name:** `blackline-barbers-api`
- **Root Directory:** `apps/api`
- **Framework Preset:** `Other`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:**
  - `DATABASE_URL`: `postgresql://postgres.[id]:[pass]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
  - `DIRECT_URL`: `postgresql://postgres.[id]:[pass]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`
  - `SUPABASE_URL`: `https://[id].supabase.co`
  - `SUPABASE_SERVICE_ROLE_KEY`: `sb_publishable_...`
  - `TELEGRAM_BOT_TOKEN`: токен бота из @BotFather
  - `NODE_ENV`: `production`
  - `API_URL`: `https://blackline-barbers-api.vercel.app`
  - `ALLOWED_ORIGINS`: `https://blackline-barbers-web.vercel.app,https://blackline-barbers-miniapp.vercel.app`
  - `CRON_SECRET`: `blackline_cron_secret`

---

## 3. Настройка Telegram Webhook

В production Telegram бот работает через Webhook вместо Long-polling.

1. Чтобы автоматически зарегистрировать вебхук, отправьте POST-запрос:
   ```bash
   curl -X POST https://blackline-barbers-api.vercel.app/api/v1/telegram/webhook/set \
     -H "Content-Type: application/json" \
     -d '{"url": "https://blackline-barbers-api.vercel.app/api/v1/telegram/webhook"}'
   ```
2. Проверить статус вебхука:
   ```bash
   curl https://blackline-barbers-api.vercel.app/api/v1/telegram/webhook/info
   ```

---

## 4. Настройка Mini App в @BotFather

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram.
2. Отправьте команду `/mybots` и выберите вашего бота.
3. Перейдите в **Bot Settings** -> **Menu Button** -> **Configure menu button**.
4. Укажите URL: `https://blackline-barbers-miniapp.vercel.app` и текст `Записаться`.
5. (Опционально) Создайте Web App шорткат: `/newapp` -> выберите бота -> укажите название и URL `https://blackline-barbers-miniapp.vercel.app`.

---

## 5. Деплой Supabase Edge Function и Cron

В репозитории подготовлена Edge Function в каталоге `supabase/functions/notifications`.

1. Установите Supabase CLI (если требуется):
   ```bash
   npx supabase login
   npx supabase link --project-ref qmggrgqeoxlvvgidcatf
   ```
2. Задеплойте функцию:
   ```bash
   npx supabase functions deploy notifications --no-verify-jwt
   ```
3. Задайте переменные окружения для функции в Supabase Dashboard:
   - `API_URL`: `https://blackline-barbers-api.vercel.app`
   - `CRON_SECRET`: `blackline_cron_secret`
4. Настройте `pg_cron` в SQL Editor Supabase:
   ```sql
   select cron.schedule(
     'check-notifications-every-5-min',
     '*/5 * * * *',
     $$
     select net.http_post(
       url := 'https://qmggrgqeoxlvvgidcatf.supabase.co/functions/v1/notifications',
       headers := '{"Content-Type": "application/json", "Authorization": "Bearer blackline_cron_secret"}'::jsonb
     ) as request_id;
     $$
   );
   ```

---

## 6. Финальный E2E Чек-лист

- [x] Web: главная страница загружается, анимации и стили работают.
- [x] Web: форма бронирования `/book` отправляет заявку и генерирует персональный токен.
- [x] Web: страница управления `/booking/[token]` отображает статус и позволяет отменить запись.
- [x] Web: админка `/admin` доступна, защищена httpOnly cookies, отображает аналитику и календарь.
- [x] Mini App: открывается в Telegram и в браузере, синхронизирована с API.
- [x] Bot: отвечает на `/start`, присылает карточки броней при создании и отмене.
- [x] Edge Function & Cron: вызывают эндпоинт отправки напоминаний за 24 часа и 30 минут.
- [x] CORS: разрешает только production домены сайта и Mini App.
