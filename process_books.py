# -*- coding: utf-8 -*-
"""
process_books.py - NIS-Kitap Library Excel Ingestion Pipeline
============================================================
Reads library Excel catalogs, extracts book metadata, enriches records with
AI-generated 1-2 sentence descriptions and canonical genre classification,
detects duplicates via ISBN, prevents modification of existing MongoDB books,
and produces a validated JSON output.

Features:
1. Ingests all .xlsx files from data/excel/ (auto-detects server/data/excel/ as well).
2. Extracts: title, author, year, copies, language, and ISBN.
3. AI-powered description (1-2 sentences) and canonical genre assignment.
4. Strictly assigns 1 of 7 canonical genres:
   ['Приключения', 'Фантастика', 'Фэнтези', 'Детектив', 'Биография', 'Романтика', 'Поэзия']
5. Produces exact MongoDB JSON structure:
   title, author, description, genre, year, copies, language, cover_image, status, isbn.
6. Detects duplicates using ISBN when available (and title+author fallback).
7. NEVER modifies existing MongoDB books.
8. Writes to output JSON file without touching MongoDB unless --upload-mongo is explicitly requested.
9. Defaults to Test Mode (processes 20 books first). Use --all to process all books.
"""

import os
import sys
import json
import re
import argparse
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple, Any

# Ensure stdout handles UTF-8 characters on Windows consoles
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Optional dotenv support
try:
    from dotenv import load_dotenv
    # Look for .env in current directory and parent directories
    load_dotenv(override=False)
    env_candidate = Path(__file__).resolve().parent / '.env'
    if env_candidate.exists():
        load_dotenv(dotenv_path=env_candidate, override=False)
except ImportError:
    pass

import openpyxl

# Canonical Genres (Strictly 7)
CANONICAL_GENRES = [
    "Приключения",
    "Фантастика",
    "Фэнтези",
    "Детектив",
    "Биография",
    "Романтика",
    "Поэзия"
]

CANONICAL_GENRES_SET = set(CANONICAL_GENRES)

# Supported Languages
SUPPORTED_LANGUAGES = ["English", "Русский", "Қазақ"]


# ============================================================================
# Heuristic Fallback Dictionaries (for offline / quota-exhausted scenarios)
# ============================================================================

GENRE_KEYWORD_RULES = {
    "Фантастика": [
        "фантастик", "космос", "робот", "марс", "планет", "галактик", "будущее",
        "технолог", "sci-fi", "научная фантастика", "time travel", "space", "alien",
        "ғарыш", "болашақ", "антиутопи", "dystopia", "киборг", "жасанды интеллект"
    ],
    "Фэнтези": [
        "фэнтези", "магия", "волшеб", "колдун", "эльф", "гном", "дракон", "ертегі",
        "қиял-ғажайып", "поттер", "хоббит", "сиқыр", "сиқыршы", "айдаһар", "fantasy",
        "wizard", "witch", "myth", "миф", "легенд", "чудовищ", "заклинани", "сказк"
    ],
    "Детектив": [
        "детектив", "расследован", "убийств", "преступлен", "следствие", "сыщик",
        "холмс", "пуаро", "кристи", "тайн", "загадк", "қылмыс", "тергеу", "тыңшы",
        "mystery", "crime", "detective", "sherlock", "clue", "murder", "theft", "шпион"
    ],
    "Биография": [
        "биографи", "автобиографи", "мемуар", "өмірбаяны", "тұлға", "өмірі", "ғұмырнама",
        "жизнь", "судьба", "великие люди", "дневник", "biography", "memoir", "life of",
        "true story", "портрет", "тарихи тұлға", "ұлылар", "абай", "шоқан", "ыбырай"
    ],
    "Романтика": [
        "романтик", "любов", "махаббат", "сезім", "ғашық", "жүрек", "свадьб", "отношен",
        "romance", "love", "passion", "страсть", "нежность", "романтическ"
    ],
    "Поэзия": [
        "поэзи", "стих", "стихотворен", "өлең", "жыр", "дастан", "поэма", "баллад",
        "жырлар", "өлеңдер", "poetry", "poem", "verse", "сонет", "лирик"
    ],
    "Приключения": [
        "приключен", "путешеств", "саяхат", "экспедици", "шытырман", "остров", "джунгли",
        "море", "океан", "пират", "поход", "робинзон", "верн", "дюма", "adventure",
        "safari", "quest", "journey", "voyage", "expedition", "айвенго", "батыр"
    ]
}


def normalize_string(s: Any) -> str:
    """Strip punctuation and whitespace for string matching."""
    if s is None:
        return ""
    return re.sub(r'[^a-zA-Z0-9\u0400-\u04FF\u0490-\u0491\u04AA-\u04AB\u04BA-\u04BB\u04AE-\u04AF\u04E8-\u04E9\u04B0-\u04B1\u04D8-\u04D9]', '', str(s).lower())


def clean_title(raw_title: Any) -> str:
    """Clean and normalize title text."""
    if not raw_title:
        return "Untitled"
    t = str(raw_title).strip()
    t = re.sub(r'[\r\n\t]+', ' ', t)
    t = re.sub(r'\s+', ' ', t)
    # Remove surrounding matched quotation marks if present
    if (t.startswith('"') and t.endswith('"')) or (t.startswith('«') and t.endswith('»')):
        t = t[1:-1].strip()
    if t.endswith('.') and not t.endswith('etc.'):
        t = t[:-1].strip()
    return t or "Untitled"


def clean_author(raw_author: Any, language: str) -> str:
    """Clean and standardize author name. Provides clean fallback if empty."""
    if not raw_author or not str(raw_author).strip():
        if language == "Қазақ":
            return "Классикалық әдебиет"
        elif language == "Русский":
            return "Классическая литература"
        return "Classic Literature"
    
    a = str(raw_author).strip()
    a = re.sub(r'[\r\n\t]+', ' ', a)
    a = re.sub(r'\s+', ' ', a)
    # Remove trailing dot or comma
    a = a.rstrip(' ,')
    return a


def clean_isbn(raw_isbn: Any) -> str:
    """Normalize ISBN to standard digit string."""
    if not raw_isbn:
        return ""
    s = str(raw_isbn).strip()
    if s.endswith('.0'):
        s = s[:-2]
    # Remove hyphens, spaces, and punctuation
    cleaned = re.sub(r'[^0-9Xx]', '', s)
    if len(cleaned) in [10, 13]:
        return cleaned.upper()
    return cleaned


def clean_year(raw_year: Any) -> str:
    """Extract standard 4-digit year as string."""
    if not raw_year:
        return ""
    s = str(raw_year).strip()
    match = re.search(r'\b(1[89]\d{2}|20\d{2})\b', s)
    if match:
        return match.group(1)
    return s[:4] if len(s) >= 4 and s[:4].isdigit() else ""


def clean_copies(raw_copies: Any, raw_fund: Any = None) -> int:
    """Safely parse copy count, defaulting to 1."""
    for val in [raw_copies, raw_fund]:
        if val is not None:
            try:
                num = int(float(str(val).strip()))
                if num > 0:
                    return num
            except (ValueError, TypeError):
                continue
    return 1


def detect_language_from_context(filename: str, sample_text: str = "") -> str:
    """Detect language based on Excel filename or text characteristics."""
    fn = filename.lower()
    if "англ" in fn or "eng" in fn:
        return "English"
    if "каз" in fn or "kaz" in fn:
        return "Қазақ"
    if "рус" in fn or "урсс" in fn or "rus" in fn:
        return "Русский"
    
    # Fallback to text inspection
    kz_chars = set("әіңғүұқөһӘІҢҒҮҰҚӨҺ")
    if any(c in kz_chars for c in sample_text):
        return "Қазақ"
    if re.search(r'[\u0400-\u04FF]', sample_text):
        return "Русский"
    return "English"


# ============================================================================
# AI Enrichment Service (OpenAI / Gemini / Heuristic Fallback)
# ============================================================================

class AIEnricher:
    def __init__(self):
        self.openai_client = None
        self.gemini_client = None
        self.provider = "none"

        # Initialize OpenAI if key is present
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key and not openai_key.startswith("your_"):
            try:
                from openai import OpenAI
                self.openai_client = OpenAI(api_key=openai_key)
                self.provider = "openai"
                print("🤖 AI Provider: OpenAI (gpt-4o-mini)")
            except Exception as e:
                print(f"⚠️ Could not initialize OpenAI: {e}")

        # Initialize Gemini if OpenAI is not active and Gemini key is present
        if not self.openai_client:
            gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
            if gemini_key:
                try:
                    import google.generativeai as genai
                    genai.configure(api_key=gemini_key)
                    self.gemini_client = genai.GenerativeModel("gemini-1.5-flash")
                    self.provider = "gemini"
                    print("🤖 AI Provider: Google Gemini (gemini-1.5-flash)")
                except Exception as e:
                    print(f"⚠️ Could not initialize Gemini: {e}")

        if self.provider == "none":
            print("ℹ️ AI Provider: Intelligent Local Fallback Engine (no external API needed)")

    def generate_ai_metadata(self, title: str, author: str, year: str, language: str) -> Tuple[str, str]:
        """
        Attempts AI completion via OpenAI/Gemini to get:
        1. Short 1-2 sentence description in book's language.
        2. Exactly one genre from CANONICAL_GENRES.
        Falls back to local heuristic engine if API fails or quota is exhausted.
        """
        if self.openai_client:
            try:
                return self._call_openai(title, author, year, language)
            except Exception as err:
                # Quota exhausted or network issue -> gracefully fallback
                if "quota" in str(err).lower() or "429" in str(err):
                    print("⚠️ OpenAI quota exhausted (429). Switching to Intelligent Local Fallback Engine.")
                    self.openai_client = None
                else:
                    print(f"⚠️ OpenAI request failed: {err}. Using local fallback.")

        if self.gemini_client:
            try:
                return self._call_gemini(title, author, year, language)
            except Exception as err:
                print(f"⚠️ Gemini request failed: {err}. Using local fallback.")
                self.gemini_client = None

        return self._generate_heuristic_metadata(title, author, year, language)

    def _call_openai(self, title: str, author: str, year: str, language: str) -> Tuple[str, str]:
        prompt = (
            f"Analyze this library book for a high school catalog:\n"
            f"Title: {title}\n"
            f"Author: {author}\n"
            f"Year: {year}\n"
            f"Language: {language}\n\n"
            f"TASK:\n"
            f"1. Generate a concise, engaging 1-2 sentence description strictly in {language}.\n"
            f"2. Select EXACTLY ONE canonical genre from this list: {json.dumps(CANONICAL_GENRES, ensure_ascii=False)}.\n\n"
            f"Output strictly a JSON object formatted as:\n"
            f'{{"genre": "ONE_GENRE", "description": "1-2 sentence description in {language}"}}'
        )
        response = self.openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional library cataloger. Output only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=150,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        data = json.loads(content)
        genre = self._validate_genre(data.get("genre"))
        desc = str(data.get("description", "")).strip()
        if not desc:
            desc = self._default_description(title, author, language, genre)
        return genre, desc

    def _call_gemini(self, title: str, author: str, year: str, language: str) -> Tuple[str, str]:
        prompt = (
            f"Analyze this book: Title: '{title}', Author: '{author}', Language: '{language}'.\n"
            f"Respond with a JSON object with two fields:\n"
            f"1. 'genre': Exactly one of {CANONICAL_GENRES}\n"
            f"2. 'description': A 1-2 sentence description in {language}.\n"
            f"JSON only."
        )
        response = self.gemini_client.generate_content(prompt)
        text = response.text.strip()
        text = re.sub(r'^```json\s*', '', text)
        text = re.sub(r'```$', '', text).strip()
        data = json.loads(text)
        genre = self._validate_genre(data.get("genre"))
        desc = str(data.get("description", "")).strip()
        if not desc:
            desc = self._default_description(title, author, language, genre)
        return genre, desc

    def _validate_genre(self, raw_genre: Any) -> str:
        """Ensure the genre is strictly one of the 7 canonical genres."""
        if not raw_genre:
            return "Приключения"
        g = str(raw_genre).strip()
        if g in CANONICAL_GENRES_SET:
            return g
        for canonical in CANONICAL_GENRES:
            if canonical.lower() in g.lower() or g.lower() in canonical.lower():
                return canonical
        return "Приключения"

    def _generate_heuristic_metadata(self, title: str, author: str, year: str, language: str) -> Tuple[str, str]:
        """High quality rule-based genre classification and description generator."""
        search_blob = f"{title} {author}".lower()
        assigned_genre = None

        # Check keyword rules
        for genre, keywords in GENRE_KEYWORD_RULES.items():
            if any(kw in search_blob for kw in keywords):
                assigned_genre = genre
                break

        if not assigned_genre:
            assigned_genre = "Приключения"

        description = self._default_description(title, author, language, assigned_genre)
        return assigned_genre, description

    def _default_description(self, title: str, author: str, language: str, genre: str) -> str:
        """Create a polished, grammatical 1-2 sentence description in target language."""
        if language == "Қазақ":
            genre_desc_map = {
                "Приключения": f"«{title}» — оқырмандарды қызықты оқиғалар мен шытырман саяхаттар әлеміне жетелейтін туынды. {author} кейіпкерлердің ерлігі мен достығын шебер суреттейді.",
                "Фантастика": f"«{title}» — болашақ технологиялары мен ғарыш тылсымдарын ашатын ғылыми-фантастикалық шығарма. Кітап адамзат болашағы мен таным көкжиегіне терең көз жүгіртеді.",
                "Фэнтези": f"«{title}» — сиқырлы әлем мен ғажайып кейіпкерлердің тартысына құрылған фэнтези туындысы. Оқырманды таңғажайып аңыздар мен қаһармандық ерліктер баурайды.",
                "Детектив": f"«{title}» — күрделі құпиялар мен логикалық тергеулерге толы шиеленісті детектив. {author} оқырманды шытырман оқиғаның соңына дейін құпиясын сақтауға мәжбүрлейді.",
                "Биография": f"«{title}» — көрнекті тұлғаның ғибратты өмір жолы мен жеңістерін баяндайтын өмірбаяндық шығарма. Туынды жастарға табандылық пен танымдық шабыт береді.",
                "Романтика": f"«{title}» — шынайы сезімдер мен махаббат сынақтарын бейнелейтін терең романтикалық хикаят. {author} кейіпкерлердің ішкі сырлары мен адалдығын нәзік жеткізеді.",
                "Поэзия": f"«{title}» — сыршыл сезімдер мен терең философиялық ойларды өрнектеген поэтикалық жинақ. Жыр жолдары туған жерге, өмірге және сұлулыққа деген шексіз сүйіспеншілікті жырлайды."
            }
            return genre_desc_map.get(genre, f"«{title}» — терең мазмұнды әрі танымдық әдеби шығарма. {author} жас оқырмандар үшін маңызды өмірлік құндылықтарды баяндайды.")

        elif language == "Русский":
            genre_desc_map = {
                "Приключения": f"«{title}» — увлекательное повествование, полное неожиданных открытий и захватывающих странствий. Автор {author} мастерски раскрывает смелость и стойкость героев.",
                "Фантастика": f"«{title}» — захватывающее научно-фантастическое произведение о будущем, технологиях и тайнах Вселенной. Книга заставляет задуматься о месте человека в меняющемся мире.",
                "Фэнтези": f"«{title}» — яркое фэнтези, переносящее читателя в мир магии, древних преданий и эпических сражений. История вдохновляет на подвиги и верность идеалам добра.",
                "Детектив": f"«{title}» — напряжённая детективная история с хитроумным сюжетом и неожиданной развязкой. {author} виртуозно ведёт расследование вместе с читателем шаг за шагом.",
                "Биография": f"«{title}» — вдохновляющая биография выдающейся личности, преодолевшей трудности на пути к своей цели. Книга служит ценным жизненным примером для юных читателей.",
                "Романтика": f"«{title}» — трогательная история об искренних чувствах, доверии и поиске истинного счастья. {author} поэтично и точно раскрывает переживания главных героев.",
                "Поэзия": f"«{title}» — сборник выразительных поэтических произведений, наполненных глубокими размышлениями и эмоциональной силой. Стихи открывают красоту слова и гармонию чувств."
            }
            return genre_desc_map.get(genre, f"«{title}» — ценное литературное издание, расширяющее кругозор читателя. Автор {author} затрагивает важные жизненные и нравственные темы.")

        else: # English
            genre_desc_map = {
                "Приключения": f"'{title}' is an exciting tale filled with perilous expeditions and inspiring triumphs. {author} captures the relentless spirit of discovery and resilience.",
                "Фантастика": f"'{title}' is a thought-provoking science fiction work exploring futuristic concepts and the boundaries of human knowledge. It takes readers on an unforgettable journey through time and space.",
                "Фэнтези": f"'{title}' is a captivating fantasy story set in a realm of magic, ancient wonders, and legendary quests. Readers are drawn into an epic struggle between light and darkness.",
                "Детектив": f"'{title}' is a gripping mystery featuring an intricate puzzle of clues and deduction. {author} keeps readers guessing until the final revelation.",
                "Биография": f"'{title}' chronicles the remarkable real-life journey and achievements of an inspiring figure. The narrative offers motivating insights into determination, leadership, and personal courage.",
                "Романтика": f"'{title}' is an evocative novel exploring genuine devotion, personal growth, and heartfelt connections. {author} weaves an emotionally rich and memorable narrative.",
                "Поэзия": f"'{title}' is an inspiring poetry collection reflecting on nature, human emotions, and timeless wisdom. The lyrical verse speaks deeply to the imagination of young readers."
            }
            return genre_desc_map.get(genre, f"'{title}' is an engaging literary work offering valuable cultural and intellectual insights. {author} presents an inspiring reading experience.")


# ============================================================================
# Excel Directory Resolution
# ============================================================================

def resolve_excel_dir(custom_path: Optional[str] = None) -> Path:
    """Find the directory containing the library Excel files."""
    script_dir = Path(__file__).resolve().parent

    candidates = []
    if custom_path:
        candidates.append(Path(custom_path))
        candidates.append(script_dir / custom_path)

    # Standard candidate paths
    candidates.extend([
        Path("data/excel"),
        script_dir / "data" / "excel",
        Path("server/data/excel"),
        script_dir / "server" / "data" / "excel",
        script_dir.parent / "data" / "excel",
        script_dir.parent / "server" / "data" / "excel",
    ])

    for p in candidates:
        if p.exists() and p.is_dir():
            xlsx_files = list(p.glob("*.xlsx"))
            if xlsx_files:
                return p.resolve()

    raise FileNotFoundError(
        f"Could not locate directory containing Excel catalog files (.xlsx).\n"
        f"Searched paths: {[str(c) for c in candidates]}\n"
        f"Please specify the path using: python process_books.py --excel-dir <path>"
    )


# ============================================================================
# Existing Database ISBN & Book Protection
# ============================================================================

def load_existing_db_isbns() -> Tuple[Set[str], Set[str]]:
    """
    Loads all existing ISBNs and (title, author) pairs from local books.json
    and local MongoDB (if reachable) to ensure existing books are NEVER modified.
    """
    existing_isbns = set()
    existing_keys = set()
    script_dir = Path(__file__).resolve().parent

    # Check local books.json files
    json_paths = [
        script_dir / "server" / "data" / "books.json",
        script_dir / "public" / "data" / "books.json",
        script_dir / "dist" / "data" / "books.json",
    ]

    for jp in json_paths:
        if jp.exists():
            try:
                with open(jp, "r", encoding="utf-8") as f:
                    books = json.load(f)
                    for b in books:
                        isbn = clean_isbn(b.get("isbn"))
                        if isbn:
                            existing_isbns.add(isbn)
                        nt = normalize_string(b.get("title"))
                        na = normalize_string(b.get("author"))
                        if nt:
                            existing_keys.add((nt, na))
                break
            except Exception as e:
                print(f"⚠️ Notice: Could not read {jp}: {e}")

    # Check MongoDB if pymongo is installed and running
    try:
        import pymongo
        mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/nis-kitap")
        client = pymongo.MongoClient(mongo_uri, serverSelectionTimeoutMS=1000)
        client.admin.command('ping')
        db_name = mongo_uri.split('/')[-1].split('?')[0] or "nis-kitap"
        db = client[db_name]
        for doc in db.books.find({}, {"isbn": 1, "title": 1, "author": 1}):
            isbn = clean_isbn(doc.get("isbn"))
            if isbn:
                existing_isbns.add(isbn)
            nt = normalize_string(doc.get("title"))
            na = normalize_string(doc.get("author"))
            if nt:
                existing_keys.add((nt, na))
        print(f"🛡️ Connected to MongoDB: Loaded {len(existing_isbns)} existing ISBNs to protect against modification.")
    except Exception:
        # MongoDB offline or pymongo not installed - local JSON index is authoritative
        pass

    return existing_isbns, existing_keys


# ============================================================================
# Excel Parsing Engine
# ============================================================================

def parse_single_excel(filepath: Path) -> List[Dict[str, Any]]:
    """
    Parses a single Excel file according to NIS library catalog format:
    Row index 3 is the header:
    ['', '№', 'Автор', 'Заглавие', 'ISBN', 'Год издания', 'Место издания', 'В фонде', 'Кол-во экземпляров']
    """
    records = []
    wb = openpyxl.load_workbook(str(filepath), data_only=True)
    sheet = wb.active
    rows = list(sheet.iter_rows(values_only=True))

    if len(rows) < 4:
        return records

    # Locate header row by searching for 'автор' or 'заглавие'
    header_idx = -1
    for idx, r in enumerate(rows[:10]):
        row_str = " ".join([str(c).lower() for c in r if c is not None])
        if "автор" in row_str and ("заглавие" in row_str or "атауы" in row_str or "isbn" in row_str):
            header_idx = idx
            break

    if header_idx == -1:
        # Default standard header index
        header_idx = 3

    # Detect catalog language from filename
    catalog_lang = detect_language_from_context(filepath.name)

    for r in rows[header_idx + 1:]:
        if not r or len(r) < 4:
            continue
        # Check row number or title presence
        raw_author = r[2] if len(r) > 2 else None
        raw_title = r[3] if len(r) > 3 else None
        raw_isbn = r[4] if len(r) > 4 else None
        raw_year = r[5] if len(r) > 5 else None
        raw_fund = r[7] if len(r) > 7 else None
        raw_copies = r[8] if len(r) > 8 else None

        title = clean_title(raw_title)
        if not title or title.lower() in ["untitled", "заглавие", "атауы"]:
            continue

        language = detect_language_from_context(filepath.name, f"{title} {raw_author or ''}")
        author = clean_author(raw_author, language)
        isbn = clean_isbn(raw_isbn)
        year = clean_year(raw_year)
        copies = clean_copies(raw_copies, raw_fund)

        records.append({
            "source_file": filepath.name,
            "title": title,
            "author": author,
            "year": year,
            "copies": copies,
            "language": language,
            "isbn": isbn
        })

    return records


# ============================================================================
# Main Processing Pipeline
# ============================================================================

def process_books(
    excel_dir: Optional[str] = None,
    output_path: Optional[str] = None,
    test_mode: bool = True,
    limit: Optional[int] = 20,
    upload_mongo: bool = False
) -> List[Dict[str, Any]]:
    """
    Main orchestration function satisfying all 10 project requirements.
    """
    resolved_dir = resolve_excel_dir(excel_dir)
    print("=" * 70)
    print("📚 NIS-KITAP LIBRARY BOOKS PROCESSING PIPELINE")
    print("=" * 70)
    print(f"📁 Source Directory:  {resolved_dir}")
    excel_files = sorted(list(resolved_dir.glob("*.xlsx")))
    print(f"📄 Found Excel Files: {len(excel_files)} files")

    # Determine processing limit
    if test_mode:
        actual_limit = limit if (limit and limit > 0) else 20
        print(f"🧪 Execution Mode:    TEST MODE (processing first {actual_limit} books)")
    else:
        actual_limit = limit if (limit and limit > 0) else 0
        print(f"🚀 Execution Mode:    FULL MODE (processing all books)")

    # 1. Load existing database state to protect existing MongoDB books
    existing_isbns, existing_keys = load_existing_db_isbns()
    print(f"🛡️ Existing Records:  {len(existing_isbns)} protected ISBNs (will NOT be modified)")

    # 2. Ingest raw records from Excel
    all_raw_records = []
    for ef in excel_files:
        records = parse_single_excel(ef)
        all_raw_records.extend(records)
        print(f"   • {ef.name:32} -> {len(records):4} books parsed")

    print(f"\n📊 Total Raw Books Extracted: {len(all_raw_records)}")

    # 3. Deduplicate and enrich
    ai_enricher = AIEnricher()
    processed_books: List[Dict[str, Any]] = []
    seen_batch_isbns: Set[str] = set()
    seen_batch_keys: Set[Tuple[str, str]] = set()

    skipped_db_duplicates = 0
    consolidated_batch_duplicates = 0

    print("\n⏳ Processing and enriching records with AI descriptions & canonical genres...")

    for record in all_raw_records:
        if actual_limit > 0 and len(processed_books) >= actual_limit:
            break

        isbn = record["isbn"]
        title = record["title"]
        author = record["author"]
        year = record["year"]
        copies = record["copies"]
        language = record["language"]

        # Check duplicate against existing MongoDB records
        if isbn and isbn in existing_isbns:
            skipped_db_duplicates += 1
            continue

        nt = normalize_string(title)
        na = normalize_string(author)
        book_key = (nt, na)

        if not isbn and book_key in existing_keys:
            skipped_db_duplicates += 1
            continue

        # Check duplicate within current run
        if isbn and isbn in seen_batch_isbns:
            # Consolidate copy count to existing processed record
            for pb in processed_books:
                if pb["isbn"] == isbn:
                    pb["copies"] += copies
                    break
            consolidated_batch_duplicates += 1
            continue

        if not isbn and book_key in seen_batch_keys:
            for pb in processed_books:
                if (normalize_string(pb["title"]), normalize_string(pb["author"])) == book_key:
                    pb["copies"] += copies
                    break
            consolidated_batch_duplicates += 1
            continue

        # Register in seen index
        if isbn:
            seen_batch_isbns.add(isbn)
        seen_batch_keys.add(book_key)

        # AI Enrichment: Genre & 1-2 sentence description
        genre, description = ai_enricher.generate_ai_metadata(
            title=title,
            author=author,
            year=year,
            language=language
        )

        # Standard MongoDB JSON structure
        book_obj = {
            "title": title,
            "author": author,
            "description": description,
            "genre": genre,
            "year": year,
            "copies": copies,
            "language": language,
            "cover_image": "",
            "status": "available",
            "isbn": isbn
        }

        processed_books.append(book_obj)
        idx = len(processed_books)
        print(f"   [{idx:3d}/{actual_limit if actual_limit > 0 else len(all_raw_records)}] {title[:35]:35} | {author[:20]:20} | {genre:12} | {language:7}")

    # 4. Resolve Output File Path
    script_dir = Path(__file__).resolve().parent
    if output_path:
        out_file = Path(output_path)
    else:
        out_file = script_dir / "data" / "output_books.json"

    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(processed_books, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 70)
    print("✅ EXECUTION SUMMARY & VALIDATION")
    print("=" * 70)
    print(f"• Books Processed:             {len(processed_books)}")
    print(f"• Existing DB Duplicates (Skipped): {skipped_db_duplicates} (Protected from modification)")
    print(f"• Batch Duplicates (Consolidated):  {consolidated_batch_duplicates}")
    print(f"• Output JSON Saved To:        {out_file.resolve()}")

    # Schema Validation Check
    required_keys = ["title", "author", "description", "genre", "year", "copies", "language", "cover_image", "status", "isbn"]
    for i, b in enumerate(processed_books):
        for k in required_keys:
            assert k in b, f"Book {i} missing key: {k}"
        assert b["genre"] in CANONICAL_GENRES_SET, f"Invalid genre: {b['genre']}"
        assert b["language"] in SUPPORTED_LANGUAGES, f"Invalid language: {b['language']}"
        assert b["status"] == "available", f"Invalid status: {b['status']}"
        assert isinstance(b["copies"], int) and b["copies"] >= 1, f"Invalid copies: {b['copies']}"

    print(f"• Schema Integrity:            100% Validated (all 10 keys present in all books)")

    # Optional MongoDB Upload (only if requested explicitly)
    if upload_mongo:
        _upload_to_mongodb(processed_books)
    else:
        print("• MongoDB Upload:              Skipped (as requested; no modification to DB)")

    print("=" * 70)
    return processed_books


def _upload_to_mongodb(books: List[Dict[str, Any]]):
    """Safely inserts new books to MongoDB without modifying existing documents."""
    if not books:
        print("ℹ️ No books to upload.")
        return
    try:
        import pymongo
        mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/nis-kitap")
        client = pymongo.MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
        client.admin.command('ping')
        db_name = mongo_uri.split('/')[-1].split('?')[0] or "nis-kitap"
        db = client[db_name]

        # Double check no existing books are overwritten
        new_books_to_insert = []
        for b in books:
            filter_query = {}
            if b["isbn"]:
                filter_query = {"isbn": b["isbn"]}
            else:
                filter_query = {"title": b["title"], "author": b["author"]}

            if not db.books.find_one(filter_query):
                new_books_to_insert.append(b)

        if new_books_to_insert:
            res = db.books.insert_many(new_books_to_insert)
            print(f"✅ MongoDB: Safely inserted {len(res.inserted_ids)} new books into '{db_name}.books' collection.")
        else:
            print("ℹ️ MongoDB: All books already exist in database; 0 books inserted.")
    except Exception as e:
        print(f"❌ MongoDB Upload failed: {e}")


# ============================================================================
# CLI Argument Parser & Entry Point
# ============================================================================

def parse_args():
    parser = argparse.ArgumentParser(
        description="NIS-Kitap Library Excel Ingestion Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Test mode (default, processes first 20 books without modifying MongoDB):
  python process_books.py

  # Process all books from all 20 Excel files:
  python process_books.py --all

  # Process a custom number of books:
  python process_books.py --limit 50

  # Specify custom Excel directory and output file:
  python process_books.py --excel-dir data/excel --output data/output_books.json

  # Upload new books to MongoDB (never modifies existing records):
  python process_books.py --upload-mongo
        """
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Process all books from all Excel files (disables 20-book test mode)"
    )
    parser.add_argument(
        "--test",
        action="store_true",
        default=True,
        help="Run in test mode (processes first 20 books by default)"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=20,
        help="Maximum number of books to process (default: 20 for test mode)"
    )
    parser.add_argument(
        "--excel-dir",
        type=str,
        default=None,
        help="Path to directory containing Excel catalog files (default: data/excel/)"
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Path for output JSON file (default: data/output_books.json)"
    )
    parser.add_argument(
        "--upload-mongo",
        action="store_true",
        help="Upload new unique books to MongoDB (default: False; does not modify DB)"
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    is_test = not args.all
    limit_val = 0 if args.all else (args.limit or 20)
    process_books(
        excel_dir=args.excel_dir,
        output_path=args.output,
        test_mode=is_test,
        limit=limit_val,
        upload_mongo=args.upload_mongo
    )
