'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AddMaterialModal } from './AddMaterialModal'

import { Button } from '@/components/ui/button'

export function AddMaterialButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="hidden md:block">
        <Button onClick={() => setOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Add Material
        </Button>
      </div>

      <button 
        onClick={() => setOpen(true)}
        aria-label="Add new material"
        className="md:hidden fixed bottom-[88px] right-4 z-50 w-14 h-14 bg-[#2F3E34] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>
      
      {open && <AddMaterialModal onClose={() => setOpen(false)} />}
    </>
  )
}
