# 🍎 NIS Kitap 2.0 — Школьная онлайн-библиотека в стиле Apple

[![Vue 3](https://img.shields.io/badge/Vue-3.5+-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0+-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Apple Design](https://img.shields.io/badge/Design-Apple%20Glassmorphism-0071E3?style=for-the-badge&logo=apple&logoColor=white)](https://developer.apple.com/design/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](https://opensource.org/licenses/ISC)

> **NIS Kitap** — это ультрасовременная цифровая библиотека для учащихся и преподавателей Назарбаев Интеллектуальной Школы. Веб-приложение полностью переработано в эстетике **Apple Design Language** (Glassmorphism, плавные микроанимации, мягкие многослойные тени и премиальная типографика).

---

## ✨ Ключевые особенности и нововведения

### 🎨 Apple Design Language (UI/UX)
- **Glassmorphism & Frosted Glass**: многослойные полупрозрачные поверхности с размытием заднего плана (`backdrop-filter: blur(24px) saturate(190%)`) и тонкими светящимися границами.
- **Премиальная палитра**: сохранение фирменного глубокого синего цвета школы NIS (`#003060`) в гармонии с космической ночной палитрой Apple Dark Midnight (`#060B14`, `#0E1626`), акцентными градиентами (`#0071E3`, `#38BDF8`, `#818CF8`) и теплыми кремовыми тонами (`#F6EEE1`).
- **Шрифтовая иерархия**: гармоничное сочетание шрифтов **Gilroy** и Apple System Font (`-apple-system, "SF Pro Display", "SF Pro Text"`).
- **Микроанимации и тактильный отклик**: пружинные переходы (`cubic-bezier(0.16, 1, 0.3, 1)`), динамический подъем карточек при наведении, масштабирование кнопок при нажатии, скелетоны загрузки.

### 🧠 Умный поиск с ИИ
- Семантический поиск по сюжету, эмоциям и ключевым словам («Антиутопия», «Космические путешествия», «Психология», «Тарих»).
- Поддержка подключения к OpenAI API на бэкенде с автоматическим интеллектуальным клиентским fallback-движком (работает даже без сервера!).

### 📚 Автономность и база данных
- **2 097 оцифрованных книг**: полная база данных школьной библиотеки встроена в `public/data/books.json` и автоматически доступна в статическом деплое.
- **Гибридный сервис данных (`src/services/bookService.js`)**: обращается к MongoDB API, если бэкенд запущен, или мгновенно переключается на встроенный JSON-бандл.
- **Онлайн-бронирование**: интерактивный выбор срока бронирования (7, 14, 21 день) с сохранением в `localStorage`, таймером срока сдачи и управлением в личном кабинете.

### 🌐 Триязычная коллекция
- Отдельные специализированные разделы для литературы на **казахском (Қазақ тілі)**, **русском** и **английском (English)** языках.
- 7 жанровых отделений: Фантастика, Фэнтези, Детектив, Приключения, Биография, Романтика, Поэзия.

### 📱 100% Адаптивность
- Идеальное отображение на смартфонах (iPhone), планшетах (iPad) и десктопах (MacBook / ПК).
- Мобильное шторка-меню в стиле iOS Control Center с эффектом размытия.

---

## 🛠 Технологический стек

- **Фронтенд**: Vue 3 (Composition API & Options API), Vue Router 4 (Lazy loading & code splitting), Vite 7
- **Стилизация**: Модульный CSS3 с дизайн-токенами Apple, Glassmorphism utilities, Gilroy Fonts
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
│   │   └── main.css        # Дизайн-система Apple, CSS-переменные, Glassmorphism
│   ├── components/
│   │   ├── AppleNavbar.vue      # Плавающий стеклянный навбар с мобильным меню
│   │   ├── AppleFooter.vue      # Лаконичный Apple-подвал со ссылками
│   │   ├── BookCard.vue         # Интерактивная карточка книги
│   │   ├── GenreBookView.vue    # Шаблон для страниц жанров
│   │   ├── LanguageBookView.vue # Шаблон для страниц языков
│   │   ├── FilterModal.vue      # Модальное окно фильтров (Apple Sheet)
│   │   ├── Register.vue         # Apple ID модалка авторизации / входа
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
