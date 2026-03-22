/**
 * Preset gradient backgrounds for boxes and canvas.
 */

export type GradientCategory = 'warm' | 'cool' | 'neutral' | 'vibrant';

export interface GradientPreset {
  id: string;
  label: string;
  category: GradientCategory;
  /** Full CSS `background` value (linear or radial gradient). */
  css: string;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { id: 'sunset', label: 'Sunset', category: 'warm', css: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'peach', label: 'Peach', category: 'warm', css: 'linear-gradient(120deg, #ffecd2 0%, #fcb69f 100%)' },
  { id: 'rose-gold', label: 'Rose Gold', category: 'warm', css: 'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)' },
  { id: 'ember', label: 'Ember', category: 'warm', css: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
  { id: 'autumn', label: 'Autumn', category: 'warm', css: 'linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)' },
  { id: 'ocean', label: 'Ocean', category: 'cool', css: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'aqua', label: 'Aqua', category: 'cool', css: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)' },
  { id: 'ice', label: 'Ice', category: 'cool', css: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 50%, #4dd0e1 100%)' },
  { id: 'midnight', label: 'Midnight', category: 'cool', css: 'linear-gradient(135deg, #0c3483 0%, #a2b6df 100%)' },
  { id: 'forest', label: 'Forest', category: 'cool', css: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)' },
  { id: 'slate-mist', label: 'Slate Mist', category: 'neutral', css: 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)' },
  { id: 'silver', label: 'Silver', category: 'neutral', css: 'linear-gradient(135deg, #e6e9f0 0%, #eef1f5 100%)' },
  { id: 'charcoal', label: 'Charcoal', category: 'neutral', css: 'linear-gradient(135deg, #434343 0%, #000000 100%)' },
  { id: 'cream', label: 'Cream', category: 'neutral', css: 'linear-gradient(180deg, #fdfbfb 0%, #ebedee 100%)' },
  { id: 'paper-gray', label: 'Paper Gray', category: 'neutral', css: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' },
  { id: 'neon', label: 'Neon', category: 'vibrant', css: 'linear-gradient(135deg, #12c2e9 0%, #c471ed 50%, #f64f59 100%)' },
  { id: 'candy', label: 'Candy', category: 'vibrant', css: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)' },
  { id: 'lime-pop', label: 'Lime Pop', category: 'vibrant', css: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)' },
  { id: 'purple-haze', label: 'Purple Haze', category: 'vibrant', css: 'linear-gradient(135deg, #7028e4 0%, #e5b2ca 100%)' },
  { id: 'tropical', label: 'Tropical', category: 'vibrant', css: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
];

export function getGradientPresetCss(id: string | undefined): string | undefined {
  if (!id) return undefined;
  return GRADIENT_PRESETS.find((g) => g.id === id)?.css;
}
