# NIS Kitap — цифровая библиотека школы

Каталог школьной библиотеки NIS: поиск книг (в том числе по описанию с помощью ИИ), бронирование экземпляров с удержанием и письмом о получении, проект «100 кітап» с подтверждением прочтения библиотекарем, очки и рейтинг шаңыраков, поощрения и отзывы. Светлая и тёмная темы, три языка интерфейса.

- Роли, права, процессы, переменные окружения, миграция: [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md)
- Сервер: `api/v2` (Vercel Functions + Firebase Admin SDK). Браузер только читает Firestore; изменения — через API.
- Тесты: `npm test` и `npm run test:emulator` (сценарии на эмуляторах Firebase).

## 🛠 Технологический стек

- **Фронтенд**: Vue 3 (Composition API & Options API), Vue Router 4 (Lazy loading & code splitting), Vite 7
- **Стилизация**: CSS-токены светлой и тёмной темы (src/assets/main.css), шрифты Inter и Literata
- **Аутентификация**: Firebase Auth + Firestore + локальный сессионный fallback
- **Бэкенд (опционально)**: Node.js, Express 5, Mongoose / MongoDB, OpenAI API
- **Деплой**: Vercel (`vercel.json`), GitHub Pages (`.github/workflows/deploy.yml`)

---

## 🚀 Быстрый старт (Локальная разработка)

### 1. Клонирование и установка зависимостей
```bash
git clone https://github.com/janbolat2009/NIS-Kitap.git
cd NIS-Kitap/NIS
npm install
```

### 2. Запуск локального сервера разработки
```bash
npm run dev
```
Приложение откроется по адресу: **http://localhost:5173**

> 💡 **Примечание**: Приложение полностью работоспособно сразу после запуска `npm run dev` благодаря встроенному сервису `bookService` и базе книг `books.json`. Запуск сервера MongoDB не является обязательным!

### 3. Сборка для продакшена
```bash
npm run build
```
Готовая оптимизированная сборка будет скомпилирована в директорию `dist/`.

---

## 🌐 Инструкция по деплою

### Вариант 1: Деплой на Vercel (Рекомендуется)
Проект полностью настроен для деплоя на Vercel:
1. Зарегистрируйтесь или войдите на [Vercel](https://vercel.com).
2. Нажмите **"Add New Project"** и импортируйте репозиторий `NIS-Kitap`.
3. В параметрах сборки:
   - **Root Directory**: `NIS`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Нажмите **Deploy**. Конфигурация `vercel.json` автоматически настроит роутинг для Vue Router.

---

### Вариант 2: Деплой на GitHub Pages (Автоматический через GitHub Actions)
В репозитории уже настроен готовый GitHub Actions Workflow:
1. Перейдите в ваш репозиторий на GitHub: **Settings -> Pages**.
2. В разделе **Build and deployment -> Source** выберите **GitHub Actions**.
3. Сделайте `git push` в ветку `master` или `main`.
4. Вкладка **Actions** автоматически соберет и опубликует сайт по адресу:
   `https://<ваш-username>.github.io/NIS-Kitap/`

---

## 📁 Структура проекта

```
NIS/
├── .github/workflows/
│   └── deploy.yml          # Автодеплой на GitHub Pages
├── public/
│   ├── data/books.json     # Автономная база 2097 книг
│   └── 404.html            # SPA fallback для GitHub Pages
├── src/
│   ├── assets/
│   │   ├── fonts/          # Шрифты Gilroy (Thin, Regular, Bold и др.)
│   │   └── main.css        # дизайн-токены тем
│   ├── components/
│   │   ├── SiteHeader.vue       # шапка сайта, тема, язык
│   │   ├── SiteFooter.vue       # подвал
│   │   ├── BookCard.vue         # Интерактивная карточка книги
│   │   ├── GenreBookView.vue    # Шаблон для страниц жанров
│   │   ├── LanguageBookView.vue # Шаблон для страниц языков
│   │   ├── FilterModal.vue      # Модальное окно фильтров 
│   │   ├── Register.vue         # окно входа
│   │   ├── Profile.vue          # Личный кабинет читателя и активные брони
│   │   └── SearchResults.vue    # Результаты умного поиска ИИ
│   ├── pages/
│   │   ├── Catalog.vue          # Каталог с живым поиском и пагинацией
│   │   ├── BookDetail.vue       # Страница книги со спецификациями и бронью
│   │   ├── about-us.vue         # О библиотеке и школьных ценностях
│   │   ├── genres/*.vue         # 7 страниц жанров
│   │   └── languages/*.vue      # 3 страницы языковых отделов
│   ├── services/
│   │   └── bookService.js       # Отказоустойчивый сервис данных и бронирования
│   ├── router/index.js          # Vue Router с ленивой загрузкой
│   ├── firebase.js              # Конфигурация Firebase
│   ├── main.js                  # Точка входа Vue 3
│   └── Root.vue                 # Корневой контейнер
├── vercel.json                  # Конфигурация для деплоя на Vercel
├── vite.config.js               # Конфигурация сборщика Vite
└── package.json
```

---

## 👨‍💻 Авторы
Создано учениками Назарбаев Интеллектуальной Школы для школьного сообщества NIS.
- **Разработчик**: [janbolat2009](https://github.com/janbolat2009)
- **Контакт**: janbolatique.kz@gmail.com
