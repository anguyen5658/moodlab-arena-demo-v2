/** Multiplayer window state objects used by game BLE slot routing */
interface Window {
  _pcMp?: { holding: boolean[]; startTime: number[] }
  _plMp?: { alive: boolean[]; holding: boolean[]; startTime: number[] }
  _fwMp?: { boosting: boolean[] }
  _rpsP2?: { puffStart: number; puffDuration: number; choice: string | null }
  _duelP2?: any
}
