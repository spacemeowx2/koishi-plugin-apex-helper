import { Context, Logger, Schema } from 'koishi'

export const name = 'apex-helper'

export interface Config {
  apikey: string
}

export const Config: Schema<Config> = Schema.object({
  apikey: Schema.string()
    .required()
    .description(
      'Apex Legends API 上的 API Key (https://portal.apexlegendsapi.com/)'
    )
})

const apiBaseUrl = 'https://api.mozambiquehe.re'

interface MapInfo {
  start: number
  end: number
  readableDate_start: string
  readableDate_end: string
  map: string
  code: string
  DurationInSecs: number
  DurationInMinutes: number
  isActive?: boolean
  eventName?: string
  eventName_zh?: string
  asset?: string
  remainingSecs?: number
  remainingMins?: number
  remainingTimer?: string
}
interface MapItem {
  current: MapInfo
  next: MapInfo
}
interface MapData {
  battle_royale: MapItem
  ranked: MapItem
  ltm: MapItem
}

function t(key: string | undefined) {
  const logger = new Logger('apex-helper')

  if (!key) {
    logger.warn('Map is undefined')
    return '未知'
  }

  const DICT: Record<string, string | undefined> = {
    'Olympus': '奥林匹斯',
    'Kings Canyon': '诸王峡谷',
    'Storm Point': '风暴点',
    'World\'s Edge': '世界尽头',
    'Broken Moon': '残月',
    'E-District': '电力区域',
    'Control': '控制',
    'TDM': '团队死斗',
    'TDM - DeadEye': '团队死斗 - 无护盾',
    'Gun Run': '子弹时间',
    'Lockdown': '封锁'
  }
  const translated = DICT[key]

  if (!translated) {
    logger.warn(`Unknown map: ${key}`)
  }

  return translated || key
}

function date(d: number) {
  return new Date(d * 1000).toLocaleTimeString()
}

export function apply(ctx: Context, config: Config) {
  const logger = new Logger('apex-helper')

  logger.debug('Apex Legend helper started')

  ctx.command('apexmap').action(async () => {
    const res = JSON.parse((await ctx.http.get(`${apiBaseUrl}/maprotation`, {
      params: {
        auth: config.apikey,
        version: 2
      }
    })))

    if (res.Error || !res.battle_royale) {
      logger.error(typeof res)
      return `查询地图轮换失败：${res.Error || 'Unknown'}`
    }
    const { battle_royale, ranked, ltm } = res as MapData
    return [
      `匹配：${t(battle_royale.current.map)}(${date(battle_royale.current.start)}) -> ${t(battle_royale.next.map)}(${date(battle_royale.next.start)})`,
      `排位：${t(ranked.current.map)}(${date(ranked.current.start)}) -> ${t(ranked.next.map)}(${date(ranked.next.start)})`,
      `娱乐：${t(ltm.current.eventName)}(${date(ltm.current.start)}) -> ${t(ltm.next.eventName)}(${date(ltm.next.start)})`
    ].join('\n')
  })
}
