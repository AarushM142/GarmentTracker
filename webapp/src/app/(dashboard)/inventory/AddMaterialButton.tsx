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
        className="md:hidden fixed bottom-[88px] right-4 z-50 w-14 h-14 bg-[#2F3E34] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>
      
      {open && <AddMaterialModal onClose={() => setOpen(false)} />}
    </>
  )
}
