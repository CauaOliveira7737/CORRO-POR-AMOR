export const APP_CONFIG = {
  name: 'Corro por Amor',
  subtitle: 'Desafios Virtuais de Corrida',
  motto: 'O atleta corre. O aplicativo registra. O sistema soma. O ranking atualiza. O atleta conquista.',
  
  // Supabase Project Credentials (Created via MCP)
  supabaseUrl: 'https://yrmyrsjhrhdpzukjgqma.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybXlyc2pocmhkcHp1a2pncW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxODcxNDksImV4cCI6MjEwNTc2MzE0OX0._82d0rAxMnPchLuuf6wgu92ZJXsv8kH78wpsFbzgKAU',
  supabasePublishableKey: 'sb_publishable_AOINZeRKzZ1ozhn2sA_N0g_HEHXwiZi',

  // GPS & Auto-pause / resume rules
  gps: {
    // Distance accuracy filter: ignore GPS points with horizontal accuracy worse than 30m
    maxAccuracyMeters: 30,
    // Threshold below which user is considered stationary (m/s) -> 0.8 m/s = ~2.88 km/h
    stationarySpeedThresholdMs: 0.8,
    // Duration in seconds of being stopped to trigger auto-pause: 60 seconds (1 minute)
    autoPauseSeconds: 60,
    // Threshold above which user is considered running again (m/s) -> 1.2 m/s = ~4.32 km/h
    movingSpeedThresholdMs: 1.2,
    // Number of consecutive moving samples required to trigger auto-resume (debounce)
    movingDebounceSamples: 4,
  },

  // Anti-cheat & validation limits
  validation: {
    // Maximum plausible sustained running speed: 25 km/h (world marathon record is ~20.9 km/h)
    maxRunningKmh: 25.0,
    // Minimum pace: 2 min 24 sec / km
    minPaceSecondsKm: 144,
    // Maximum pace (walking slow): 18 min / km
    maxPaceSecondsKm: 1080,
  },

  // Default Gamification XP
  gamification: {
    xpJoinChallenge: 50,
    xpFinishRun: 10,
    xpCompleteChallenge: 100,
    xpFirstToComplete: 50,
    // Function to compute level: Level = floor(sqrt(xp / 100)) + 1
    xpForNextLevel: (currentLevel: number) => Math.pow(currentLevel, 2) * 100,
  }
} as const;
