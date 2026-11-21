/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RouteType = 'A' | 'B' | 'C' | 'D' | 'E';

export type BottomTabType = 'input' | 'layout' | 'font' | 'preview';

export interface CustomTextOverlay {
  id: string;
  text: string;
  placement: 'Top Left' | 'Top Center' | 'Top Right' | 'Bottom Left' | 'Bottom Center' | 'Bottom Right';
  bold: boolean;
  uppercase: boolean;
}

export type PageSizePreset = 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | 'Executive' | 'Tabloid' | 'Custom';
export type MarginPreset = '0.2' | '0.3' | '0.4' | '0.5' | '0.6' | '0.7' | '1.0' | '1.5' | '2.0' | 'Custom';
export type ColumnLayout = '1' | '2' | '3' | '4'; // 1=Single, 2=Two Column, 3=Three Column, 4=Four Column
export type AlignmentType = 'Left' | 'Center' | 'Right' | 'Justified' | 'Auto';
export type MarkerPlacementType = 'Top Left' | 'Top Center' | 'Top Right' | 'Bottom Left' | 'Bottom Center' | 'Bottom Right' | 'None';
export type CounterStyleType = 'Page 1, Page 2' | '1, 2, 3' | '1/4, 2/4, 3/4' | '(1), (2), (3)' | '[1], [2], [3]';
export type CompressionType = 'Maximum' | 'Balanced' | 'High Quality';
export type DocumentThemeType = 'White' | 'Cream' | 'Charcoal Black';

export interface LayoutSettings {
  pageSizePreset: PageSizePreset;
  customWidth: string; // Keep as string for unlocked typing
  customHeight: string;
  marginPreset: MarginPreset;
  customMarginTop: string;
  customMarginBottom: string;
  customMarginLeft: string;
  customMarginRight: string;
  columns: ColumnLayout;
  fontSize: string; // Unlocked typing
  lineSpacing: string; // Unlocked typing
  alignment: AlignmentType;
  markerPlacement: MarkerPlacementType;
  counterStyle: CounterStyleType;
  counterFontSize: string; // Unlocked typing
  customTexts: CustomTextOverlay[];
  compression: CompressionType;
  documentTheme?: DocumentThemeType;
}

export interface FontItem {
  id: string;
  name: string;
  category: 'Sans-Serif' | 'Serif' | 'Display' | 'Monospace' | 'Handwriting' | 'Custom';
  url?: string;
  base64?: string;
  italicBase64?: string;
  status: 'Downloaded and Applied' | 'Not Downloaded' | 'Failed' | 'Compiling...';
  error?: string;
}

export interface SavedTemplate {
  id: string;
  name: string;
  settings: LayoutSettings;
  fontId: string;
  banglaFontId?: string;
}

export interface TXTMergeItem {
  id: string;
  name: string;
  content: string;
  size: number;
}
