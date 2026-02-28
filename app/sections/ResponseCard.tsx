'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { FiChevronDown, FiChevronUp, FiAlertTriangle, FiCheck, FiBookOpen, FiShield, FiList } from 'react-icons/fi'
import { HiOutlineScale, HiOutlineClipboardCheck } from 'react-icons/hi'

export interface Citation {
  framework: string
  section: string
  excerpt: string
  relevance: string
}

export interface CrossReference {
  framework_a: string
  framework_b: string
  overlap: string
  unique_to_a: string
  unique_to_b: string
}

export interface RiskItem {
  risk: string
  severity: string
  impact: string
  remediation: string
}

export interface ChecklistItem {
  item: string
  category: string
  status: string
  priority: string
}

export interface ParsedComplianceResponse {
  summary: string
  query_type: string
  citations: Citation[]
  analysis: {
    detailed_explanation: string
    cross_references: CrossReference[]
    risk_items: RiskItem[]
    checklist_items: ChecklistItem[]
  }
  recommendations: string[]
}

interface ResponseCardProps {
  data: ParsedComplianceResponse
}

function CollapsibleSection({ title, icon, count, children, defaultOpen }: {
  title: string
  icon: React.ReactNode
  count?: number
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  return (
    <div className="border border-border/40 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-foreground font-serif">{title}</span>
          {count !== undefined && count > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">{count}</Badge>
          )}
        </div>
        {open ? <FiChevronUp className="w-4 h-4 text-muted-foreground" /> : <FiChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1">
          {children}
        </div>
      )}
    </div>
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1 font-serif">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1 font-serif">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2 font-serif">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm leading-relaxed">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm leading-relaxed">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

function getSeverityStyle(severity: string): string {
  const s = (severity ?? '').toLowerCase()
  if (s.includes('high') || s.includes('critical')) return 'bg-red-100 text-red-800 border-red-200'
  if (s.includes('medium') || s.includes('moderate')) return 'bg-amber-100 text-amber-800 border-amber-200'
  if (s.includes('low') || s.includes('minor')) return 'bg-green-100 text-green-800 border-green-200'
  return 'bg-muted text-muted-foreground'
}

function getPriorityStyle(priority: string): string {
  const p = (priority ?? '').toLowerCase()
  if (p.includes('high') || p.includes('critical')) return 'bg-red-100 text-red-800'
  if (p.includes('medium')) return 'bg-amber-100 text-amber-800'
  if (p.includes('low')) return 'bg-green-100 text-green-800'
  return 'bg-muted text-muted-foreground'
}

export default function ResponseCard({ data }: ResponseCardProps) {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())

  const summary = data?.summary ?? ''
  const queryType = data?.query_type ?? ''
  const citations = Array.isArray(data?.citations) ? data.citations : []
  const analysis = data?.analysis ?? {}
  const detailedExplanation = analysis?.detailed_explanation ?? ''
  const crossRefs = Array.isArray(analysis?.cross_references) ? analysis.cross_references : []
  const riskItems = Array.isArray(analysis?.risk_items) ? analysis.risk_items : []
  const checklistItems = Array.isArray(analysis?.checklist_items) ? analysis.checklist_items : []
  const recommendations = Array.isArray(data?.recommendations) ? data.recommendations : []

  const toggleChecked = (idx: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      {summary && (
        <div className="bg-primary/5 border border-primary/15 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FiBookOpen className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider font-serif">Summary</span>
            {queryType && <Badge variant="outline" className="text-xs ml-auto">{queryType}</Badge>}
          </div>
          <div className="text-sm text-foreground leading-relaxed">{renderMarkdown(summary)}</div>
        </div>
      )}

      {/* Detailed Explanation */}
      {detailedExplanation && (
        <CollapsibleSection title="Detailed Analysis" icon={<FiBookOpen className="w-4 h-4 text-primary" />} defaultOpen>
          <div className="text-foreground">{renderMarkdown(detailedExplanation)}</div>
        </CollapsibleSection>
      )}

      {/* Citations */}
      {citations.length > 0 && (
        <CollapsibleSection title="Source Citations" icon={<FiList className="w-4 h-4 text-primary" />} count={citations.length}>
          <div className="space-y-2.5">
            {citations.map((c, i) => (
              <div key={i} className="bg-muted/30 rounded-md p-3 border border-border/30">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Badge variant="default" className="text-xs">{c?.framework ?? 'Unknown'}</Badge>
                  <span className="text-xs font-medium text-muted-foreground">{c?.section ?? ''}</span>
                </div>
                {c?.excerpt && (
                  <p className="text-xs text-foreground italic border-l-2 border-primary/30 pl-3 mb-1.5 leading-relaxed">{c.excerpt}</p>
                )}
                {c?.relevance && (
                  <p className="text-xs text-muted-foreground"><span className="font-medium">Relevance:</span> {c.relevance}</p>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Cross References */}
      {crossRefs.length > 0 && (
        <CollapsibleSection title="Cross-References" icon={<HiOutlineScale className="w-4 h-4 text-primary" />} count={crossRefs.length}>
          <div className="space-y-3">
            {crossRefs.map((ref, i) => (
              <div key={i} className="border border-border/40 rounded-md overflow-hidden">
                <div className="bg-muted/40 px-3 py-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{ref?.framework_a ?? 'Framework A'}</Badge>
                  <span className="text-xs text-muted-foreground">vs</span>
                  <Badge variant="outline" className="text-xs">{ref?.framework_b ?? 'Framework B'}</Badge>
                </div>
                <div className="p-3 space-y-2 text-xs">
                  {ref?.overlap && (
                    <div>
                      <span className="font-semibold text-foreground">Overlap: </span>
                      <span className="text-foreground/80">{ref.overlap}</span>
                    </div>
                  )}
                  {ref?.unique_to_a && (
                    <div>
                      <span className="font-semibold text-foreground">Unique to {ref?.framework_a ?? 'A'}: </span>
                      <span className="text-foreground/80">{ref.unique_to_a}</span>
                    </div>
                  )}
                  {ref?.unique_to_b && (
                    <div>
                      <span className="font-semibold text-foreground">Unique to {ref?.framework_b ?? 'B'}: </span>
                      <span className="text-foreground/80">{ref.unique_to_b}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Risk Items */}
      {riskItems.length > 0 && (
        <CollapsibleSection title="Risk Assessment" icon={<FiShield className="w-4 h-4 text-primary" />} count={riskItems.length}>
          <div className="space-y-2.5">
            {riskItems.map((r, i) => (
              <div key={i} className="border border-border/40 rounded-md p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <FiAlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-foreground">{r?.risk ?? 'Unknown Risk'}</span>
                  </div>
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap', getSeverityStyle(r?.severity ?? ''))}>
                    {r?.severity ?? 'Unknown'}
                  </span>
                </div>
                {r?.impact && (
                  <p className="text-xs text-muted-foreground mb-1.5"><span className="font-medium text-foreground">Impact:</span> {r.impact}</p>
                )}
                {r?.remediation && (
                  <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Remediation:</span> {r.remediation}</p>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Checklist Items */}
      {checklistItems.length > 0 && (
        <CollapsibleSection title="Compliance Checklist" icon={<HiOutlineClipboardCheck className="w-4 h-4 text-primary" />} count={checklistItems.length}>
          <div className="space-y-1.5">
            {checklistItems.map((item, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-3 p-2.5 rounded-md transition-colors',
                  checkedItems.has(i) ? 'bg-green-50' : 'hover:bg-muted/30'
                )}
              >
                <Checkbox
                  checked={checkedItems.has(i)}
                  onCheckedChange={() => toggleChecked(i)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm', checkedItems.has(i) && 'line-through text-muted-foreground')}>{item?.item ?? ''}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {item?.category && <Badge variant="secondary" className="text-xs">{item.category}</Badge>}
                    {item?.priority && <span className={cn('text-xs font-medium px-1.5 py-0 rounded', getPriorityStyle(item.priority))}>{item.priority}</span>}
                    {item?.status && <span className="text-xs text-muted-foreground">{item.status}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <CollapsibleSection title="Recommendations" icon={<FiCheck className="w-4 h-4 text-primary" />} count={recommendations.length} defaultOpen>
          <ul className="space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold mt-0.5">{i + 1}</span>
                <span className="text-sm text-foreground leading-relaxed">{rec ?? ''}</span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}
    </div>
  )
}
