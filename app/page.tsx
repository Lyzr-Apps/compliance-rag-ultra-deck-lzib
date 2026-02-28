'use client'

import React, { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { FiMenu, FiShield } from 'react-icons/fi'
import Sidebar, { type QueryMode } from './sections/Sidebar'
import ChatArea from './sections/ChatArea'

// ErrorBoundary class component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export default function Page() {
  const [selectedMode, setSelectedMode] = useState<QueryMode>('general')
  const [showSampleData, setShowSampleData] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sessionId, setSessionId] = useState('')

  useEffect(() => {
    setSessionId(generateSessionId())
  }, [])

  return (
    <ErrorBoundary>
      <div className="min-h-screen h-screen flex flex-col bg-background text-foreground">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 lg:px-6 h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <FiMenu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FiShield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-base font-semibold text-foreground leading-tight">Compliance Intelligence Hub</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block leading-none">AI-powered compliance analysis and knowledge management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="sample-toggle"
                  checked={showSampleData}
                  onCheckedChange={setShowSampleData}
                />
                <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
                  Sample Data
                </Label>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex min-h-0">
          <Sidebar
            selectedMode={selectedMode}
            onModeChange={setSelectedMode}
            isMobileOpen={mobileMenuOpen}
            onMobileClose={() => setMobileMenuOpen(false)}
          />
          <main className="flex-1 min-w-0">
            <ChatArea
              selectedMode={selectedMode}
              sessionId={sessionId}
              showSampleData={showSampleData}
            />
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
