import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CommunityReport } from '../../types/CommunityReport';

interface CommunityReportDetailsCardProps {
  report: CommunityReport;
  onClose: () => void;
  onNavigate: () => void;
}

export const CommunityReportDetailsCard: React.FC<CommunityReportDetailsCardProps> = ({
  report,
  onClose,
  onNavigate,
}) => {
  const getReportTypeLabel = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'under_review':
        return '#2196F3';
      case 'verified':
        return '#00BCD4';
      case 'resolved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const formattedDate = report.createdAt 
    ? new Date(report.createdAt).toLocaleDateString()
    : 'Unknown Date';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getReportTypeLabel(report.type)}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.badgeRow}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
            <Text style={styles.statusText}>{report.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
          <Text style={styles.dateText}>📅 {formattedDate}</Text>
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.text}>{report.description}</Text>

        {report.address ? (
          <>
            <Text style={styles.sectionTitle}>Approximate Location</Text>
            <Text style={styles.text}>{report.address}</Text>
          </>
        ) : null}

        <TouchableOpacity style={styles.navButton} onPress={onNavigate}>
          <Text style={styles.navButtonText}>Navigate to Report Location</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 20,
    color: '#999',
    fontWeight: 'bold',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#666',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 14,
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  navButton: {
    backgroundColor: '#E64A19',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  navButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
