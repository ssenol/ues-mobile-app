import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import ThemedIcon from "./ThemedIcon";

const InlineCalendar = ({ selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate ? new Date(selectedDate) : new Date()
  );

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
    let firstDayOfWeek = firstDay.getDay();
    // Convert to Monday = 0, Sunday = 6
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    const today = new Date();
    const nextMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
    
    // Don't allow going beyond current month
    if (nextMonthDate <= today) {
      setCurrentMonth(nextMonthDate);
    }
  };

  const isDateSelected = (date) => {
    if (!date || !selectedDate) return false;
    const selected = new Date(selectedDate);
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
  };

  const isDateInFuture = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  const days = getDaysInMonth(currentMonth);
  const today = new Date();
  const isCurrentMonth = 
    currentMonth.getMonth() === today.getMonth() &&
    currentMonth.getFullYear() === today.getFullYear();

  return (
    <View style={styles.container}>
      {/* Month Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={previousMonth} style={styles.navButton}>
          <ThemedIcon iconName="leftArrow" size={16} tintColor="#3A3A3A" />
        </TouchableOpacity>
        
        <ThemedText weight="bold" style={styles.monthYear}>
          {monthNames[currentMonth.getMonth()]} - {currentMonth.getFullYear()}
        </ThemedText>
        
        <TouchableOpacity 
          onPress={nextMonth} 
          style={[styles.navButton, isCurrentMonth && styles.navButtonDisabled]}
          disabled={isCurrentMonth}
        >
          <ThemedIcon 
            iconName="rightArrow" 
            size={16} 
            tintColor={isCurrentMonth ? "#999" : "#3A3A3A"}
          />
        </TouchableOpacity>
      </View>

      {/* Day Names */}
      <View style={styles.dayNamesRow}>
        {dayNames.map((day) => (
          <View key={day} style={styles.dayNameCell}>
            <ThemedText style={styles.dayNameText}>{day}</ThemedText>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {days.map((date, index) => {
          const isSelected = isDateSelected(date);
          const isFuture = isDateInFuture(date);
          const isEmpty = date === null;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                isEmpty && styles.dayCellEmpty,
              ]}
              onPress={() => {
                if (date && !isFuture) {
                  onDateSelect(date);
                }
              }}
              disabled={isEmpty || isFuture}
              activeOpacity={0.7}
            >
              {!isEmpty && (
                <View style={[
                  styles.dayButton,
                  isSelected && styles.dayButtonSelected,
                  isFuture && styles.dayButtonDisabled,
                ]}>
                  <ThemedText style={[
                    styles.dayText,
                    isSelected && styles.dayTextSelected,
                    isFuture && styles.dayTextDisabled,
                  ]}>
                    {date.getDate()}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderColor: '#EDEDED',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  monthYear: {
    fontSize: 16,
    color: '#3A3A3A',
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayNameText: {
    fontSize: 14,
    color: '#949494',
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  dayCellEmpty: {
    backgroundColor: 'transparent',
  },
  dayButton: {
    flex: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#3E4EF0',
  },
  dayButtonDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    color: '#3A3A3A',
  },
  dayTextSelected: {
    color: '#fff',
  },
  dayTextDisabled: {
    color: '#949494',
  },
});

export default InlineCalendar;
