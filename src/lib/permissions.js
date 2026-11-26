// Single permission matrix for NIS Kitap.
// Used by the server API (api/_lib/auth.js), by the UI (src/lib/roles.js) to decide
// what to show, by the unit tests and by scripts/build-firestore-rules.mjs.
// To change who may do what, edit this file only: the API, the UI and the
// Firestore rules all follow it after `npm run rules:build` and a deploy.
//
// Roles:
//   student     — reader: own reading list, reservations, reviews, points
//   librarian   — fund, reservations, issue/return, reading confirmation,
//                 pickup e-mails, review moderation, point corrections, rewards
//   deputy      — завуч: reports and statistics, approves rewards
//   director    — reports and statistics, approves rewards, audit log
//   tech_admin  — technical settings, point rules, classes ↔ shanyraks, roles
// Nobody can confirm, reward or correct points for their own account.

export const ROLES = ['student', 'librarian', 'deputy', 'director', 'tech_admin'];

export const STAFF_ROLES = ['librarian', 'deputy', 'director', 'tech_admin'];

// Roles a tech admin may assign in the app (roles/{email}). tech_admin itself is
// granted only through config/access.json, i.e. through a reviewed code change.
export const ASSIGNABLE_ROLES = ['student', 'librarian', 'deputy', 'director'];

export const PERMISSIONS = {
  // library desk
  'fund.manage': ['librarian'],
  'loans.manage': ['librarian'],
  'notifications.send': ['librarian'],
  'reading.verify': ['librarian'],
  'reviews.moderate': ['librarian'],
  'points.adjust': ['librarian'],
  // rewards
  'rewards.manage': ['librarian', 'deputy', 'director'],
  'rewards.issue': ['librarian'],
  'rewards.approve': ['deputy', 'director'],
  // people and reports
  'students.view': ['librarian', 'deputy', 'director', 'tech_admin'],
  'points.view_all': ['librarian', 'deputy', 'director', 'tech_admin'],
  'reports.view': ['librarian', 'deputy', 'director'],
  'audit.view': ['deputy', 'director', 'tech_admin'],
  // configuration
  'students.class_change': ['tech_admin'],
  'classes.manage': ['tech_admin'],
  'settings.manage': ['tech_admin'],
  'roles.manage': ['tech_admin'],
};

// Human-readable description of the matrix (shown on the admin settings page).
export const PERMISSION_LABELS = {
  'fund.manage': 'Корректировка фонда (число экземпляров)',
  'loans.manage': 'Брони: подготовка, выдача, возврат, отмена',
  'notifications.send': 'Письма ученикам о получении книги',
  'reading.verify': 'Подтверждение прочтения и начисление очков',
  'reviews.moderate': 'Модерация отзывов',
  'points.adjust': 'Ручная корректировка и отмена операций с очками',
  'rewards.manage': 'Каталог поощрений',
  'rewards.issue': 'Выдача наград',
  'rewards.approve': 'Утверждение наград, требующих подписи директора',
  'students.view': 'Список учеников, классы и шаңыраки',
  'points.view_all': 'Журнал очков всех учеников',
  'reports.view': 'Статистика и отчёты',
  'audit.view': 'Журнал действий сотрудников',
  'students.class_change': 'Перевод ученика в другой класс',
  'classes.manage': 'Соответствие «учебный год → класс → шаңырак»',
  'settings.manage': 'Правила начисления очков и настройки школы',
  'roles.manage': 'Назначение ролей сотрудникам',
};
