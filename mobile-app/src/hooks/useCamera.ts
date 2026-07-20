import { useState, useRef } from 'react';
import { Camera, CameraCapturedPicture } from 'expo-camera';

export const useCamera = () => {
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const cameraRef = useRef<Camera>(null);
  const [capturedImage, setCapturedImage] = useState<CameraCapturedPicture | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const takePicture = async () => {
    if (cameraRef.current && isCameraReady) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setCapturedImage(photo);
        return photo;
      } catch (error) {
        console.error('Failed to take picture:', error);
      }
    }
    return null;
  };

  const retakePicture = () => {
    setCapturedImage(null);
  };

  const onCameraReady = () => {
    setIsCameraReady(true);
  };

  return {
    permission,
    requestPermission,
    cameraRef,
    capturedImage,
    takePicture,
    retakePicture,
    onCameraReady,
    isCameraReady,
  };
};
