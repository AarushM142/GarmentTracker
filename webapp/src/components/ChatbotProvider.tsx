'use client'

import dynamic from 'next/dynamic'

const ERPChatbot = dynamic(() => import('./ERPChatbot'), { ssr: false })

export function ChatbotProvider({ role }: { role: string }) {
  return <ERPChatbot currentRole={role} />
}
