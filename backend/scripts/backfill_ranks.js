#!/usr/bin/env node
import { supabase } from '../config/supabase.js'
import { getRankForXp } from '../utils/rank.js'

async function main() {
  console.log('Starting rank backfill...')

  // Fetch all user_progression rows with user_id and total_xp
  const { data, error } = await supabase.from('user_progression').select('user_id,total_xp')
  if (error) {
    console.error('Failed to fetch progression rows:', error.message)
    process.exit(1)
  }

  if (!data || data.length === 0) {
    console.log('No progression rows found.')
    process.exit(0)
  }

  let updated = 0
  for (const row of data) {
    try {
      const uid = row.user_id
      const total = Number(row.total_xp || 0)
      const rank = getRankForXp(total)

      const { data: res, error: upErr } = await supabase
        .from('user_progression')
        .update({ rank })
        .eq('user_id', uid)
        .select()
        .maybeSingle()

      if (upErr) {
        console.error(`Failed to update ${uid}:`, upErr.message)
        continue
      }
      updated++
    } catch (e) {
      console.error('Row update error:', e.message || e)
    }
  }

  console.log(`Backfill complete. Updated ${updated} rows.`)
  process.exit(0)
}

main()
