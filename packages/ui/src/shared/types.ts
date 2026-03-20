export interface CalendarInfo {
  date: any;
  parsha: any;
  holiday: any;
  omer: any;
  dafYomi: any;
  tefilah: any;
}

export interface AnnouncementData {
  id: string;
  title: string;
  content: any;
  priority: number;
}

export interface MemorialData {
  id: string;
  hebrewName: string;
  englishName?: string;
  hebrewDate?: string;
  relationship?: string;
}

export interface MinyanData {
  id: string;
  name: string;
  hebrewName: string;
  time: string;
  room?: string;
  type: string;
  groupId?: string;
  isPlaceholder?: boolean;
  placeholderLabel?: string;
  durationMinutes?: number;
}

export interface MediaData {
  id: string;
  url: string;
  mimeType: string;
}

export interface ZmanResult {
  type: string;
  time: Date | null;
  label: string;
  hebrewLabel: string;
  authority: string;
  originalTime?: Date | null;
}
