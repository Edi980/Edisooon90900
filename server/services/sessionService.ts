export type TradingSession = 'LONDON' | 'NY' | 'ASIA';

export class SessionService {
  getCurrentSession(): TradingSession {
    const now = new Date();
    const utcHour = now.getUTCHours();
    
    // London: 08:00-17:00 UTC (main session)
    if (utcHour >= 8 && utcHour < 17) {
      return 'LONDON';
    }
    
    // New York: 13:00-22:00 UTC (overlap with London 13:00-17:00)
    if (utcHour >= 13 && utcHour < 22) {
      return 'NY';
    }
    
    // Asia: 23:00-08:00 UTC
    return 'ASIA';
  }

  getSessionStatus(): {
    current: TradingSession;
    london: { active: boolean; status: string };
    ny: { active: boolean; status: string };
    asia: { active: boolean; status: string };
  } {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const current = this.getCurrentSession();
    
    return {
      current,
      london: {
        active: utcHour >= 8 && utcHour < 17,
        status: utcHour >= 8 && utcHour < 17 ? 'ACTIVE' : utcHour < 8 ? 'CLOSED' : 'CLOSED'
      },
      ny: {
        active: utcHour >= 13 && utcHour < 22,
        status: utcHour >= 13 && utcHour < 22 ? 'ACTIVE' : utcHour < 13 ? 'OPENING' : 'CLOSED'
      },
      asia: {
        active: utcHour >= 23 || utcHour < 8,
        status: utcHour >= 23 || utcHour < 8 ? 'ACTIVE' : utcHour < 23 ? 'OPENING' : 'CLOSED'
      }
    };
  }

  isHighVolatilityPeriod(): boolean {
    const utcHour = new Date().getUTCHours();
    
    // London open: 08:00-10:00 UTC
    // NY open overlap: 13:00-15:00 UTC
    // These are typically high volatility periods
    return (utcHour >= 8 && utcHour < 10) || (utcHour >= 13 && utcHour < 15);
  }

  getNextSessionChange(): { session: TradingSession; timeUntil: number } {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();
    
    let nextSession: TradingSession;
    let hoursUntil: number;
    
    if (utcHour < 8) {
      nextSession = 'LONDON';
      hoursUntil = 8 - utcHour;
    } else if (utcHour < 13) {
      nextSession = 'NY';
      hoursUntil = 13 - utcHour;
    } else if (utcHour < 23) {
      nextSession = 'ASIA';
      hoursUntil = 23 - utcHour;
    } else {
      nextSession = 'LONDON';
      hoursUntil = 24 - utcHour + 8;
    }
    
    const minutesUntil = hoursUntil * 60 - utcMinute;
    
    return {
      session: nextSession,
      timeUntil: minutesUntil * 60 * 1000 // Return in milliseconds
    };
  }
}
