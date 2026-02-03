'use client'

import { useAuth } from '@/lib/auth-context'
import { useAppContext } from '@/lib/app-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navigation from '@/components/navigation'
import InventoryItemCard from '@/components/inventory-item-card' // Import InventoryItemCard

export default function InventoryPage() {
  const { user } = useAuth()
  const { inventory, unlockItem } = useAppContext()
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'equipment' | 'achievement'>('all')

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  if (!user) {
    return null
  }

  const filteredInventory = inventory.filter(item => {
    if (filter === 'all') return true
    return item.category === filter
  })

  const acquiredCount = inventory.filter(i => i.acquired).length

  const handleRedeem = (item: any) => {
    if ((user.statPoints ?? 0) >= item.value) {
      unlockItem(item.id)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation />
      <main className="overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-card/95 to-card/50 backdrop-blur-sm border-b-2 border-orange-600/50 p-4 z-10">
          <h1 className="text-2xl font-bold text-orange-500">Inventory</h1>
          <p className="text-muted-foreground text-xs mt-1">{acquiredCount}/{inventory.length} items</p>
        </div>

        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-orange-500 mb-2">Inventory</h1>
            <p className="text-muted-foreground">Equip yourself with legendary gear</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-orange-500/50 rounded-lg p-4 text-center shadow-lg shadow-orange-500/10">
              <p className="text-muted-foreground text-sm mb-1">TOTAL ITEMS</p>
              <p className="text-3xl font-bold text-orange-400">{inventory.length}</p>
            </div>
            <div className="bg-card border border-green-500/50 rounded-lg p-4 text-center shadow-lg shadow-green-500/10">
              <p className="text-muted-foreground text-sm mb-1">OWNED</p>
              <p className="text-3xl font-bold text-green-400">{acquiredCount}</p>
            </div>
            <div className="bg-card border border-yellow-500/50 rounded-lg p-4 text-center shadow-lg shadow-yellow-500/10">
              <p className="text-muted-foreground text-sm mb-1">AVAILABLE</p>
              <p className="text-3xl font-bold text-yellow-400">{inventory.length - acquiredCount}</p>
            </div>
            <div className="bg-card border border-purple-500/50 rounded-lg p-4 text-center shadow-lg shadow-purple-500/10">
              <p className="text-muted-foreground text-sm mb-1">STAT POINTS</p>
              <p className="text-3xl font-bold text-purple-400">{user.statPoints}</p>
            </div>
          </div>

          {/* Filter */}
          <div className="mb-6 flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/50'
                  : 'bg-card border border-orange-500/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setFilter('equipment')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'equipment'
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/50'
                  : 'bg-card border border-orange-500/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              Equipment
            </button>
            <button
              onClick={() => setFilter('achievement')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'achievement'
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/50'
                  : 'bg-card border border-orange-500/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              Achievements
            </button>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredInventory.map(item => (
              <InventoryItemCard
                key={item.id}
                item={item}
                onRedeem={handleRedeem}
              />
            ))}
          </div>

          {filteredInventory.length === 0 && (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">🏜️</p>
              <p className="text-muted-foreground">No items found in this category</p>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-12 bg-blue-900/20 border border-blue-500/50 rounded-lg p-6">
            <h3 className="font-bold text-blue-400 mb-2">💡 How to Get Items</h3>
            <ul className="text-muted-foreground text-sm space-y-2">
              <li>• <span className="text-orange-400">Log Workouts:</span> Earn stat points for each completed workout</li>
              <li>• <span className="text-orange-400">Achieve Goals:</span> Hit milestones to unlock achievements</li>
              <li>• <span className="text-orange-400">Redeem Points:</span> Use your stat points to equip legendary gear</li>
              <li>• <span className="text-orange-400">Climb Ranks:</span> Increase your rank to unlock exclusive items</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
