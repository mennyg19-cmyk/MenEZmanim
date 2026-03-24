'use client';

import React, { useState } from 'react';

export interface DisplayDatePickerWidgetProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

function formatGregorian(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatHebrew(d: Date): string {
  try {
    return d.toLocaleDateString('he-IL-u-ca-hebrew', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

function getNextSaturday(from: Date): Date {
  const d = new Date(from);
  const dayOfWeek = d.getDay();
  const daysUntilSat = dayOfWeek === 6 ? 7 : 6 - dayOfWeek;
  d.setDate(d.getDate() + daysUntilSat);
  return d;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Compact date picker for public display boards (mobile / TV). Dispatches changes via onChange.
 */
export function DisplayDatePickerWidget({
  selectedDate,
  onChange,
  fontSize = 14,
  fontFamily = 'system-ui, sans-serif',
  color = '#fff',
}: DisplayDatePickerWidgetProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  const today = new Date();
  const isToday = isSameDay(selectedDate, today);

  const goToDay = (d: Date) => {
    onChange(d);
    setShowCalendar(false);
  };

  const navPrev = () => onChange(addDays(selectedDate, -1));
  const navNext = () => onChange(addDays(selectedDate, 1));
  const goToToday = () => goToDay(new Date());
  const goToShabbat = () => goToDay(getNextSaturday(new Date()));

  const toggleCalendar = () => {
    if (!showCalendar) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
    setShowCalendar(!showCalendar);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const renderCalendar = () => {
    const totalDays = daysInMonth(viewYear, viewMonth);
    const firstDow = new Date(viewYear, viewMonth, 1).getDay();
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const cells: React.ReactNode[] = [];

    for (let i = 0; i < firstDow; i++) {
      cells.push(<div key={`empty-${i}`} />);
    }
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(viewYear, viewMonth, day);
      const isSelected = isSameDay(d, selectedDate);
      const isTodayCell = isSameDay(d, today);
      cells.push(
        <button
          type="button"
          key={day}
          onClick={() => goToDay(d)}
          className={
            isSelected
              ? 'wgt-calDaySelected'
              : isTodayCell
                ? 'wgt-calDayToday'
                : 'wgt-calDay'
          }
        >
          {day}
        </button>,
      );
    }

    const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    return (
      <div className="wgt-calendar">
        <div className="wgt-calNav">
          <button type="button" onClick={prevMonth} className="wgt-calNavBtn">
            ‹
          </button>
          <span className="wgt-calMonthLabel">{monthName}</span>
          <button type="button" onClick={nextMonth} className="wgt-calNavBtn">
            ›
          </button>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            justifyItems: 'center',
            gap: 2,
          }}
        >
          {dayNames.map((dn) => (
            <div key={dn} className="wgt-calDayName">
              {dn}
            </div>
          ))}
          {cells}
        </div>
      </div>
    );
  };

  return (
    <div className="wgt-datePickerRoot" style={{ fontFamily, color, fontSize, pointerEvents: 'auto' }}>
      <div className="wgt-dateDisplay" style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'center' }}>
        <button type="button" onClick={navPrev} className="wgt-calNavBtn" style={{ fontSize: 22, lineHeight: 1 }}>
          ‹
        </button>
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={toggleCalendar} role="presentation">
          <div className="wgt-dateMain" style={{ fontWeight: 600 }}>
            {formatGregorian(selectedDate)}
          </div>
          <div className="wgt-dateHebrew" style={{ direction: 'rtl', opacity: 0.9, fontSize: Math.max(11, fontSize - 2) }}>
            {formatHebrew(selectedDate)}
          </div>
        </div>
        <button type="button" onClick={navNext} className="wgt-calNavBtn" style={{ fontSize: 22, lineHeight: 1 }}>
          ›
        </button>
      </div>

      <div className="wgt-quickBtnRow" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, justifyContent: 'center' }}>
        {!isToday && (
          <button type="button" onClick={goToToday} className="wgt-quickBtn">
            Today
          </button>
        )}
        <button type="button" onClick={goToShabbat} className="wgt-quickBtn">
          Shabbat
        </button>
        <button type="button" onClick={toggleCalendar} className="wgt-quickBtn">
          {showCalendar ? 'Close' : 'Calendar'}
        </button>
      </div>

      {showCalendar && renderCalendar()}
    </div>
  );
}
