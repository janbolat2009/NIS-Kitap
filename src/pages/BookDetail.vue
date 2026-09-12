<template>
  <div class="apple-book-detail-page">
    <!-- Navbar -->
    <AppleNavbar 
      :is-logged-in="isLoggedIn"
      :user-name="userName"
      :user-avatar="userAvatar"
      @open-register="showRegister = true"
      @open-profile="showProfile = true"
    />

    <main class="detail-main">
      <div class="detail-container">
        <!-- Breadcrumbs & Back -->
        <div class="detail-top-nav">
          <button class="back-link-btn" @click="$router.push('/catalog')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span>Назад в каталог</span>
          </button>
          <div class="breadcrumbs">
            <router-link to="/">Главная</router-link>
            <span>/</span>
            <router-link to="/catalog">Каталог</router-link>
            <span>/</span>
            <span class="curr-crumb">{{ book?.title || 'Книга' }}</span>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="detail-loading glass-panel">
          <div class="loading-spinner"></div>
          <p>Загрузка данных книги...</p>
        </div>

        <!-- Book Not Found -->
        <div v-else-if="!book" class="detail-not-found glass-panel">
          <div class="not-found-icon">📕</div>
          <h2>Книга не найдена</h2>
          <p>Книга «{{ decodedTitle }}» не обнаружена в базе библиотеки.</p>
          <button class="apple-btn-primary" @click="$router.push('/catalog')">
            Вернуться в каталог
          </button>
        </div>

        <!-- Product Showcase Layout -->
        <div v-else class="book-showcase-grid">
          <!-- Left Col: Book Cover & Artwork -->
          <div class="showcase-cover-side">
            <div class="cover-art-container" :style="coverGradientStyle">
              <div class="spine-line"></div>
              <div class="cover-inner">
                <div class="cover-badge">NIS LIBRARY</div>
                <h2 class="cover-art-title">{{ book.title }}</h2>
                <p class="cover-art-author">{{ book.author }}</p>
                <div class="cover-art-footer">
                  <span>{{ book.language }}</span>
                  <span>{{ book.year }}</span>
                </div>
              </div>
            </div>

            <!-- Status card under cover -->
            <div class="availability-status-card glass-panel">
              <div class="status-left">
                <span class="status-circle" :class="book.copies > 0 ? 'available' : 'busy'"></span>
                <div>
                  <strong v-if="book.copies > 0">Доступно для выдачи</strong>
                  <strong v-else>Все копии на руках</strong>
                  <p>{{ book.copies > 0 ? `${book.copies} экз. в хранилище` : 'Ожидается возврат читателями' }}</p>
                </div>
              </div>
              <span class="copies-badge">{{ book.copies }} шт</span>
            </div>
          </div>

          <!-- Right Col: Information & Actions -->
          <div class="showcase-info-side">
            <!-- Genre Pills -->
            <div class="genre-tag-row">
              <span v-for="g in genresList" :key="g" class="genre-tag">
                {{ g }}
              </span>
              <span class="language-tag">{{ book.language || 'Русский' }}</span>
            </div>

            <h1 class="book-main-title">{{ book.title }}</h1>

            <div class="author-row">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span class="author-name">{{ book.author }}</span>
            </div>

            <!-- Specifications Tiles Grid -->
            <div class="specs-grid">
              <div class="spec-tile glass-card">
                <span class="spec-label">Год издания</span>
                <strong class="spec-value">{{ book.year || '—' }}</strong>
              </div>
              <div class="spec-tile glass-card">
                <span class="spec-label">Язык</span>
                <strong class="spec-value">{{ book.language || 'Русский' }}</strong>
              </div>
              <div class="spec-tile glass-card">
                <span class="spec-label">Доступность</span>
                <strong class="spec-value" :class="book.copies > 0 ? 'green' : 'red'">
                  {{ book.copies > 0 ? `${book.copies} шт.` : 'Занята' }}
                </strong>
              </div>
              <div class="spec-tile glass-card">
                <span class="spec-label">Библиотека</span>
                <strong class="spec-value">NIS Digital</strong>
              </div>
            </div>

            <!-- Description -->
            <div class="book-description-section glass-panel">
              <h3 class="desc-heading">Аннотация книги</h3>
              <p class="desc-text">
                {{ book.description || 'Описание для этой книги временно отсутствует в каталоге библиотеки.' }}
              </p>
            </div>

            <!-- Action Buttons Row -->
            <div class="action-buttons-row">
              <button 
                v-if="!isReserved" 
                class="apple-btn-primary reserve-cta-btn" 
                :disabled="book.copies <= 0"
                @click="openReservationModal"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>{{ book.copies > 0 ? 'Забронировать книгу' : 'Нет доступных копий' }}</span>
              </button>

              <button v-else class="reserved-success-btn" @click="$emit('open-profile')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Книга забронирована вами</span>
              </button>

              <button class="apple-btn-secondary fav-btn" :class="{ active: isFavorite }" @click="toggleFavorite">
                <svg width="18" height="18" viewBox="0 0 24 24" :fill="isFavorite ? '#EF4444' : 'none'" :stroke="isFavorite ? '#EF4444' : 'currentColor'" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span>{{ isFavorite ? 'В избранном' : 'В закладки' }}</span>
              </button>

              <button class="apple-btn-secondary share-btn" @click="shareBook" title="Поделиться">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </button>
            </div>

            <!-- Toast alert -->
            <div v-if="toastMessage" class="detail-toast">
              <span>{{ toastMessage }}</span>
            </div>
          </div>
        </div>

        <!-- Related Books Section -->
        <div v-if="relatedBooks.length" class="related-section">
          <h2 class="section-title">Похожие книги из этой серии</h2>
          <div class="related-grid">
            <BookCard 
              v-for="rel in relatedBooks" 
              :key="rel._id" 
              :book="rel" 
              @select="onSelectRelated"
            />
          </div>
        </div>
      </div>
    </main>

    <!-- Reservation Sheet Modal -->
    <div v-if="showReservationModal" class="apple-modal-overlay" @click="showReservationModal = false">
      <div class="reservation-modal-box glass-panel" @click.stop>
        <div class="modal-handle"></div>
        <div class="res-modal-header">
          <h3>Бронирование школьной книги</h3>
          <button class="sheet-close-btn" @click="showReservationModal = false">✕</button>
        </div>

        <div class="res-modal-body">
          <div class="book-mini-summary">
            <div class="mini-spine"></div>
            <div>
              <h4>{{ book.title }}</h4>
              <p>{{ book.author }}</p>
            </div>
          </div>

          <div class="duration-select-group">
            <label class="duration-label">Срок бронирования:</label>
            <div class="duration-pills">
              <button 
                v-for="days in [7, 14, 21]" 
                :key="days"
                class="duration-pill"
                :class="{ active: reservationDays === days }"
                @click="reservationDays = days"
              >
                {{ days }} дней
              </button>
            </div>
            <p class="due-hint">
              Дата возврата: <b>{{ calculatedDueDate }}</b>
            </p>
          </div>

          <div class="nis-rules-notice">
            <span class="notice-icon">ℹ️</span>
            <span>По правилам библиотеки NIS, книгу можно забрать в библиотечном кабинете в течение 2 дней после онлайн-брони.</span>
          </div>
        </div>

        <div class="res-modal-footer">
          <button class="btn-cancel" @click="showReservationModal = false">Отмена</button>
          <button class="btn-confirm-reserve" @click="confirmReservation">
            Подтвердить бронь
          </button>
        </div>
      </div>
    </div>

    <!-- Register Modal -->
    <div v-if="showRegister" class="apple-modal-overlay" @click="showRegister = false">
      <div class="modal-wrapper" @click.stop>
        <button class="modal-close-icon" @click="showRegister = false">✕</button>
        <Register @registered="onRegistered" @loggedIn="onLoggedIn" />
      </div>
    </div>

    <!-- Profile Modal -->
    <div v-if="showProfile" class="apple-modal-overlay" @click="showProfile = false">
      <div class="modal-wrapper" @click.stop>
        <Profile 
          :email="userEmail" 
          :name="userName" 
          @back="showProfile = false" 
          @updated="onProfileUpdated"
          @loggedOut="onLoggedOut"
        />
      </div>
    </div>

    <!-- Footer -->
    <AppleFooter />
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppleNavbar from '@/components/AppleNavbar.vue';
import AppleFooter from '@/components/AppleFooter.vue';
import BookCard from '@/components/BookCard.vue';
import Register from '@/components/Register.vue';
import Profile from '@/components/Profile.vue';
import { getBookByTitle, getBooks, reserveBook, isBookReserved } from '@/services/bookService';

export default {
  name: 'BookDetail',
  components: {
    AppleNavbar,
    AppleFooter,
    BookCard,
    Register,
    Profile,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();

    const book = ref(null);
    const loading = ref(true);
    const relatedBooks = ref([]);

    const isLoggedIn = ref(false);
    const userEmail = ref('');
    const userName = ref('');
    const userAvatar = ref('');

    const showRegister = ref(false);
    const showProfile = ref(false);
    const showReservationModal = ref(false);
    const reservationDays = ref(14);
    const isReserved = ref(false);
    const isFavorite = ref(false);
    const toastMessage = ref('');

    const decodedTitle = computed(() => {
      return decodeURIComponent(route.params.title || '');
    });

    const genresList = computed(() => {
      if (!book.value) return [];
      if (Array.isArray(book.value.genre)) return book.value.genre;
      if (typeof book.value.genre === 'string') return [book.value.genre];
      return ['Книга'];
    });

    const coverGradientStyle = computed(() => {
      const title = book.value?.title || 'Book';
      const gradients = [
        'linear-gradient(145deg, #1e3c72 0%, #2a5298 100%)',
        'linear-gradient(145deg, #09203f 0%, #537895 100%)',
        'linear-gradient(145deg, #141e30 0%, #243b55 100%)',
        'linear-gradient(145deg, #134e5e 0%, #71b280 100%)',
        'linear-gradient(145deg, #2c3e50 0%, #3498db 100%)',
      ];
      let hash = 0;
      for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
      return { background: gradients[Math.abs(hash) % gradients.length] };
    });

    const calculatedDueDate = computed(() => {
      const d = new Date(Date.now() + reservationDays.value * 24 * 60 * 60 * 1000);
      return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    });

    const loadBookData = async () => {
      loading.value = true;
      try {
        const found = await getBookByTitle(decodedTitle.value);
        book.value = found;
        if (found) {
          isReserved.value = isBookReserved(found.title);
          // Похожие книги
          const all = await getBooks();
          const targetGenre = Array.isArray(found.genre) ? found.genre[0] : found.genre;
          relatedBooks.value = all
            .filter((b) => b.title !== found.title && (b.genre.includes(targetGenre) || b.author === found.author))
            .slice(0, 4);
        }
      } catch (err) {
        console.error('Ошибка загрузки книги:', err);
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      const local = localStorage.getItem('user');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          isLoggedIn.value = true;
          userEmail.value = parsed.email || '';
          userName.value = parsed.name || '';
          userAvatar.value = parsed.avatar || '';
        } catch {}
      }
      loadBookData();
    });

    watch(() => route.params.title, () => {
      loadBookData();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const openReservationModal = () => {
      showReservationModal.value = true;
    };

    const confirmReservation = () => {
      const due = new Date(Date.now() + reservationDays.value * 24 * 60 * 60 * 1000).toISOString();
      const res = reserveBook(book.value, due);
      showReservationModal.value = false;
      if (res.success) {
        isReserved.value = true;
        showToast('Книга успешно забронирована! Проверьте профиль.', 'success');
      } else {
        showToast(res.message, 'warn');
      }
    };

    const toggleFavorite = () => {
      isFavorite.value = !isFavorite.value;
      showToast(isFavorite.value ? 'Добавлено в закладки!' : 'Удалено из закладок');
    };

    const shareBook = () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        showToast('Ссылка на книгу скопирована в буфер обмена!');
      }
    };

    const showToast = (msg) => {
      toastMessage.value = msg;
      setTimeout(() => {
        toastMessage.value = '';
      }, 3500);
    };

    const onSelectRelated = (relBook) => {
      router.push(`/book/${encodeURIComponent(relBook.title)}`);
    };

    const onRegistered = (payload) => {
      userEmail.value = payload.email;
      userName.value = payload.name;
      isLoggedIn.value = true;
      showRegister.value = false;
      showProfile.value = true;
      localStorage.setItem('user', JSON.stringify({ email: payload.email, name: payload.name, avatar: '' }));
      localStorage.setItem('isLoggedIn', 'true');
    };

    const onLoggedIn = (payload) => {
      userEmail.value = payload.email;
      userName.value = payload.name;
      isLoggedIn.value = true;
      showRegister.value = false;
      localStorage.setItem('user', JSON.stringify({ email: payload.email, name: payload.name, avatar: '' }));
      localStorage.setItem('isLoggedIn', 'true');
    };

    const onProfileUpdated = (data) => {
      if (data.name) userName.value = data.name;
      if (data.avatar) userAvatar.value = data.avatar;
    };

    const onLoggedOut = () => {
      isLoggedIn.value = false;
      userEmail.value = '';
      userName.value = '';
      userAvatar.value = '';
    };

    return {
      book,
      loading,
      relatedBooks,
      decodedTitle,
      genresList,
      coverGradientStyle,
      calculatedDueDate,
      isLoggedIn,
      userEmail,
      userName,
      userAvatar,
      showRegister,
      showProfile,
      showReservationModal,
      reservationDays,
      isReserved,
      isFavorite,
      toastMessage,
      openReservationModal,
      confirmReservation,
      toggleFavorite,
      shareBook,
      onSelectRelated,
      onRegistered,
      onLoggedIn,
      onProfileUpdated,
      onLoggedOut,
    };
  },
};
</script>

<style scoped>
.apple-book-detail-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.detail-main {
  flex: 1;
  padding: 100px 0 80px;
}

.detail-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Top Nav */
.detail-top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.back-link-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #FFFFFF;
  padding: 8px 16px;
  border-radius: 9999px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.back-link-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(-3px);
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}
.breadcrumbs a {
  color: #38BDF8;
  text-decoration: none;
}
.curr-crumb {
  color: rgba(255, 255, 255, 0.85);
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Showcase Grid */
.book-showcase-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 50px;
  margin-bottom: 70px;
}

/* Left Col: Cover */
.showcase-cover-side {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cover-art-container {
  width: 100%;
  height: 480px;
  border-radius: 24px;
  position: relative;
  box-shadow: 
    -10px 15px 35px rgba(0, 0, 0, 0.6),
    0 0 35px rgba(0, 113, 227, 0.25);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 32px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.spine-line {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 12px;
  background: linear-gradient(to right, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0.4));
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.4);
}

.cover-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
}

.cover-badge {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: rgba(255, 255, 255, 0.7);
}

.cover-art-title {
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: 800;
  line-height: 1.25;
  color: #FFFFFF;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
}

.cover-art-author {
  margin: 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.cover-art-footer {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}

.availability-status-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-radius: 18px;
}
.status-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.status-circle {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.status-circle.available {
  background: #10B981;
  box-shadow: 0 0 10px #10B981;
}
.status-circle.busy {
  background: #EF4444;
}
.status-left strong {
  display: block;
  font-size: 14px;
  color: #FFFFFF;
}
.status-left p {
  margin: 2px 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
}
.copies-badge {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  color: #38BDF8;
}

/* Right Col: Info */
.showcase-info-side {
  display: flex;
  flex-direction: column;
}

.genre-tag-row {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.genre-tag {
  background: rgba(0, 113, 227, 0.16);
  border: 1px solid rgba(56, 189, 248, 0.35);
  color: #38BDF8;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 9999px;
}
.language-tag {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 9999px;
}

.book-main-title {
  font-size: 40px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 12px;
  color: #FFFFFF;
  line-height: 1.18;
}

.author-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #38BDF8;
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 28px;
}

/* Specs Grid */
.specs-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 28px;
}

.spec-tile {
  padding: 14px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.spec-label {
  font-size: 11.5px;
  color: rgba(255, 255, 255, 0.5);
}
.spec-value {
  font-size: 15px;
  color: #FFFFFF;
}
.spec-value.green {
  color: #34D399;
}
.spec-value.red {
  color: #F87171;
}

/* Description */
.book-description-section {
  padding: 24px;
  border-radius: 20px;
  margin-bottom: 32px;
}
.desc-heading {
  margin: 0 0 10px;
  font-size: 17px;
  font-weight: 600;
  color: #FFFFFF;
}
.desc-text {
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.75);
}

/* Action Buttons */
.action-buttons-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.reserve-cta-btn {
  padding: 14px 28px;
  font-size: 15px;
}
.reserve-cta-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reserved-success-btn {
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid rgba(16, 185, 129, 0.45);
  color: #34D399;
  padding: 14px 24px;
  border-radius: 9999px;
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.fav-btn.active {
  color: #FCA5A5;
  border-color: rgba(239, 68, 68, 0.4);
}

.share-btn {
  padding: 12px 14px;
}

/* Toast */
.detail-toast {
  margin-top: 16px;
  padding: 10px 16px;
  border-radius: 12px;
  background: rgba(0, 113, 227, 0.2);
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #FFFFFF;
  font-size: 13.5px;
  width: fit-content;
}

/* Related */
.related-section {
  margin-top: 60px;
}
.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

/* Reservation Modal */
.reservation-modal-box {
  width: 100%;
  max-width: 460px;
  border-radius: 24px;
  padding: 24px;
}
.modal-handle {
  width: 36px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
  margin: 0 auto 16px;
}
.res-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.res-modal-header h3 {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
}
.sheet-close-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.7);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
}

.book-mini-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  padding: 12px 16px;
  margin-bottom: 20px;
}
.mini-spine {
  width: 4px;
  height: 36px;
  border-radius: 2px;
  background: #38BDF8;
}
.book-mini-summary h4 {
  margin: 0 0 2px;
  font-size: 14.5px;
}
.book-mini-summary p {
  margin: 0;
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.6);
}

.duration-select-group {
  margin-bottom: 20px;
}
.duration-label {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
  display: block;
}
.duration-pills {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.duration-pill {
  flex: 1;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.8);
  padding: 10px;
  border-radius: 12px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.duration-pill.active {
  background: #0071E3;
  color: #FFFFFF;
  border-color: rgba(56, 189, 248, 0.5);
}
.due-hint {
  font-size: 13px;
  color: #38BDF8;
  margin: 0;
}

.nis-rules-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: rgba(0, 113, 227, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 12px;
  padding: 12px;
  font-size: 12.5px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 24px;
}

.res-modal-footer {
  display: flex;
  gap: 10px;
}
.btn-cancel {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #FFFFFF;
  padding: 12px;
  border-radius: 12px;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
}
.btn-confirm-reserve {
  flex: 1.6;
  background: linear-gradient(135deg, #0071E3 0%, #0056B3 100%);
  color: #FFFFFF;
  border: none;
  padding: 12px;
  border-radius: 12px;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
}

/* Modals */
.apple-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal-wrapper {
  position: relative;
  max-width: 100%;
}
.modal-close-icon {
  position: absolute;
  top: 14px;
  right: 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.7);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  z-index: 10;
}

@media (max-width: 900px) {
  .book-showcase-grid {
    grid-template-columns: 1fr;
  }
  .cover-art-container {
    height: 380px;
    max-width: 320px;
    margin: 0 auto;
  }
  .specs-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>