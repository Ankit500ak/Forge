import React from 'react'
import { AuthProvider } from '@/lib/auth-context'
import { AppProvider } from '@/lib/app-context'

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <AppProvider>
        {children}
      </AppProvider>
    </AuthProvider>
  )
}

export default AppLayout
