import React from 'react'
import { AuthProvider } from '@/lib/auth-context'
import { AppProvider } from '@/lib/app-context'
import { Analytics } from "@vercel/analytics/next"

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <AppProvider>
        {children}
      </AppProvider>
      <Analytics />
    </AuthProvider>
  )
}

export default AppLayout
