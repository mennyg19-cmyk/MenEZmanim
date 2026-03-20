'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MobileDatePicker } from './MobileDatePicker';
import { MobileZmanim } from './MobileZmanim';
import { MobileSchedule } from './MobileSchedule';
import { MobileAnnouncements } from './MobileAnnouncements';


export interface MobileAppProps {
  getZmanim: (date: Date) => Promise<any[]>;
  getCalendarInfo: (date: Date) => Promise<any>;
  getSchedule: (date: Date) => Promise<any[]>;
  getAnnouncements: () => Promise<any[]>;
  orgName?: string;
  orgNameHebrew?: string;
}

type TabId = 'zmanim' | 'schedule' | 'announcements';

const TABS: { id: TabId; label: string; labelHe: string }[] = [
  { id: 'zmanim', label: 'Zmanim', labelHe: 'זמנים' },
  { id: 'schedule', label: 'Schedule', labelHe: 'לוח זמנים' },
  { id: 'announcements', label: 'News', labelHe: 'הודעות' },
];

export function MobileApp({
  getZmanim,
  getCalendarInfo,
  getSchedule,
  getAnnouncements,
  orgName = 'Zmanim',
  orgNameHebrew,
}: MobileAppProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<TabId>('zmanim');
  const [zmanim, setZmanim] = useState<any[]>([]);
  const [calendarInfo, setCalendarInfo] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [language] = useState<'hebrew' | 'english'>('english');

  const loadData = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      const [z, c, s] = await Promise.all([
        getZmanim(date),
        getCalendarInfo(date),
        getSchedule(date),
      ]);
      setZmanim(z);
      setCalendarInfo(c);
      setSchedule(s);
    } catch {
      // Silently handle — data stays as-is
    } finally {
      setLoading(false);
    }
  }, [getZmanim, getCalendarInfo, getSchedule]);

  const loadAnnouncements = useCallback(async () => {
    try {
      const a = await getAnnouncements();
      setAnnouncements(a);
    } catch {
      // Silently handle
    }
  }, [getAnnouncements]);

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate, loadData]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleRefresh = () => {
    loadData(selectedDate);
    loadAnnouncements();
  };

  const hebrewDate = calendarInfo?.hebrewDate ?? '';

  return (
    <div className="mob-app">
      {/* Header */}
      <header className="mob-header">
        <div className="mob-headerTitle">{orgName}</div>
        {orgNameHebrew && (
          <div className="mob-headerSub" style={{ direction: 'rtl' }}>
            {orgNameHebrew}
          </div>
        )}
        {hebrewDate && (
          <div className="mob-headerSub" style={{ opacity: 0.65, direction: 'rtl', marginTop: 4 }}>
            {hebrewDate}
          </div>
        )}
      </header>

      {/* Date picker */}
      <div style={{ padding: '12px 16px 0' }}>
        <MobileDatePicker selectedDate={selectedDate} onChange={handleDateChange} />
      </div>

      {/* Tab bar */}
      <nav className="mob-tabBar" style={{ margin: '8px 16px 0' }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={isActive ? "mob-tabActive" : "mob-tab"}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Refresh button */}
      <div style={{ padding: '8px 16px 0', textAlign: 'right' }}>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className={loading ? "mob-refreshBtnLoading" : "mob-refreshBtn"}
        >
          {loading ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>

      {/* Content */}
      <main className="mob-content">
        {activeTab === 'zmanim' && (
          <MobileZmanim zmanim={zmanim} date={selectedDate} language={language} />
        )}
        {activeTab === 'schedule' && (
          <MobileSchedule schedule={schedule} date={selectedDate} />
        )}
        {activeTab === 'announcements' && (
          <MobileAnnouncements announcements={announcements} />
        )}
      </main>
    </div>
  );
}
