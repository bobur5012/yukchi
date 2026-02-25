# Инструкция по загрузке изменений

## 1. Фронтенд → Git

Изменения фронтенда заливаются в Git. Netlify (или другой хостинг) подтягивает билд из репозитория.

```powershell
cd C:\Users\Bobur\Desktop\Yukchi
git add .
git commit -m "описание изменений"
git push origin main
```

После push Netlify автоматически соберёт и задеплоит фронтенд.

---

## 2. Бэкенд (API) → Railway (прямой деплой)

```powershell
cd C:\Users\Bobur\Desktop\Yukchi\yukchi-backend\api
railway link
# Выбрать: workspace → project (yukchi) → environment (production) → service (api)
railway up
```

`railway up` загружает код напрямую в Railway без git push.

---

## 3. Воркер → Railway (прямой деплой)

```powershell
cd C:\Users\Bobur\Desktop\Yukchi\yukchi-backend\worker
railway link
# Выбрать: workspace → project (yukchi) → environment (production) → service (worker)
railway up
```

---

## Миграции БД (после изменений в schema.prisma)

Если меняли Prisma-схему, нужно применить миграции:

```powershell
cd C:\Users\Bobur\Desktop\Yukchi\yukchi-backend\api
# Подставить публичный DATABASE_URL из Railway
$env:DATABASE_URL = "postgresql://postgres:PASSWORD@HOST.railway.app:PORT/railway"
npx prisma migrate deploy
```

---

## Краткая шпаргалка

| Компонент | Действие | Команда |
|-----------|----------|---------|
| Фронтенд | Git push | `git push origin main` |
| API | Railway | `cd api && railway up` |
| Worker | Railway | `cd worker && railway up` |
