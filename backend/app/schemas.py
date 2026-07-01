from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    path: str
    type: str
    size: int
    summary: Optional[str] = None
    keywords: Optional[List[str]] = None
    preview: Optional[str] = None
    ocrText: Optional[str] = None
    indexed: bool
    embeddingCount: int
    createdAt: Optional[datetime] = None
    modifiedAt: Optional[datetime] = None
    indexedAt: Optional[datetime] = None


class DocumentList(BaseModel):
    documents: List[DocumentOut]
    total: int


class SearchInput(BaseModel):
    query: str
    limit: int = 10


class SearchResultItem(BaseModel):
    document: DocumentOut
    score: float
    snippet: str


class SearchResult(BaseModel):
    query: str
    results: List[SearchResultItem]
    aiResponse: Optional[str] = None
    totalResults: int
    timeTakenMs: int
    # Extra: not in OpenAPI spec but consumed by the frontend directly
    aiUsed: bool = False


class SearchHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    query: str
    resultCount: int
    timestamp: datetime


class SearchHistoryList(BaseModel):
    history: List[SearchHistoryItem]


class IndexInput(BaseModel):
    path: str
    recursive: bool = True


class IndexStatus(BaseModel):
    isIndexing: bool
    totalFiles: int
    processedFiles: int
    failedFiles: int
    currentFile: Optional[str] = None
    folders: List[str]


class FolderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    path: str
    isWatched: bool
    documentCount: int
    lastIndexed: Optional[datetime] = None


class FolderList(BaseModel):
    folders: List[FolderOut]


class OcrInput(BaseModel):
    filePath: str


class OcrResult(BaseModel):
    filePath: str
    text: str
    confidence: float


class TypeBreakdown(BaseModel):
    pdf: int
    docx: int
    txt: int
    md: int
    image: int


class DayActivity(BaseModel):
    date: str
    indexed: int
    searched: int


class DashboardStats(BaseModel):
    totalDocuments: int
    totalImages: int
    totalEmbeddings: int
    storageUsedBytes: int
    recentSearches: int
    indexedToday: int
    typeBreakdown: TypeBreakdown
    activityByDay: List[DayActivity]


class TimelineDocument(BaseModel):
    id: int
    title: str
    path: str
    type: str


class TimelineSearch(BaseModel):
    id: int
    query: str
    resultCount: int
    timestamp: datetime


class TimelineGroup(BaseModel):
    date: str
    label: str
    documents: List[TimelineDocument]
    searches: List[TimelineSearch]


class Timeline(BaseModel):
    groups: List[TimelineGroup]


class DocumentSummary(BaseModel):
    id: str
    summary: str
    keywords: List[str]
    keyPoints: List[str]


class HealthStatus(BaseModel):
    status: str
    version: str
    # Not in OpenAPI spec — extra fields for the settings page live status
    ollamaAvailable: bool = False
    chromaAvailable: bool = False
    llmModel: str = ""
    embedModel: str = ""
