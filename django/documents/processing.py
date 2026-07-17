import hashlib
import logging
import mimetypes
import re
import unicodedata

from .models import Document, DocumentData
from .normalizer import normalize

logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES: dict[str, str] = {
    "text/csv": Document.FileType.CSV,
    "application/csv": Document.FileType.CSV,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": Document.FileType.XLSX,
    "application/vnd.ms-excel": Document.FileType.XLS,
}

MAX_UPLOAD_BYTES_DEFAULT = 10 * 1024 * 1024


def normalize_filename(document: Document, file) -> None:
    raw = document.original_filename
    stem, _, ext = raw.rpartition(".")
    if not stem:
        stem, ext = ext, ""

    stem = unicodedata.normalize("NFKD", stem).encode("ascii", "ignore").decode()
    stem = re.sub(r"[^\w\-]", "_", stem)
    stem = re.sub(r"_+", "_", stem).strip("_")[:100] or "document"

    document.original_filename = f"{stem}.{ext.lower()}" if ext else stem


def detect_file_type(document: Document, file) -> None:
    supplied = getattr(file, "content_type", "") or ""
    guessed, _ = mimetypes.guess_type(document.original_filename)
    mime = supplied if supplied in ALLOWED_MIME_TYPES else (guessed or supplied)

    if mime not in ALLOWED_MIME_TYPES:
        raise ValueError("Unsupported file type. Accepted formats: CSV, XLSX, XLS.")

    document.file_type = ALLOWED_MIME_TYPES[mime]


def compute_file_hash(document: Document, file) -> None:
    hasher = hashlib.sha256()
    file.seek(0)
    for chunk in iter(lambda: file.read(8192), b""):
        hasher.update(chunk)
    file.seek(0)
    document.file_hash = hasher.hexdigest()


def normalize_content(document: Document, file) -> None:
    normalized = normalize(file, document.file_type)
    content_hash = normalized.get_canonical_hash()

    DocumentData.objects.update_or_create(
        document=document,
        defaults={
            "normalized_data": normalized.to_dict(),
            "content_hash": content_hash,
        },
    )

    document.row_count = len(normalized.rows)
    document.column_count = len(normalized.columns)
    document.column_names = normalized.columns


_PIPELINE = [
    normalize_filename,
    detect_file_type,
    compute_file_hash,
    normalize_content,
]

def run_pipeline(document: Document, file) -> None:
    logger.info("Document %s transitioning to PROCESSING.", document.id)
    document.processing_status = Document.ProcessingStatus.PROCESSING
    document.save(update_fields=["processing_status"])

    try:
        for step in _PIPELINE:
            logger.debug("Running pipeline step %s for document %s.", step.__name__, document.id)
            step(document, file)

        logger.info("Document %s pipeline completed successfully. Transitioning to READY.", document.id)
        document.processing_status = Document.ProcessingStatus.READY
        document.processing_error = ""

    except Exception as exc:
        logger.exception("Pipeline failed for document %s: %s", document.id, exc)
        document.processing_status = Document.ProcessingStatus.FAILED
        document.processing_error = f"{type(exc).__name__}: {str(exc)}"
