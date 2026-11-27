// Client for the server API (/api/v2). Every call carries the Firebase ID token;
// the server checks the token, the verified e-mail and the role itself.
import { auth } from '@/firebase';

export class ApiError extends Error {
  constructor(status, code, data = {}) {
    super(code);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

async function token(force = false) {
  const user = auth.currentUser;
  return user ? user.getIdToken(force) : '';
}

export async function api(path, { method = 'GET', body, query, retryAuth = true } = {}) {
  const qs = query ? `?${new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== '')).toString()}` : '';
  const headers = { Accept: 'application/json' };
  const idToken = await token();
  if (idToken) headers.Authorization = `Bearer ${idToken}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(`/api/v2/${path}${qs}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, 'network_error');
  }
  let json = {};
  try {
    json = await res.json();
  } catch {
    json = {};
  }
  if (res.status === 401 && retryAuth && auth.currentUser) {
    // The token may have expired a moment ago, or the e-mail was just verified.
    await token(true);
    return api(path, { method, body, query, retryAuth: false });
  }
  if (!res.ok || json.ok === false) {
    const { error, ok: _ok, ...rest } = json || {}; // eslint-disable-line no-unused-vars
    throw new ApiError(res.status, error || `http_${res.status}`, rest);
  }
  return json.data;
}

export const get = (path, query) => api(path, { query });
export const post = (path, body = {}) => api(path, { method: 'POST', body });

// Readable messages for error codes the reader can act on.
const MESSAGES = {
  ru: {
    network_error: 'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.',
    auth_required: 'Войдите в аккаунт, чтобы продолжить.',
    email_not_verified: 'Подтвердите email по ссылке из письма и обновите страницу.',
    forbidden: 'Недостаточно прав для этого действия.',
    self_action_forbidden: 'Это действие нельзя выполнить для своего аккаунта.',
    rate_limited: 'Слишком много запросов. Попробуйте чуть позже.',
    server_not_configured: 'Сервис временно недоступен: сервер ещё не настроен.',
    busy_try_again: 'Сервер занят, попробуйте ещё раз.',
    no_copies: 'Свободных экземпляров сейчас нет.',
    already_reserved: 'У вас уже есть бронь этой книги.',
    too_many_reservations: 'Достигнут лимит активных броней.',
    unknown_book: 'Книга не найдена в каталоге.',
    locked: 'Книга ждёт проверки или уже подтверждена — статус изменить нельзя.',
    already_pending: 'Заявка уже отправлена библиотекарю.',
    already_confirmed: 'Прочтение уже подтверждено.',
    unknown_class: 'Такого класса нет в списке школы.',
    class_locked: 'Класс уже выбран. Для перевода обратитесь к администратору.',
    registration_closed: 'Выбор класса сейчас закрыт.',
    invalid_review: 'Отзыв не прошёл проверку.',
    criteria_not_met: 'Условия получения награды пока не выполнены.',
    already_decided: 'Решение уже принято.',
    bad_transition: 'Это действие недоступно для текущего статуса.',
    not_prepared: 'Сначала подготовьте бронь и укажите время получения.',
    already_sending: 'Письмо уже отправляется.',
    mail_not_configured: 'Отправка писем не настроена на сервере.',
    below_in_use: 'Нельзя сделать фонд меньше числа выданных и зарезервированных экземпляров.',
    pickup_in_past: 'Время получения уже прошло.',
    internal_error: 'Что-то пошло не так. Попробуйте ещё раз.',
    role_self: 'Нельзя менять роль своего аккаунта.',
    role_config: 'Этот сотрудник уже закреплён в config/access.json — доступ у него есть, добавлять не нужно.',
    role_other: 'Эту роль назначить нельзя.',
    bad_email: 'Проверьте адрес: он должен выглядеть как name@school.kz.',
    bad_value: 'Недопустимое значение поля.',
    missing_field: 'Заполните обязательное поле.',
    too_long: 'Значение слишком длинное.',
    too_short: 'Значение слишком короткое.',
    bad_id: 'Некорректный идентификатор.',
    invalid_json: 'Запрос повреждён. Обновите страницу и повторите.',
    payload_too_large: 'Слишком большой запрос.',
    invalid_token: 'Сессия устарела. Войдите заново.',
  },
  kz: {
    network_error: 'Сервермен байланыс жоқ. Интернетті тексеріп, қайталап көріңіз.',
    auth_required: 'Жалғастыру үшін аккаунтқа кіріңіз.',
    email_not_verified: 'Хаттағы сілтеме арқылы email-ды растап, бетті жаңартыңыз.',
    forbidden: 'Бұл әрекетке құқық жеткіліксіз.',
    rate_limited: 'Сұрау тым көп. Сәл кейінірек көріңіз.',
    no_copies: 'Қазір бос дана жоқ.',
    already_reserved: 'Бұл кітапқа брондауыңыз бар.',
    too_many_reservations: 'Белсенді брондау шегіне жеттіңіз.',
    locked: 'Кітап тексеруде немесе расталған — мәртебені өзгертуге болмайды.',
    unknown_class: 'Мұндай сынып мектеп тізімінде жоқ.',
    class_locked: 'Сынып таңдалған. Ауыстыру үшін әкімшіге жүгініңіз.',
    invalid_review: 'Пікір тексеруден өтпеді.',
    criteria_not_met: 'Марапат шарттары әлі орындалмаған.',
    internal_error: 'Бірдеңе дұрыс болмады. Қайталап көріңіз.',
    role_self: 'Өз аккаунтыңыздың рөлін өзгертуге болмайды.',
    role_config: 'Бұл қызметкер config/access.json ішінде бекітілген — қолжетімділігі бар, қосудың қажеті жоқ.',
    role_other: 'Бұл рөлді тағайындауға болмайды.',
    bad_email: 'Мекенжайды тексеріңіз: name@school.kz түрінде болуы керек.',
    bad_value: 'Өріс мәні жарамсыз.',
    missing_field: 'Міндетті өрісті толтырыңыз.',
    invalid_token: 'Сессия ескірді. Қайта кіріңіз.',
  },
  en: {
    network_error: 'No connection to the server. Check the internet and try again.',
    auth_required: 'Sign in to continue.',
    email_not_verified: 'Confirm your e-mail with the link we sent and reload the page.',
    forbidden: 'You do not have permission for this action.',
    rate_limited: 'Too many requests. Please try again later.',
    no_copies: 'No free copies right now.',
    already_reserved: 'You already have a reservation for this book.',
    too_many_reservations: 'You have reached the limit of active reservations.',
    locked: 'This book is awaiting review or already confirmed — the status cannot be changed.',
    unknown_class: 'This class is not on the school list.',
    class_locked: 'Your class is already set. Ask the administrator to change it.',
    invalid_review: 'The review did not pass the check.',
    criteria_not_met: 'The conditions for this reward are not met yet.',
    internal_error: 'Something went wrong. Please try again.',
    role_self: 'You cannot change the role of your own account.',
    role_config: 'This person is already fixed in config/access.json and has access, no need to add them.',
    role_other: 'This role cannot be assigned.',
    bad_email: 'Check the address: it should look like name@school.kz.',
    bad_value: 'This value is not allowed.',
    missing_field: 'Fill in the required field.',
    invalid_token: 'Your session expired. Sign in again.',
  },
};

export function errorMessage(err, locale = 'ru') {
  let code = err?.code || 'internal_error';
  // The server explains why a role was refused (self / fixed in config / other).
  if (code === 'cannot_assign_role') code = `role_${err?.data?.reason || 'other'}`;
  const dict = MESSAGES[locale] || MESSAGES.ru;
  const known = dict[code] || MESSAGES.ru[code];
  if (known) return known;
  // An unexpected code: say so instead of hiding it behind a generic phrase.
  const base = MESSAGES[locale]?.internal_error || MESSAGES.ru.internal_error;
  return code === 'internal_error' ? base : `${base} (${code})`;
}
