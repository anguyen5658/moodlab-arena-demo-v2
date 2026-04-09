import { C } from './colors.js';

// ── WEB BLUETOOTH — Cali Clear device UUIDs ──
export const BLE_SERVICE_UUID     = "0000ffe0-0000-1000-8000-00805f9b34fb";
export const BLE_WRITE_CHAR_UUID  = "0000ffe5-0000-1000-8000-00805f9b34fb";
export const BLE_NOTIFY_CHAR_UUID = "0000ffe6-0000-1000-8000-00805f9b34fb";

// Notification payloads (6 bytes each)
export const BLE_PUFF_START = [0xb4, 0xb4, 0x02, 0x00, 0x04, 0x4b]; // heating   → puff starts
export const BLE_PUFF_STOP  = [0xb4, 0xb5, 0x02, 0x00, 0x05, 0x4b]; // cancelled → puff stops

// ── DEVICE MODELS & POOLS ──
export const DEVICE_MODELS = [
  { id:"cc_s1", name:"Cali Clear Season 1", short:"CC S1", pool:"standard", emoji:"📱" },
  { id:"cc_s2", name:"Cali Clear Season 2", short:"CC S2", pool:"standard", emoji:"📱" },
  { id:"cc_s3", name:"Cali Clear Season 3", short:"CC S3", pool:"standard", emoji:"📱" },
  { id:"cc_sel1", name:"Cali Clear Select S1", short:"CC Select S1", pool:"select", emoji:"✨" },
  { id:"cc_sel2", name:"Cali Clear Select S2", short:"CC Select S2", pool:"select", emoji:"✨" },
  { id:"none", name:"No Device", short:"Tap Only", pool:"open", emoji:"👆" },
];

export const DEVICE_POOLS = {
  select:   { label:"Select Pool", color:C.gold,  aiSave:0.25, aiScore:0.45, rewardMult:2 },
  standard: { label:"Standard Pool", color:C.cyan,  aiSave:0.20, aiScore:0.40, rewardMult:1.5 },
  open:     { label:"Open Pool",    color:C.text3, aiSave:0.12, aiScore:0.30, rewardMult:1 },
};

export const INPUT_MODES = [
  { id:"auto",  label:"Auto",  icon:"🤖", desc:"App auto-selects best input for game & device", color:C.cyan },
  { id:"fixed", label:"Fixed", icon:"📌", desc:"Always use one input type you choose",           color:C.gold },
  { id:"ask",   label:"Ask",   icon:"❓", desc:"Ask before each game",                           color:C.lime },
];

// ── UNIVERSAL PUFF ACTION BAR CONFIG ──
export const UNIVERSAL_PUFF_CONFIG = {
  randomizeSweetSpot: () => {
    const min = 30 + Math.random() * 20;
    const max = min + 20 + Math.random() * 20;
    return { min: Math.round(min), max: Math.min(95, Math.round(max)) };
  },
  blinkerThreshold: 95,
  zones: [
    { name:"TAP",     max:15,  color:"#555F85" },
    { name:"SHORT",   max:40,  color:"#8892B8" },
    { name:"GOOD",    max:65,  color:"#00E5FF" },
    { name:"PERFECT", max:90,  color:"#7FFF00" },
    { name:"BLINKER", max:100, color:"#FF4444" },
  ],
};

// Maps puff duration (ms) to trivia answer index A/B/C/D
export const getTriviaPuffAnswer = (ms) => ms < 800 ? 0 : ms < 2000 ? 1 : ms < 3500 ? 2 : 3;
