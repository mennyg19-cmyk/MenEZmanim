'use client';

import React, { useState } from 'react';


export interface MobileDatePickerProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
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

export function MobileDatePicker({ selectedDate, onChange }: MobileDatePickerProps) {
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
          key={day}
          onClick={() => goToDay(d)}
          className={
            isSelected
              ? "mob-calDaySelected"
              : isTodayCell
                ? "mob-calDayToday"
                : "mob-calDay"
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
      <div className="mob-calendar">
        <div className="mob-calNav">
          <button onClick={prevMonth} className="mob-calNavBtn">
            ‹
          </button>
          <span className="mob-calMonthLabel">
            {monthName}
          </span>
          <button onClick={nextMonth} className="mob-calNavBtn">
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
            <div key={dn} className="mob-calDayName">
              {dn}
            </div>
          ))}
          {cells}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Main date display with arrows */}
      <div className="mob-dateDisplay" style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'center' }}>
        <button onClick={navPrev} className="mob-calNavBtn" style={{ fontSize: 22, lineHeight: 1 }}>
          ‹
        </button>
        <div
          style={{ flex: 1, cursor: 'pointer' }}
          onClick={toggleCalendar}
        >
          <div className="mob-dateMain">
            {formatGregorian(selectedDate)}
          </div>
          <div className="mob-dateHebrew" style={{ direction: 'rtl' }}>
            {formatHebrew(selectedDate)}
          </div>
        </div>
        <button onClick={navNext} className="mob-calNavBtn" style={{ fontSize: 22, lineHeight: 1 }}>
          ›
        </button>
      </div>

      {/* Quick jump buttons */}
      <div className="mob-quickBtnRow">
        {!isToday && (
          <button onClick={goToToday} className="mob-quickBtn">
            Today
          </button>
        )}
        <button onClick={goToShabbat} className="mob-quickBtn">
          Shabbat
        </button>
        <button onClick={toggleCalendar} className="mob-quickBtn">
          {showCalendar ? 'Close' : 'Calendar'}
        </button>
      </div>

      {/* Calendar popup */}
      {showCalendar && renderCalendar()}
    </div>
  );
}
