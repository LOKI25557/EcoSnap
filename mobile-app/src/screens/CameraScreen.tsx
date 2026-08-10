import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Image, Alert } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import Card from '../components/Card';
import CustomButton from '../components/CustomButton';
import LoadingState from '../components/common/LoadingState';
import DetectionCard from '../components/DetectionCard';
import { useApp } from '../context/AppContext';
import { detectionService, DetectionError } from '../services/ai/detectionService';
import { detectionHistoryService } from '../services/history/DetectionHistoryService';
import { calculateScore } from '../utils/calculateScore';
import { WasteItem } from '../types/WasteItem';
import { useCamera } from '../hooks/useCamera';
import { DetectionResponse } from '../types/DetectionResult';

const CameraScreen = () => {
  const { addScan } = useApp();
  const [isScanning, setIsScanning] = useState(false);
  const [currentDetection, setCurrentDetection] = useState<DetectionResponse | null>(null);

  const {
    permission,
    requestPermission,
    cameraRef,
    capturedImage,
    takePicture,
    retakePicture,
    onCameraReady,
  } = useCamera();

  const handleRetake = () => {
    setCurrentDetection(null);
    retakePicture();
  };

  const runAnalysis = async () => {
    if (!capturedImage) return;
    setIsScanning(true);
    setCurrentDetection(null);

    try {
      const response = await detectionService.detectWaste(capturedImage.uri, {
        width: capturedImage.width,
        height: capturedImage.height,
      });

      // Save to detection history
      await detectionHistoryService.saveDetection(response, capturedImage.uri);

      // Backwards compatibility with existing WasteItem logic for Analytics
      const scannedItem: WasteItem = {
        id: `scan-${Date.now()}`,
        userId: 'demo-user',
        category: response.result.primaryCategory,
        confidenceScore: response.result.confidence,
        imageUrl: capturedImage.uri,
        detectedAt: new Date(response.metadata.timestamp),
        pointsAwarded: calculateScore(response.result.primaryCategory),
      };
      addScan(scannedItem);

      setCurrentDetection(response);
    } catch (error) {
      if (error instanceof DetectionError) {
        Alert.alert('Detection Failed', error.message);
      } else {
        Alert.alert('Error', 'An unexpected error occurred during analysis.');
      }
      console.error('Failed to run scan:', error);
    } finally {
      setIsScanning(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <LoadingState message="Requesting camera permission..." />
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
              <CustomButton title="Retake" onPress={handleRetake} />
              <CustomButton title={isScanning ? 'Analyzing...' : 'Analyze'} onPress={runAnalysis} disabled={isScanning} />
            </View>
          </View>
        )}
      </Card>

      {isScanning ? <LoadingState message="Analyzing waste..." /> : null}

      {currentDetection && (
        <DetectionCard response={currentDetection} />
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
    marginBottom: 10,
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
});

export default CameraScreen;
