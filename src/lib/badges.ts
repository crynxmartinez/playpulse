// Badge definitions for tester engagement system

export interface Badge {
  id: string
  name: string
  description: string
  icon: string // Emoji or icon name
  requirement: {
    type: 'tests_completed' | 'games_helped' | 'xp_earned' | 'early_adopter' | 'streak'
    value: number
  }
  xpReward: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}

export const BADGES: Badge[] = [
  // Tests completed badges
  {
    id: 'first_test',
    name: 'First Steps',
    description: 'Complete your first playtest',
    icon: '🎮',
    requirement: { type: 'tests_completed', value: 1 },
    xpReward: 25,
    rarity: 'common',
  },
  {
    id: 'tester_5',
    name: 'Helpful Tester',
    description: 'Complete 5 playtests',
    icon: '⭐',
    requirement: { type: 'tests_completed', value: 5 },
    xpReward: 50,
    rarity: 'common',
  },
  {
    id: 'tester_10',
    name: 'Dedicated Tester',
    description: 'Complete 10 playtests',
    icon: '🌟',
    requirement: { type: 'tests_completed', value: 10 },
    xpReward: 100,
    rarity: 'uncommon',
  },
  {
    id: 'tester_25',
    name: 'Veteran Tester',
    description: 'Complete 25 playtests',
    icon: '💫',
    requirement: { type: 'tests_completed', value: 25 },
    xpReward: 250,
    rarity: 'rare',
  },
  {
    id: 'tester_50',
    name: 'Elite Tester',
    description: 'Complete 50 playtests',
    icon: '🏆',
    requirement: { type: 'tests_completed', value: 50 },
    xpReward: 500,
    rarity: 'epic',
  },
  {
    id: 'tester_100',
    name: 'Legendary Tester',
    description: 'Complete 100 playtests',
    icon: '👑',
    requirement: { type: 'tests_completed', value: 100 },
    xpReward: 1000,
    rarity: 'legendary',
  },
  
  // Games helped badges
  {
    id: 'explorer_3',
    name: 'Explorer',
    description: 'Test 3 different games',
    icon: '🧭',
    requirement: { type: 'games_helped', value: 3 },
    xpReward: 75,
    rarity: 'common',
  },
  {
    id: 'explorer_10',
    name: 'Adventurer',
    description: 'Test 10 different games',
    icon: '🗺️',
    requirement: { type: 'games_helped', value: 10 },
    xpReward: 200,
    rarity: 'uncommon',
  },
  {
    id: 'explorer_25',
    name: 'World Traveler',
    description: 'Test 25 different games',
    icon: '🌍',
    requirement: { type: 'games_helped', value: 25 },
    xpReward: 500,
    rarity: 'rare',
  },
  
  // XP milestones
  {
    id: 'xp_100',
    name: 'Rising Star',
    description: 'Earn 100 XP',
    icon: '✨',
    requirement: { type: 'xp_earned', value: 100 },
    xpReward: 25,
    rarity: 'common',
  },
  {
    id: 'xp_500',
    name: 'Shining Star',
    description: 'Earn 500 XP',
    icon: '🌠',
    requirement: { type: 'xp_earned', value: 500 },
    xpReward: 100,
    rarity: 'uncommon',
  },
  {
    id: 'xp_1000',
    name: 'Supernova',
    description: 'Earn 1,000 XP',
    icon: '💥',
    requirement: { type: 'xp_earned', value: 1000 },
    xpReward: 250,
    rarity: 'rare',
  },
]

// XP required for each level (cumulative)
export const LEVEL_XP = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  850,    // Level 5
  1300,   // Level 6
  1900,   // Level 7
  2700,   // Level 8
  3700,   // Level 9
  5000,   // Level 10
  6500,   // Level 11
  8500,   // Level 12
  11000,  // Level 13
  14000,  // Level 14
  18000,  // Level 15
  23000,  // Level 16
  29000,  // Level 17
  36000,  // Level 18
  45000,  // Level 19
  55000,  // Level 20
]

export function calculateLevel(xp: number): number {
  for (let i = LEVEL_XP.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP[i]) {
      return i + 1
    }
  }
  return 1
}

export function getXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= LEVEL_XP.length) return LEVEL_XP[LEVEL_XP.length - 1]
  return LEVEL_XP[currentLevel]
}

export function getXpProgress(xp: number, level: number): { current: number; required: number; percentage: number } {
  const currentLevelXp = LEVEL_XP[level - 1] || 0
  const nextLevelXp = LEVEL_XP[level] || LEVEL_XP[LEVEL_XP.length - 1]
  const current = xp - currentLevelXp
  const required = nextLevelXp - currentLevelXp
  const percentage = Math.min(100, Math.round((current / required) * 100))
  return { current, required, percentage }
}

export function checkNewBadges(
  earnedBadges: string[],
  testsCompleted: number,
  gamesHelped: number,
  xp: number
): Badge[] {
  const newBadges: Badge[] = []
  
  for (const badge of BADGES) {
    if (earnedBadges.includes(badge.id)) continue
    
    let earned = false
    switch (badge.requirement.type) {
      case 'tests_completed':
        earned = testsCompleted >= badge.requirement.value
        break
      case 'games_helped':
        earned = gamesHelped >= badge.requirement.value
        break
      case 'xp_earned':
        earned = xp >= badge.requirement.value
        break
    }
    
    if (earned) {
      newBadges.push(badge)
    }
  }
  
  return newBadges
}

export function getBadgeById(id: string): Badge | undefined {
  return BADGES.find(b => b.id === id)
}

export function getRarityColor(rarity: Badge['rarity']): string {
  switch (rarity) {
    case 'common': return 'text-slate-400'
    case 'uncommon': return 'text-green-400'
    case 'rare': return 'text-blue-400'
    case 'epic': return 'text-purple-400'
    case 'legendary': return 'text-yellow-400'
  }
}

export function getRarityBgColor(rarity: Badge['rarity']): string {
  switch (rarity) {
    case 'common': return 'bg-slate-500/20'
    case 'uncommon': return 'bg-green-500/20'
    case 'rare': return 'bg-blue-500/20'
    case 'epic': return 'bg-purple-500/20'
    case 'legendary': return 'bg-yellow-500/20'
  }
}
