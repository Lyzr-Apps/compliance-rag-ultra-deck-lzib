'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { getDocuments, uploadAndTrainDocument, deleteDocuments, type RAGDocument } from '@/lib/ragKnowledgeBase'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { FiFile, FiFileText, FiUpload, FiTrash2, FiRefreshCw, FiLoader, FiSearch, FiMessageSquare, FiShield, FiX } from 'react-icons/fi'
import { HiOutlineDocumentText, HiOutlineScale, HiOutlineClipboardCheck } from 'react-icons/hi'

const RAG_ID = '69a270f6f572c99c0ffbe5ab'

export type QueryMode = 'general' | 'cross-reference' | 'gap-analysis' | 'checklist' | 'risk-assessment'

interface SidebarProps {
  selectedMode: QueryMode
  onModeChange: (mode: QueryMode) => void
  isMobileOpen: boolean
  onMobileClose: () => void
}

const QUERY_MODES: { id: QueryMode; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'general', label: 'General Q&A', icon: <FiMessageSquare className="w-3.5 h-3.5" />, description: 'Ask any compliance question' },
  { id: 'cross-reference', label: 'Cross-Reference', icon: <HiOutlineScale className="w-3.5 h-3.5" />, description: 'Compare frameworks' },
  { id: 'gap-analysis', label: 'Gap Analysis', icon: <FiSearch className="w-3.5 h-3.5" />, description: 'Identify coverage gaps' },
  { id: 'checklist', label: 'Checklist', icon: <HiOutlineClipboardCheck className="w-3.5 h-3.5" />, description: 'Generate checklists' },
  { id: 'risk-assessment', label: 'Risk Assessment', icon: <FiShield className="w-3.5 h-3.5" />, description: 'Assess compliance risks' },
]

export default function Sidebar({ selectedMode, onModeChange, isMobileOpen, onMobileClose }: SidebarProps) {
  const [documents, setDocuments] = useState<RAGDocument[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocs = useCallback(async () => {
    setDocsLoading(true)
    try {
      const result = await getDocuments(RAG_ID)
      if (result.success && Array.isArray(result.documents)) {
        setDocuments(result.documents)
      }
    } catch {
      // silent
    }
    setDocsLoading(false)
  }, [])

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

  const handleUpload = async (file: File) => {
    setUploading(true)
    setUploadError(null)
    try {
      const result = await uploadAndTrainDocument(RAG_ID, file)
      if (result.success) {
        await fetchDocs()
      } else {
        setUploadError(result.error ?? 'Upload failed')
      }
    } catch {
      setUploadError('Upload failed')
    }
    setUploading(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDelete = async (fileName: string) => {
    try {
      const result = await deleteDocuments(RAG_ID, [fileName])
      if (result.success) {
        setDocuments(prev => prev.filter(d => d.fileName !== fileName))
      }
    } catch {
      // silent
    }
    setDeleteConfirm(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }

  const getFileIcon = (fileType: string) => {
    if (fileType === 'pdf') return <FiFile className="w-4 h-4 text-red-600" />
    if (fileType === 'docx') return <HiOutlineDocumentText className="w-4 h-4 text-blue-600" />
    return <FiFileText className="w-4 h-4 text-muted-foreground" />
  }

  const getStatusColor = (status?: string) => {
    if (status === 'active') return 'bg-green-500'
    if (status === 'processing') return 'bg-amber-500 animate-pulse'
    if (status === 'failed') return 'bg-red-500'
    return 'bg-green-500'
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card border-r border-border/50">
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-serif text-sm font-semibold text-foreground tracking-wide uppercase">Query Mode</h2>
          <button onClick={onMobileClose} className="lg:hidden p-1 rounded hover:bg-muted">
            <FiX className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Select analysis type</p>
        <div className="flex flex-col gap-1.5">
          {QUERY_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => { onModeChange(mode.id); onMobileClose(); }}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-200 text-sm',
                selectedMode === mode.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-muted/70 text-foreground'
              )}
            >
              {mode.icon}
              <span className="font-medium">{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Separator className="opacity-50" />

      <div className="flex-1 flex flex-col min-h-0 p-4 pt-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-sm font-semibold text-foreground tracking-wide uppercase">Documents</h2>
          <button
            onClick={fetchDocs}
            disabled={docsLoading}
            className="p-1 rounded hover:bg-muted transition-colors"
            title="Refresh documents"
          >
            <FiRefreshCw className={cn('w-3.5 h-3.5 text-muted-foreground', docsLoading && 'animate-spin')} />
          </button>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg p-3 mb-3 text-center transition-all duration-200 cursor-pointer',
            dragOver ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/40',
            uploading && 'pointer-events-none opacity-60'
          )}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <FiLoader className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Indexing...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <FiUpload className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Drop files or click to upload</span>
              <span className="text-xs text-muted-foreground/60">PDF, DOCX, TXT</span>
            </div>
          )}
        </div>

        {uploadError && (
          <div className="text-xs text-destructive mb-2 px-1">{uploadError}</div>
        )}

        <ScrollArea className="flex-1">
          <div className="space-y-1.5 pr-2">
            {docsLoading && documents.length === 0 ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-6">
                <FiFileText className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">No documents uploaded yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Upload compliance docs to enable knowledge-based analysis</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.fileName}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group transition-colors"
                >
                  {getFileIcon(doc.fileType)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{doc.fileName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={cn('w-1.5 h-1.5 rounded-full', getStatusColor(doc.status))} />
                      <span className="text-xs text-muted-foreground capitalize">{doc.status ?? 'Ready'}</span>
                    </div>
                  </div>
                  {deleteConfirm === doc.fileName ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(doc.fileName)}
                        className="p-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        title="Confirm delete"
                      >
                        <FiTrash2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="p-1 rounded hover:bg-muted transition-colors"
                        title="Cancel"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(doc.fileName)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                      title="Delete document"
                    >
                      <FiTrash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <Separator className="opacity-50" />
      <div className="p-4 pt-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs font-medium text-foreground">Compliance Coordinator</span>
        </div>
        <p className="text-xs text-muted-foreground pl-4">Manager agent -- routes queries to specialized sub-agents</p>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[300px] flex-shrink-0 h-full">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-[300px] z-10">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
