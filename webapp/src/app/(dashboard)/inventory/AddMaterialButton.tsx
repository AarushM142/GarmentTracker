'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AddMaterialModal } from './AddMaterialModal'

export function AddMaterialButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="w-4 h-4" />
        Add Material
      </button>
      {open && <AddMaterialModal onClose={() => setOpen(false)} />}
    </>
  )
}
