import type { ColorPalette, GlassStyle } from '@/types'

export const C: ColorPalette = {
  bg: '#050510', bg2: '#0a0a20', bg3: '#0f0f2a', card: '#12123a',
  border: 'rgba(255,255,255,0.06)', border2: 'rgba(255,255,255,0.12)',
  text: '#F0EEFF', text2: '#A8A3D0', text3: '#6E6A95',
  cyan: '#00E5FF', gold: '#FFD93D', pink: '#FF4D8D', purple: '#C084FC',
  orange: '#FB923C', red: '#FF4444', green: '#34D399', lime: '#7FFF00', blue: '#60A5FA',
  glass: 'rgba(255,255,255,0.03)', glassBorder: 'rgba(255,255,255,0.08)',
}

export const GLASS_CLEAR: GlassStyle = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(50px) saturate(1.5) brightness(1.1)',
  WebkitBackdropFilter: 'blur(50px) saturate(1.5) brightness(1.1)',
  border: '1px solid rgba(255,255,255,0.15)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(255,255,255,0.04)',
}

export const GLASS_CARD: GlassStyle = {
  background: 'rgba(8,8,25,0.72)',
  backdropFilter: 'blur(40px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(40px) saturate(1.4)',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(255,255,255,0.02)',
}

export const LG = {
  base: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(40px) saturate(1.8) brightness(1.1)',
    WebkitBackdropFilter: 'blur(40px) saturate(1.8) brightness(1.1)',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.03)',
  } as GlassStyle,
  thick: {
    background: 'rgba(10,10,32,0.45)',
    backdropFilter: 'blur(60px) saturate(2) brightness(1.05)',
    WebkitBackdropFilter: 'blur(60px) saturate(2) brightness(1.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 16px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(255,255,255,0.02)',
  } as GlassStyle,
  pill: {
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(24px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
  } as GlassStyle,
  tinted: (color: string): GlassStyle => ({
    background: `${color}08`,
    backdropFilter: 'blur(40px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
    border: `1px solid ${color}18`,
    boxShadow: `0 8px 32px ${color}08, inset 0 1px 0 ${color}10, inset 0 -1px 0 ${color}05`,
  }),
}
