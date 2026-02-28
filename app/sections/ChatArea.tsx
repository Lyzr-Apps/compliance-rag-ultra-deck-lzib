'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import parseLLMJson from '@/lib/jsonParser'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FiSend, FiLoader, FiRefreshCw, FiMessageSquare, FiAlertTriangle } from 'react-icons/fi'
import ResponseCard, { type ParsedComplianceResponse } from './ResponseCard'
import type { QueryMode } from './Sidebar'

const AGENT_ID = '69a2714071a7effa8577bfe0'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  parsedResponse?: ParsedComplianceResponse
  timestamp: Date
  queryMode?: string
  isLoading?: boolean
  error?: string
}

interface ChatAreaProps {
  selectedMode: QueryMode
  sessionId: string
  showSampleData: boolean
}

const MODE_LABELS: Record<QueryMode, string> = {
  'general': 'General Q&A',
  'cross-reference': 'Cross-Reference',
  'gap-analysis': 'Gap Analysis',
  'checklist': 'Checklist',
  'risk-assessment': 'Risk Assessment',
}

const STARTER_QUERIES = [
  'What are the data principal rights under DPDP Act?',
  'Compare ISO 27001 Annex A controls with DPDP Act provisions',
  'Generate a DPDP Act compliance checklist',
  'Assess risks for non-compliance with data protection requirements',
  'Explain the data processor obligations under DPDP Act',
]

const SAMPLE_RESPONSE: ParsedComplianceResponse = {
  summary: 'The Digital Personal Data Protection (DPDP) Act, 2023 establishes comprehensive rights for data principals (individuals whose data is being processed). These rights form the backbone of the Act and are designed to give individuals meaningful control over their personal data.',
  query_type: 'General Q&A',
  citations: [
    { framework: 'DPDP Act 2023', section: 'Section 11', excerpt: 'Every Data Principal shall have the right to obtain from the Data Fiduciary confirmation of processing, a summary of personal data being processed, and the identities of all other Data Fiduciaries with whom the personal data has been shared.', relevance: 'Direct statutory provision for right to information' },
    { framework: 'DPDP Act 2023', section: 'Section 12', excerpt: 'The Data Principal shall have the right to correction, completion, updating of inaccurate or misleading personal data, and erasure of personal data that is no longer necessary for the purpose for which it was processed.', relevance: 'Core correction and erasure rights' },
    { framework: 'ISO 27701', section: 'Annex A.7.3', excerpt: 'The organization should provide a mechanism for data subjects to access, correct, and erase their personal information.', relevance: 'International standard alignment with DPDP rights' },
  ],
  analysis: {
    detailed_explanation: 'The DPDP Act provides six fundamental rights to Data Principals:\n\n**1. Right to Access Information (Section 11)** - Data Principals can request confirmation of whether their data is being processed, obtain a summary of their data, and know which entities it has been shared with.\n\n**2. Right to Correction and Erasure (Section 12)** - Individuals can demand correction of inaccurate data, completion of incomplete data, updating of outdated data, and erasure of data no longer needed.\n\n**3. Right to Grievance Redressal (Section 13)** - Data Fiduciaries must have a grievance mechanism and respond within prescribed timelines.\n\n**4. Right to Nominate (Section 14)** - Data Principals can nominate another individual to exercise their rights in case of death or incapacity.\n\n**5. Right against Automated Decision-Making** - Protection against decisions made solely by automated systems that significantly affect individuals.\n\n**6. Right to Withdraw Consent** - Data Principals may withdraw consent at any time, and the Data Fiduciary must cease processing within a reasonable period.',
    cross_references: [
      { framework_a: 'DPDP Act 2023', framework_b: 'GDPR', overlap: 'Both provide rights to access, rectification, erasure, and data portability. Both require consent as a lawful basis for processing.', unique_to_a: 'Right to nominate is unique to DPDP Act. Specific provisions for children under 18.', unique_to_b: 'Right to data portability explicitly defined. Right to restrict processing. Specific DPO requirements.' },
    ],
    risk_items: [
      { risk: 'Non-compliance with data principal access requests within prescribed timeframe', severity: 'High', impact: 'Penalties up to INR 200 crore per instance. Reputational damage and loss of consumer trust.', remediation: 'Implement automated request tracking system with SLA monitoring. Train staff on response procedures. Establish escalation protocols.' },
      { risk: 'Inadequate grievance redressal mechanism', severity: 'Medium', impact: 'Regulatory scrutiny, potential enforcement actions, and consumer complaints to Data Protection Board.', remediation: 'Deploy dedicated grievance portal. Appoint Data Protection Officer. Create standardized response templates and timelines.' },
    ],
    checklist_items: [
      { item: 'Implement data subject access request (DSAR) portal', category: 'Technology', status: 'Required', priority: 'High' },
      { item: 'Create privacy notice in clear, plain language', category: 'Documentation', status: 'Required', priority: 'High' },
      { item: 'Establish grievance redressal mechanism', category: 'Process', status: 'Required', priority: 'High' },
      { item: 'Implement consent management platform', category: 'Technology', status: 'Required', priority: 'Medium' },
      { item: 'Train all data-handling staff on DPDP obligations', category: 'Training', status: 'Recommended', priority: 'Medium' },
    ],
  },
  recommendations: [
    'Conduct a comprehensive data mapping exercise to identify all personal data processing activities and their legal basis under the DPDP Act.',
    'Implement a robust consent management platform that captures, stores, and manages consent with full audit trails.',
    'Establish clear internal SLAs for responding to data principal requests, well within the statutory timelines.',
    'Engage legal counsel to review existing privacy policies and update them to align with DPDP Act requirements.',
    'Set up regular compliance audits (quarterly) to ensure ongoing adherence to data principal rights obligations.',
  ],
}

function parseAgentResponse(result: any): ParsedComplianceResponse | null {
  let parsed: any = result?.response?.result

  if (typeof parsed === 'string') {
    parsed = parseLLMJson(parsed)
  }

  if (parsed && typeof parsed === 'object') {
    if (parsed.result && typeof parsed.result === 'object' && !Array.isArray(parsed.result)) {
      parsed = parsed.result
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    const text = result?.response?.result?.text ?? result?.response?.message ?? ''
    if (text) {
      return {
        summary: typeof text === 'string' ? text : String(text),
        query_type: '',
        citations: [],
        analysis: { detailed_explanation: '', cross_references: [], risk_items: [], checklist_items: [] },
        recommendations: [],
      }
    }
    return null
  }

  return {
    summary: parsed?.summary ?? '',
    query_type: parsed?.query_type ?? '',
    citations: Array.isArray(parsed?.citations) ? parsed.citations : [],
    analysis: {
      detailed_explanation: parsed?.analysis?.detailed_explanation ?? '',
      cross_references: Array.isArray(parsed?.analysis?.cross_references) ? parsed.analysis.cross_references : [],
      risk_items: Array.isArray(parsed?.analysis?.risk_items) ? parsed.analysis.risk_items : [],
      checklist_items: Array.isArray(parsed?.analysis?.checklist_items) ? parsed.analysis.checklist_items : [],
    },
    recommendations: Array.isArray(parsed?.recommendations) ? parsed.recommendations : [],
  }
}

export default function ChatArea({ selectedMode, sessionId, showSampleData }: ChatAreaProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (showSampleData && messages.length === 0) {
      setMessages([
        {
          id: 'sample-user',
          role: 'user',
          content: 'What are the data principal rights under DPDP Act?',
          queryMode: 'General Q&A',
          timestamp: new Date(),
        },
        {
          id: 'sample-assistant',
          role: 'assistant',
          content: '',
          parsedResponse: SAMPLE_RESPONSE,
          queryMode: 'General Q&A',
          timestamp: new Date(),
        },
      ])
    } else if (!showSampleData && messages.length > 0 && messages[0]?.id === 'sample-user') {
      setMessages([])
    }
  }, [showSampleData])

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    const modePrefix = selectedMode !== 'general' ? `[Query Mode: ${MODE_LABELS[selectedMode]}] ` : ''
    const fullMessage = `${modePrefix}${messageText.trim()}`

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      queryMode: MODE_LABELS[selectedMode],
      timestamp: new Date(),
    }

    const loadingMsg: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      isLoading: true,
      timestamp: new Date(),
    }

    setMessages(prev => {
      const filtered = prev.filter(m => m.id !== 'sample-user' && m.id !== 'sample-assistant')
      return [...filtered, userMsg, loadingMsg]
    })
    setInputValue('')
    setIsLoading(true)

    try {
      const result = await callAIAgent(fullMessage, AGENT_ID, { session_id: sessionId })

      if (result.success) {
        const parsed = parseAgentResponse(result)
        setMessages(prev => prev.map(m =>
          m.id === loadingMsg.id
            ? { ...m, isLoading: false, parsedResponse: parsed ?? undefined, content: parsed?.summary ?? 'Response received.' }
            : m
        ))
      } else {
        setMessages(prev => prev.map(m =>
          m.id === loadingMsg.id
            ? { ...m, isLoading: false, error: result.error ?? 'Failed to get response from agent.' }
            : m
        ))
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === loadingMsg.id
          ? { ...m, isLoading: false, error: 'Network error. Please try again.' }
          : m
      ))
    }
    setIsLoading(false)
  }, [isLoading, selectedMode, sessionId])

  const handleRetry = (msgId: string) => {
    const idx = messages.findIndex(m => m.id === msgId)
    if (idx <= 0) return
    const userMsg = messages[idx - 1]
    if (userMsg?.role === 'user') {
      setMessages(prev => prev.filter(m => m.id !== msgId))
      sendMessage(userMsg.content)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputValue)
    }
  }

  const handleStarterQuery = (query: string) => {
    setInputValue(query)
    sendMessage(query)
  }

  const isEmptyState = messages.length === 0

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Chat Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {isEmptyState ? (
          <div className="flex flex-col items-center justify-center h-full px-6 py-12">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <FiMessageSquare className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-serif font-semibold text-foreground mb-2 text-center">Compliance Intelligence Hub</h2>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-8">Ask questions about compliance frameworks, generate checklists, compare regulations, or assess risks. Your queries are analyzed by specialized sub-agents for comprehensive responses.</p>
            <div className="w-full max-w-lg space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Try asking</p>
              {STARTER_QUERIES.map((query, i) => (
                <button
                  key={i}
                  onClick={() => handleStarterQuery(query)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-border/50 bg-card hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 text-sm text-foreground group"
                >
                  <span className="group-hover:text-primary transition-colors">{query}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'user' ? (
                  <div className="max-w-[85%]">
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3">
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                    {msg.queryMode && (
                      <p className="text-xs text-muted-foreground mt-1 text-right">{msg.queryMode}</p>
                    )}
                  </div>
                ) : (
                  <div className="w-full">
                    {msg.isLoading ? (
                      <div className="bg-card border border-border/50 rounded-2xl rounded-bl-md p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <FiLoader className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Analyzing compliance documents...</span>
                        </div>
                        <div className="space-y-3">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-5/6" />
                          <Skeleton className="h-4 w-4/6" />
                          <div className="pt-2">
                            <Skeleton className="h-20 w-full rounded-lg" />
                          </div>
                        </div>
                      </div>
                    ) : msg.error ? (
                      <div className="bg-card border border-destructive/30 rounded-2xl rounded-bl-md p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <FiAlertTriangle className="w-4 h-4 text-destructive" />
                          <span className="text-sm font-medium text-destructive">Error</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{msg.error}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetry(msg.id)}
                          className="text-xs"
                        >
                          <FiRefreshCw className="w-3 h-3 mr-1.5" />
                          Retry
                        </Button>
                      </div>
                    ) : msg.parsedResponse ? (
                      <div className="bg-card border border-border/50 rounded-2xl rounded-bl-md p-5 shadow-sm">
                        <ResponseCard data={msg.parsedResponse} />
                      </div>
                    ) : (
                      <div className="bg-card border border-border/50 rounded-2xl rounded-bl-md p-4 shadow-sm">
                        <p className="text-sm text-foreground">{msg.content}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="border-t border-border/50 bg-card/50 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about compliance requirements..."
                disabled={isLoading}
                rows={1}
                className="w-full resize-none rounded-xl border border-border/60 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 placeholder:text-muted-foreground disabled:opacity-50 min-h-[44px] max-h-[120px]"
              />
            </div>
            <Button
              onClick={() => sendMessage(inputValue)}
              disabled={isLoading || !inputValue.trim()}
              className="rounded-xl h-[44px] px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              {isLoading ? (
                <FiLoader className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <FiSend className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline text-sm">Ask</span>
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Mode: <span className="font-medium">{MODE_LABELS[selectedMode]}</span> -- Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
