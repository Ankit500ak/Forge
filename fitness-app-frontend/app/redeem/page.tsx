'use client'

import { useAuth } from '@/lib/auth-context'
import { useAppContext } from '@/lib/app-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navigation from '@/components/navigation'

export default function RedeemPage() {
  const { user } = useAuth()
  const { inventory, unlockItem } = useAppContext()
  const router = useRouter()
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [redeemHistory, setRedeemHistory] = useState<Array<{ id: string; name: string; date: string }>>([])

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  if (!user) {
    return null
  }

  const availableItems = inventory.filter(item => !item.acquired && item.category === 'equipment')
  const selectedItemData = selectedItem ? inventory.find(i => i.id === selectedItem) : null

  const handleRedeem = () => {
    if (!selectedItemData || (user.statPoints ?? 0) < selectedItemData.value) return

    unlockItem(selectedItem!)
    setRedeemHistory(prev => [
      ...prev,
      {
        id: selectedItemData.id,
        name: selectedItemData.name,
        date: new Date().toLocaleDateString(),
      },
    ])
    setSelectedItem(null)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation />
      <main className="overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-card/95 to-card/50 backdrop-blur-sm border-b-2 border-orange-600/50 p-4 z-10">
          <h1 className="text-2xl font-bold text-orange-500">Redemption</h1>
          <p className="text-muted-foreground text-xs mt-1">Spend stat points for gear</p>
        </div>

        <div className="p-4 space-y-4">
          {/* Balance Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-orange-500 mb-2">Stat Points Redemption</h1>
            <p className="text-muted-foreground">Convert your hard-earned stat points into legendary gear</p>
          </div>

          {/* Current Balance */}
          <div className="mb-8 bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/50 rounded-lg p-6 shadow-lg shadow-orange-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Your Stat Points Balance</p>
                <h2 className="text-5xl font-bold text-orange-400">{user.statPoints.toLocaleString()}</h2>
              </div>
              <div className="text-6xl">💎</div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Available Items */}
            <div className="md:col-span-2">
              <h2 className="text-2xl font-bold text-orange-400 mb-4">Available Gear</h2>
              <div className="space-y-4">
                {availableItems.length === 0 ? (
                  <div className="text-center py-12 bg-card border border-orange-500/30 rounded-lg">
                    <p className="text-3xl mb-2">✨</p>
                    <p className="text-muted-foreground">You own all available equipment!</p>
                  </div>
                ) : (
                  availableItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item.id)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        selectedItem === item.id
                          ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/30'
                          : 'border-orange-500/30 bg-card hover:border-orange-500/50 hover:bg-orange-500/5'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{item.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-orange-400">{item.value}</p>
                          <p className="text-xs text-muted-foreground">stat points</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Summary & Redeem */}
            <div>
              <div className="bg-card border border-orange-500/50 rounded-lg p-6 shadow-lg shadow-orange-500/20 sticky top-6">
                <h3 className="text-lg font-bold mb-4">Redemption Summary</h3>

                {selectedItemData ? (
                  <>
                    <div className="mb-6 text-center pb-6 border-b border-border">
                      <div className="text-6xl mb-3">{selectedItemData.icon}</div>
                      <h4 className="font-bold text-lg mb-1">{selectedItemData.name}</h4>
                      <p className="text-sm text-muted-foreground">{selectedItemData.description}</p>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Item Cost</span>
                        <span className="font-bold text-orange-400">{selectedItemData.value}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Your Balance</span>
                        <span className={`font-bold ${user.statPoints >= selectedItemData.value ? 'text-green-400' : 'text-red-400'}`}>
                          {user.statPoints}
                        </span>
                      </div>
                      {user.statPoints < selectedItemData.value && (
                        <div className="text-xs text-red-400 pt-2 border-t border-border">
                          You need {selectedItemData.value - user.statPoints} more stat points
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleRedeem}
                      disabled={user.statPoints < selectedItemData.value}
                      className={`w-full py-3 rounded-lg font-bold transition-colors ${
                        user.statPoints >= selectedItemData.value
                          ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/50'
                          : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {user.statPoints >= selectedItemData.value ? 'Redeem Now' : 'Insufficient Points'}
                    </button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-3xl mb-2">👈</p>
                    <p className="text-muted-foreground text-sm">Select an item to redeem</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Redeem History */}
          {redeemHistory.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-orange-400 mb-4">Redemption History</h2>
              <div className="bg-card border border-orange-500/30 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between text-sm font-semibold text-muted-foreground">
                  <span>Item</span>
                  <span>Date</span>
                </div>
                {redeemHistory.map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-4 border-b border-border last:border-b-0 flex items-center justify-between hover:bg-orange-500/5 transition-colors"
                  >
                    <span className="font-medium">{entry.name}</span>
                    <span className="text-muted-foreground text-sm">{entry.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-6">
              <h3 className="font-bold text-blue-400 mb-3">💡 Earning Stat Points</h3>
              <ul className="text-muted-foreground text-sm space-y-2">
                <li>• Complete strength workouts: +50 points</li>
                <li>• Complete cardio sessions: +30 points</li>
                <li>• Reach personal records: +100 points</li>
                <li>• Consecutive workout days: +10 bonus points</li>
                <li>• Level up: +500 points</li>
              </ul>
            </div>

            <div className="bg-purple-900/20 border border-purple-500/50 rounded-lg p-6">
              <h3 className="font-bold text-purple-400 mb-3">⚙️ Blockchain Vault</h3>
              <p className="text-muted-foreground text-sm mb-3">
                Your stat points are securely stored on the blockchain. Convert them to cryptocurrency anytime.
              </p>
              <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                Connect Wallet & Convert
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
