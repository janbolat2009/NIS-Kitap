// Single permission matrix. Used by the UI (src/lib/roles.js), by the unit tests
// and by scripts/build-firestore-rules.mjs, which turns it into rule functions.

export const ROLES = ['student', 'curator', 'teacher', 'librarian', 'director', 'project_admin', 'super_admin'];

export const STAFF_ROLES = ['librarian', 'director', 'project_admin', 'super_admin'];

export const PERMISSIONS = {
  'analytics.view': ['librarian', 'director', 'project_admin', 'super_admin'],
  'reading.verify': ['librarian', 'project_admin', 'super_admin'],
  'loans.manage': ['librarian', 'super_admin'],
  'points.adjust': ['project_admin', 'super_admin'],
  'points.settings': ['project_admin', 'super_admin'],
  'rewards.view': ['librarian', 'director', 'project_admin', 'super_admin', 'teacher'],
  'rewards.propose': ['librarian', 'director', 'project_admin', 'super_admin'],
  'rewards.approve': ['director', 'project_admin', 'super_admin'],
  'rewards.review_subject': ['teacher', 'director', 'project_admin', 'super_admin'],
  'rewards.issue': ['librarian', 'project_admin', 'super_admin'],
  'roster.manage': ['director', 'project_admin', 'super_admin'],
  'roles.manage': ['super_admin'],
  'audit.view': ['director', 'project_admin', 'super_admin'],
};
