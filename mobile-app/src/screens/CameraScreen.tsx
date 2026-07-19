import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import Card from '../components/Card';
import CustomButton from '../components/CustomButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { useApp } from '../context/AppContext';
import { WasteCategory, WASTE_CATEGORIES_INFO } from '../constants/wasteCategories';
import { detectionService } from '../services/ai/detectionService';
import { recommendationService } from '../services/ai/recommendationService';
import { analyticsService } from '../services/ai/analyticsService';
import { recyclingKnowledgeBase } from '../utils/recyclingKnowledgeBase';
import { calculateScore } from '../utils/calculateScore';
import { formatDate } from '../utils/formatDate';
import { WasteItem } from '../types/WasteItem';
import { useCamera } from '../hooks/useCamera';

const CameraScreen = () => {
  const { addScan, latestScan } = useApp();
  const [isScanning, setIsScanning] = useState(false);
  const [currentDetection, setCurrentDetection] = useState<WasteItem | null>(latestScan);

  const {
    permission,
    requestPermission,
    cameraRef,
    capturedImage,
    takePicture,
    retakePicture,
    onCameraReady,
  } = useCamera();

  const activeCategory = currentDetection?.category ?? WasteCategory.UNKNOWN;
  const categoryInfo = WASTE_CATEGORIES_INFO[activeCategory];
  const recommendation = useMemo(
    () => recommendationService.getBinRecommendation(activeCategory),
    [activeCategory]
  );
  const knowledge = useMemo(
    () => recyclingKnowledgeBase.getKnowledge(activeCategory),
    [activeCategory]
  );

  const runAnalysis = async () => {
    if (!capturedImage) return;
    setIsScanning(true);

    try {
      // NOTE: In Step 5, this will be replaced with real TFLite inference.
      const detection = await detectionService.detectWaste(capturedImage.uri);
      const scannedItem: WasteItem = {
        id: `scan-${Date.now()}`,
        userId: 'demo-user',
        category: detection.category,
        confidenceScore: detection.confidence,
        imageUrl: capturedImage.uri,
        detectedAt: new Date(),
        pointsAwarded: calculateScore(detection.category),
      };

      addScan(scannedItem);
      setCurrentDetection(scannedItem);
    } catch (error) {
      console.error('Failed to run scan:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const impactSummary = useMemo(() => {
    const items = currentDetection ? [currentDetection] : [];
    return analyticsService.getUserImpact('demo-user', items);
  }, [currentDetection]);

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <CustomButton title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>AI Waste Scanner</Text>

      <Card style={styles.cameraCard}>
        {!capturedImage ? (
          <View style={styles.cameraContainer}>
            <Camera
              style={styles.camera}
              type={CameraType.back}
              ref={cameraRef}
              onCameraReady={onCameraReady}
              ratio="4:3"
            />
            <View style={styles.cameraOverlay}>
              <CustomButton title="Capture" onPress={takePicture} />
            </View>
          </View>
        ) : (
          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedImage.uri }} style={styles.previewImage} />
            <View style={styles.previewActions}>
              <CustomButton title="Retake" onPress={retakePicture} />
              <CustomButton title={isScanning ? 'Analyzing...' : 'Analyze'} onPress={runAnalysis} disabled={isScanning} />
            </View>
          </View>
        )}
      </Card>

      {isScanning ? <LoadingSpinner /> : null}

      {currentDetection && (
        <>
          <Card style={styles.heroCard}>
            <Text style={styles.sectionTitle}>Detection Result</Text>
            <Text style={styles.category}>{categoryInfo.description}</Text>
            <Text style={styles.detail}>Category: {activeCategory}</Text>
            <Text style={styles.detail}>Confidence: {Math.round((currentDetection.confidenceScore ?? 0) * 100)}%</Text>
            <Text style={styles.detail}>Points: {currentDetection.pointsAwarded ?? 0}</Text>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Disposal Guidance</Text>
            <Text style={styles.detail}>Bin: {recommendation.bin}</Text>
            <Text style={styles.detail}>{recommendation.instruction}</Text>
            <Text style={styles.detail}>Recyclable: {recommendation.recyclable ? 'Yes' : 'No'}</Text>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Knowledge Base</Text>
            <Text style={styles.detail}>{knowledge.description}</Text>
            <Text style={styles.detail}>Decomposition: {knowledge.decompositionTime ?? 'Not available'}</Text>
            <Text style={styles.detail}>Landfill impact: {knowledge.landfillImpact}</Text>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Impact Summary</Text>
            <Text style={styles.detail}>CO2 Saved: {impactSummary.co2SavedKg.toFixed(2)} kg</Text>
            <Text style={styles.detail}>Waste Diverted: {impactSummary.wasteDivertedKg.toFixed(2)} kg</Text>
            <Text style={styles.detail}>Sustainability Score: {impactSummary.sustainabilityScore}/100</Text>
            <Text style={styles.detail}>Recycling Rate: {impactSummary.recyclingRate}%</Text>
          </Card>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: '#f3f7f2',
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f7f2',
    padding: 20,
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    color: '#2d4137',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f3d2b',
  },
  cameraCard: {
    padding: 0,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  cameraContainer: {
    height: 400,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  previewContainer: {
    height: 400,
    position: 'relative',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  previewActions: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  heroCard: {
    backgroundColor: '#e8f5e9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#173224',
  },
  category: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#244b34',
  },
  detail: {
    color: '#2d4137',
    marginBottom: 6,
    lineHeight: 20,
  },
});

export default CameraScreen;
