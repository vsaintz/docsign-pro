import hashlib
import logging
from dataclasses import dataclass
from typing import Any

import jcs
import pandas as pd

logger = logging.getLogger(__name__)

@dataclass(frozen=True)
class NormalizedDocument:
    columns: list[str]
    rows: list[list[Any]]
    version: int = 2

    def to_dict(self) -> dict:
        return {
            "version": self.version,
            "columns": self.columns,
            "rows": self.rows,
        }

    def get_canonical_hash(self) -> str:
        canonical_bytes = jcs.canonicalize(self.to_dict())
        return hashlib.sha256(canonical_bytes).hexdigest()

def normalize(file, file_type: str) -> NormalizedDocument:
    file.seek(0)

    try:
        if file_type == 'csv':
            df = pd.read_csv(file)
        elif file_type == 'xlsx':
            df = pd.read_excel(file, engine='openpyxl')
        elif file_type == 'xls':
            df = pd.read_excel(file, engine='xlrd')
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
    except Exception as e:
        logger.error(f"Failed to parse {file_type} file: {e}")
        raise ValueError(f"Data extraction failed: {e}")

    df.columns = df.columns.astype(str).str.strip().str.lower().str.replace(r'\s+', ' ', regex=True)

    df = df.astype(object)
    df = df.where(pd.notnull(df), None)

    for col in df.select_dtypes(include=['datetime64', 'datetimetz']).columns:
        df[col] = df[col].dt.strftime('%Y-%m-%dT%H:%M:%S')

    columns = df.columns.tolist()
    rows = df.values.tolist()

    return NormalizedDocument(columns=columns, rows=rows)
