import { useFocusEffect } from 'expo-router';

import { useCallback, useState } from 'react';

import { FlatList, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';

import { useAuth } from '@/lib/auth';

import {
  getAttendanceHistory,
  type AttendanceRecord,
  getTeacherEventAttendance,
  type TeacherEventAttendance,
} from '@/lib/attendance';

import { getProfile } from '@/lib/profiles';

export default function HistoryScreen() {
  const [role, setRole] = useState<'student' | 'teacher' | null>(null);

  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const [teacherEvents, setTeacherEvents] = useState<
    TeacherEventAttendance[]
  >([]);

  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  const loadHistory = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const profile = await getProfile(user.id);

    const currentRole = profile?.role ?? 'student';

    setRole(currentRole);

    if (currentRole === 'teacher') {
      const events = await getTeacherEventAttendance(user.id);

      setTeacherEvents(events);
      setRecords([]);
    } else {
      const rows = await getAttendanceHistory(user.id);

      setRecords(rows);
      setTeacherEvents([]);
    }

    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance History</Text>

      {loading ? (
        <Text style={styles.subtitle}>Loading records...</Text>
      ) : role === 'teacher' ? (
        teacherEvents.length === 0 ? (
          <Text style={styles.subtitle}>
            No events yet. Create an event to see attendance.
          </Text>
        ) : (
          <FlatList
            data={teacherEvents}
            keyExtractor={(item) => item.eventId}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.titleRow}>
                  <Text style={styles.eventTitle}>
                    {item.title}
                  </Text>

                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>
                      {item.attendeeCount}
                    </Text>
                  </View>
                </View>

                <Text style={styles.eventMeta}>
                  Code: {item.eventCode}
                </Text>

                {item.startTime && (
                  <Text style={styles.eventMeta}>
                    Start: {formatDate(item.startTime)}
                  </Text>
                )}

                <Text style={styles.attendeesTitle}>
                  Students:
                </Text>

                {item.attendees.length === 0 ? (
                  <Text style={styles.eventMeta}>
                    No students scanned yet.
                  </Text>
                ) : (
                  item.attendees.map((student) => (
                    <View
                      key={`${student.studentId}-${student.scannedAt}`}
                      style={styles.attendeeRow}
                    >
                      <Text style={styles.studentId}>
                        {student.studentName ||
                          shortId(student.studentId)}
                      </Text>

                      <Text style={styles.eventMeta}>
                        {formatDate(student.scannedAt)}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}
          />
        )
      ) : records.length === 0 ? (
        <Text style={styles.subtitle}>
          No records yet. Scan a QR code to register your attendance.
        </Text>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.eventTitle}>
                {item.eventTitle}
              </Text>

              <Text style={styles.eventMeta}>
                {item.eventId}
              </Text>

              <Text style={styles.eventMeta}>
                {formatDate(item.scannedAt)}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

function shortId(id: string) {
  return id ? `…${id.slice(-8)}` : 'unknown';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 32,
  },

  list: {
    paddingBottom: 24,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  eventTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },

  eventMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  countBadge: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  countText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },

  attendeesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 14,
    marginBottom: 6,
  },

  attendeeRow: {
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.15)',
  },

  studentId: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
});