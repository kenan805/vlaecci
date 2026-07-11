'use client'

import { MessageCircle } from 'lucide-react'

export function WhatsAppButton() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+994557087999'
  const encodedNumber = whatsappNumber.replace(/\D/g, '')
  const message = encodeURIComponent('Salam! VLAECCI haqqında məlumat almaq istəyirəm.')

  return (
    <a
      href={`https://wa.me/${encodedNumber}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      aria-label="WhatsApp ilə əlaqə"
    >
      <MessageCircle size={28} />
    </a>
  )
}
