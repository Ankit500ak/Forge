'use client';

import { InventoryItem } from '@/lib/app-context'

interface InventoryItemProps {
  item: InventoryItem
  onRedeem?: (item: InventoryItem) => void
}

function InventoryItemCard({ item, onRedeem }: InventoryItemProps) {
  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        item.acquired
          ? 'border-orange-500/50 bg-orange-500/5 shadow-lg shadow-orange-500/20'
          : 'border-gray-600/50 bg-gray-900/30 opacity-70'
      }`}
    >
      <div className="text-4xl mb-3">{item.icon}</div>
      <h3 className="font-bold text-sm text-foreground mb-1">{item.name}</h3>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{item.description}</p>

      <div className="flex items-center justify-between">
        <div>
          {item.category === 'equipment' && (
            <span className="text-xs font-bold text-orange-400">{item.value} pts</span>
          )}
          {item.category === 'achievement' && <span className="text-xs text-yellow-400">Achievement</span>}
        </div>
        <div className="text-xs">
          {item.acquired && <span className="text-green-400">✓ Owned</span>}
          {!item.acquired && (
            <button
              onClick={() => onRedeem?.(item)}
              className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-colors"
            >
              Redeem
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export { InventoryItemCard }
export default InventoryItemCard
