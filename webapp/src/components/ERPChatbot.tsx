'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generatePurchaseRequest } from '@/app/(dashboard)/inventory/actions'
import { addStock } from '@/app/(dashboard)/inventory/actions'
import { updatePOStatus } from '@/app/(dashboard)/floor/actions'
import { logPayment } from '@/app/(dashboard)/accounts/actions'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type Language = 'english' | 'hindi' | 'marathi'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ActionPayload {
  action: string
  params: Record<string, unknown>
}

export interface ERPChatbotProps {
  currentRole: string
}

// ── i18n strings ──────────────────────────────────────────────────────────────

const i18n = {
  english: {
    title: 'Operations Assistant',
    welcome: "Hi! I'm your copilot. How can I assist with production today?",
    placeholder: 'Ask something...',
    thinking: 'Analyzing data...',
    offline: "⚠️ Assistant offline. Internet required.",
    error: 'Error occurred. Please retry.',
    confirmLabel: (action: string) => `Execute: ${action}?`,
    confirm: 'Confirm',
    cancel: 'Cancel',
    actionDone: '✅ Action completed.',
    actionCancelled: '❌ Cancelled.',
  },
  hindi: {
    title: 'ऑपरेशंस असिस्टेंट',
    welcome: 'नमस्ते! मैं आपका को-पायलट हूँ। आज मैं उत्पादन में कैसे मदद कर सकता हूँ?',
    placeholder: 'कुछ पूछें...',
    thinking: 'डेटा का विश्लेषण...',
    offline: '⚠️ इंटरनेट कनेक्शन नहीं है।',
    error: 'त्रुटि हुई। फिर प्रयास करें।',
    confirmLabel: (action: string) => `निष्पादित करें: ${action}?`,
    confirm: 'पुष्टि करें',
    cancel: 'रद्द करें',
    actionDone: '✅ कार्य पूर्ण हुआ।',
    actionCancelled: '❌ रद्द किया गया।',
  },
  marathi: {
    title: 'ऑपरेशन्स असिस्टंट',
    welcome: 'नमस्कार! मी तुमचा को-पायलट आहे. आज उत्पादनात कशी मदत करू शकतो?',
    placeholder: 'काहीतरी विचारा...',
    thinking: 'डेटा विश्लेषण करत आहे...',
    offline: '⚠️ इंटरनेट कनेक्शन नाही.',
    error: 'त्रुटि आली. पुन्हा प्रयत्न करा.',
    confirmLabel: (action: string) => `अंमलबजावणी करा: ${action}?`,
    confirm: 'पुष्टी करा',
    cancel: 'रद्द करा',
    actionDone: '✅ कार्य पूर्ण झाले.',
    actionCancelled: '❌ रद्द केले.',
  },
}

// ── Quick prompts with Icons ──────────────────────────────────────────────────

const quickPrompts: Record<string, Record<Language, { label: string; icon: string }[]>> = {
  store_manager: {
    english: [
      { label: 'Check low stock', icon: '📦' },
      { label: 'Pending PRs', icon: '⚠' },
      { label: 'Stock summary', icon: '📈' },
    ],
    hindi: [
      { label: 'कम स्टॉक दिखाओ', icon: '📦' },
      { label: 'बाकी PR दिखाओ', icon: '⚠' },
      { label: 'स्टॉक सारांश', icon: '📈' },
    ],
    marathi: [
      { label: 'कमी साठा दाखवा', icon: '📦' },
      { label: 'बाकी PR दाखवा', icon: '⚠' },
      { label: 'साठा सारांश', icon: '📈' },
    ],
  },
  cutting_master: {
    english: [
      { label: 'Orders for cutting', icon: '🧵' },
      { label: 'My active orders', icon: '📋' },
    ],
    hindi: [
      { label: 'कटाई के ऑर्डर', icon: '🧵' },
      { label: 'मेरे सक्रिय ऑर्डर', icon: '📋' },
    ],
    marathi: [
      { label: 'कापणीसाठी ऑर्डर', icon: '🧵' },
      { label: 'माझे सक्रिय ऑर्डर', icon: '📋' },
    ],
  },
  production_supervisor: {
    english: [
      { label: 'Production Summary', icon: '📊' },
      { label: 'QC Failures', icon: '⚠' },
      { label: 'Stuck orders', icon: '⌛' },
    ],
    hindi: [
      { label: 'उत्पादन सारांश', icon: '📊' },
      { label: 'QC फेलियर', icon: '⚠' },
      { label: 'अटके ऑर्डर', icon: '⌛' },
    ],
    marathi: [
      { label: 'उत्पादन सारांश', icon: '📊' },
      { label: 'QC फेलियर', icon: '⚠' },
      { label: 'अडकलेले ऑर्डर', icon: '⌛' },
    ],
  },
  accounts_manager: {
    english: [
      { label: 'Payment Gaps', icon: '💳' },
      { label: 'Ready for Dispatch', icon: '🚚' },
      { label: 'Receivables', icon: '💰' },
    ],
    hindi: [
      { label: 'पेमेंट गैप्स', icon: '💳' },
      { label: 'डिस्पैच के लिए तैयार', icon: '🚚' },
      { label: 'प्राप्य राशि', icon: '💰' },
    ],
    marathi: [
      { label: 'पेमेंट गॅप्स', icon: '💳' },
      { label: 'पाठवण्यासाठी तयार', icon: '🚚' },
      { label: 'येणी रक्कम', icon: '💰' },
    ],
  },
  director: {
    english: [
      { label: 'Today Summary', icon: '📊' },
      { label: 'Bottlenecks', icon: '⚠' },
      { label: 'Payment Gaps', icon: '💳' },
      { label: 'Inventory Risk', icon: '🧵' },
    ],
    hindi: [
      { label: 'आज का सारांश', icon: '📊' },
      { label: 'रुकावटें', icon: '⚠' },
      { label: 'पेमेंट गैप्स', icon: '💳' },
      { label: 'स्टॉक जोखिम', icon: '🧵' },
    ],
    marathi: [
      { label: 'आजचा सारांश', icon: '📊' },
      { label: 'अडथळे', icon: '⚠' },
      { label: 'पेमेंट गॅप्स', icon: '💳' },
      { label: 'साठा जोखीम', icon: '🧵' },
    ],
  },
  super_admin: {
    english: [
      { label: 'Today Summary', icon: '📊' },
      { label: 'Bottlenecks', icon: '⚠' },
      { label: 'Payment Gaps', icon: '💳' },
      { label: 'Inventory Risk', icon: '🧵' },
    ],
    hindi: [
      { label: 'आज का सारांश', icon: '📊' },
      { label: 'रुकावटें', icon: '⚠' },
      { label: 'पेमेंट गैप्स', icon: '💳' },
      { label: 'स्टॉक जोखिम', icon: '🧵' },
    ],
    marathi: [
      { label: 'आजचा सारांश', icon: '📊' },
      { label: 'अडथळे', icon: '⚠' },
      { label: 'पेमेंट गॅप्स', icon: '💳' },
      { label: 'साठा जोखीम', icon: '🧵' },
    ],
  },
}

function getQuickPrompts(role: string, lang: Language) {
  return quickPrompts[role]?.[lang] ?? quickPrompts['director'][lang]
}

// ── Action descriptions ───────────────────────────────────────────────────────

function describeAction(payload: ActionPayload): string {
  const { action, params } = payload
  switch (action) {
    case 'GENERATE_PR':
      return `PR for ${params.materialId ?? 'item'} (${params.requestedQty ?? '?'})`
    case 'ADD_STOCK':
      return `Add ${params.addedQty ?? '?'} to ${params.materialId ?? 'item'}`
    case 'ISSUE_TO_FLOOR':
      return `Issue floor for PO ${params.poId ?? '?'}`
    case 'UPDATE_PO_STATUS':
      return `Update PO ${params.id ?? '?'} to ${params.status ?? '?'}`
    case 'LOG_PAYMENT':
      return `Log ₹${params.amount ?? '?'} for PO ${params.orderId ?? '?'}`
    default:
      return action
  }
}

// ── Action executor ───────────────────────────────────────────────────────────

async function executeAction(payload: ActionPayload): Promise<{ success?: boolean; error?: string }> {
  const { action, params } = payload

  switch (action) {
    case 'GENERATE_PR':
      return generatePurchaseRequest(params.materialId as string, params.requestedQty as number)
    case 'ADD_STOCK':
      return addStock(params.materialId as string, params.addedQty as number)
    case 'ISSUE_TO_FLOOR':
      return updatePOStatus(params.poId as string, 'material_released')
    case 'UPDATE_PO_STATUS':
      return updatePOStatus(params.id as string, params.status as string)
    case 'LOG_PAYMENT': {
      const fd = new FormData()
      fd.set('orderId', String(params.orderId ?? ''))
      fd.set('amount', String(params.amount ?? '0'))
      fd.set('note', String(params.note ?? ''))
      return logPayment(fd)
    }
    default:
      return { error: `Unknown action: ${action}` }
  }
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ERPChatbot({ currentRole }: ERPChatbotProps) {
  const [open, setOpen] = useState(false)
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gt_chat_lang') as Language | null
      if (saved && ['english', 'hindi', 'marathi'].includes(saved)) return saved
    }
    return 'english'
  })

  const [messages, setMessages] = useState<Message[]>(() => {
    let lang: Language = 'english'
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gt_chat_lang') as Language | null
      if (saved && ['english', 'hindi', 'marathi'].includes(saved)) lang = saved
    }
    return [{
      role: 'assistant',
      content: i18n[lang].welcome,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingAction, setPendingAction] = useState<ActionPayload | null>(null)

  const isMobile = useMediaQuery('(max-width: 768px)')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const t = i18n[language]

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  const switchLanguage = useCallback((lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('gt_chat_lang', lang)
    setMessages([{
      role: 'assistant',
      content: i18n[lang].welcome,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }])
  }, [])



  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      if (!navigator.onLine) {
        setMessages((prev) => [
          ...prev,
          { role: 'user', content: trimmed, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          { role: 'assistant', content: t.offline, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ])
        return
      }

      const userMsg: Message = {
        role: 'user',
        content: trimmed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      const nextMessages = [...messages, userMsg]
      setMessages(nextMessages)
      setInput('')
      setLoading(true)

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            role: currentRole,
            language,
            conversationHistory: nextMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          }),
        })

        if (!res.ok) throw new Error('fetch failed')

        const data: { reply: string } = await res.json()
        const reply = data.reply?.trim() ?? ''

        let parsed: ActionPayload | null = null
        if (reply.startsWith('{')) {
          try {
            const candidate = JSON.parse(reply)
            if (candidate && typeof candidate.action === 'string') {
              parsed = candidate as ActionPayload
            }
          } catch {
            // Not JSON
          }
        }

        if (parsed) {
          setPendingAction(parsed)
        } else {
          setMessages((prev) => [...prev, {
            role: 'assistant',
            content: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }])
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: t.error,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [currentRole, language, loading, messages, t]
  )

  const handleSend = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      sendMessage(input)
    }, 400)
  }, [input, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend()
  }

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt)
    sendMessage(prompt)
  }

  const handleConfirmAction = async () => {
    if (!pendingAction) return
    const action = pendingAction
    setPendingAction(null)
    setLoading(true)
    try {
      const result = await executeAction(action)
      if (result?.error) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `❌ Error: ${result.error}`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: t.actionDone, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t.error, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleCancelAction = () => {
    setPendingAction(null)
    setMessages((prev) => [...prev, { role: 'assistant', content: t.actionCancelled, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
  }

  const prompts = getQuickPrompts(currentRole, language)
  const showQuickPrompts = messages.length <= 1

  return (
    <>
      {/* Background Dim Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/10 z-[140] backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) */}
      {!open && (
        <motion.button
          layoutId="chatbot-main"
          id="erp-chatbot-toggle"
          onClick={() => setOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "fixed z-[150] w-16 h-16 rounded-full shadow-2xl flex items-center justify-center bg-gradient-to-br from-[#5E6F52] to-[#4A5D40] text-white group cursor-pointer",
            isMobile ? "bottom-[168px] right-6" : "bottom-6 right-6"
          )}
        >
          {/* Animated Glow */}
          <div className="absolute inset-0 rounded-full bg-[#5E6F52]/30 blur-xl animate-pulse scale-110" />

          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>

          {/* Tooltip (Desktop only) */}
          {!isMobile && (
            <div className="absolute right-full mr-4 px-3 py-2 bg-white text-[#1A1A1A] text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-[#E7E5DF]">
              Operations Assistant
            </div>
          )}
        </motion.button>
      )}

      {/* Assistant Panel / Bottom Sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="chatbot-main"
            className={cn(
              "fixed z-[150] flex flex-col overflow-hidden",
              isMobile
                ? "inset-x-0 bottom-0 h-[85vh] rounded-t-[32px] bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.15)]"
                : "right-0 top-0 bottom-0 w-[400px] m-4 rounded-[24px] bg-[#FAFAF7] border border-[#E7E5DF] shadow-2xl"
            )}
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Mobile Drag Handle */}
            {isMobile && (
              <div className="w-full flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 rounded-full bg-gray-200" />
              </div>
            )}

            <div className="flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 bg-white border-b border-[#E7E5DF] flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#15803D] relative">
                      <div className="absolute inset-0 rounded-full bg-[#15803D] animate-ping opacity-75" />
                    </div>
                    <h3 className="font-heading text-base text-[#1A1A1A] tracking-tight">{t.title}</h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mt-0.5">
                    {currentRole.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setOpen(false)}
                    className="p-2 hover:bg-black/5 rounded-lg transition-colors text-[#6B7280]"
                    title="Minimize"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Language Tabs */}
              <div className="flex px-6 pt-4 gap-2 bg-inherit">
                {(['english', 'hindi', 'marathi'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => switchLanguage(lang)}
                    className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-all ${language === lang
                        ? 'bg-[#5E6F52] text-white shadow-sm'
                        : 'bg-[#E7E5DF]/50 text-[#6B7280] hover:bg-[#E7E5DF]'
                      }`}
                  >
                    {lang === 'english' ? 'EN' : lang === 'hindi' ? 'हिन्दी' : 'मराठी'}
                  </button>
                ))}
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 sidebar-scroll bg-inherit">
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[90%] px-4 py-3 rounded-[18px] text-[13px] leading-relaxed shadow-sm transition-all ${msg.role === 'user'
                            ? 'bg-[#5E6F52] text-white rounded-tr-none'
                            : 'bg-white text-[#1A1A1A] border border-[#E7E5DF] rounded-tl-none'
                          }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-[#6B7280] opacity-40 font-bold mt-1.5 uppercase">
                        {msg.timestamp}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-[#6B7280] text-[11px] font-bold"
                  >
                    <div className="flex gap-1">
                      <div className="w-1 h-1 rounded-full bg-[#5E6F52] animate-bounce" />
                      <div className="w-1 h-1 rounded-full bg-[#5E6F52] animate-bounce delay-75" />
                      <div className="w-1 h-1 rounded-full bg-[#5E6F52] animate-bounce delay-150" />
                    </div>
                    {t.thinking}
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <AnimatePresence>
                {showQuickPrompts && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="px-6 pb-4 bg-inherit"
                  >
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                      {prompts.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickPrompt(p.label)}
                          className="flex-none flex items-center gap-2 bg-white hover:bg-white/80 border border-[#E7E5DF] rounded-full px-4 py-2 text-[11px] font-bold text-[#1A1A1A] transition-all hover:shadow-md active:scale-95 shadow-sm"
                        >
                          <span className="text-base leading-none">{p.icon}</span>
                          <span className="whitespace-nowrap">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Area */}
              <div className={cn(
                "p-4 bg-white border-t border-[#E7E5DF]",
                isMobile && "pb-safe-offset-4"
              )}>
                <div className="flex items-center gap-2 p-1.5 bg-[#FAFAF7] rounded-[20px] border border-[#E7E5DF] focus-within:ring-2 focus-within:ring-[#5E6F52]/20 focus-within:border-[#5E6F52] transition-all">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    placeholder={t.placeholder}
                    className="flex-1 bg-transparent text-[13px] px-4 py-2 focus:outline-none placeholder:text-[#6B7280]/50 text-[#1A1A1A]"
                  />
                  <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="w-10 h-10 rounded-[16px] flex items-center justify-center bg-[#5E6F52] text-white hover:bg-[#4A5D40] transition-all disabled:opacity-20 active:scale-90"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Confirmation Overlay */}
              <AnimatePresence>
                {pendingAction && (
                  <motion.div
                    initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                    animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
                    exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                    className="absolute inset-0 bg-white/60 z-[160] flex items-center justify-center p-8 rounded-inherit"
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white p-6 rounded-[24px] shadow-2xl border border-[#E7E5DF] w-full max-w-xs flex flex-col items-center"
                    >
                      <div className="w-12 h-12 bg-[#5E6F52]/10 text-[#5E6F52] rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h4 className="font-heading text-base text-[#1A1A1A] mb-2 text-center">Execute Action?</h4>
                      <p className="text-[12px] text-[#6B7280] text-center mb-6 leading-relaxed">
                        {t.confirmLabel(describeAction(pendingAction))}
                      </p>
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={handleCancelAction}
                          className="flex-1 py-2 text-[11px] font-bold text-[#6B7280] hover:bg-[#FAFAF7] rounded-xl border border-[#E7E5DF] transition-all"
                        >
                          {t.cancel}
                        </button>
                        <button
                          onClick={handleConfirmAction}
                          className="flex-1 py-2 text-[11px] font-bold text-white bg-[#5E6F52] hover:bg-[#4A5D40] rounded-xl transition-all shadow-lg shadow-[#5E6F52]/20"
                        >
                          {t.confirm}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .pb-safe-offset-4 {
          padding-bottom: calc(env(safe-area-inset-bottom) + 1rem);
        }
      `}</style>
    </>
  )
}
