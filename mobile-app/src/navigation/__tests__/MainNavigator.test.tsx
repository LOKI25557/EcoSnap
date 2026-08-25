import React from 'react';
import MainNavigator from '../MainNavigator';
import { useAuth } from '../../context/AuthContext';

// Mock the useAuth hook
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock navigators to return simple identifiers
jest.mock('../TabNavigator', () => {
  return function MockTabNavigator() { return null; };
});

jest.mock('../AuthNavigator', () => {
  return function MockAuthNavigator() { return null; };
});

describe('MainNavigator Navigation Flows', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should display loading indicator when isLoading is true', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: true,
    });

    const element = MainNavigator();
    
    // Check that we returned a View containing ActivityIndicator
    expect(element.type.displayName || element.type.name || element.type).toBe('View');
    const child = element.props.children;
    expect(child.type.displayName || child.type.name || child.type).toBe('ActivityIndicator');
    expect(child.props.size).toBe('large');
  });

  test('should render AuthNavigator when user is unauthenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
    });

    const element = MainNavigator();
    
    // Check that it returns NavigationContainer containing AuthNavigator
    expect(element.props.children.type.name).toBe('MockAuthNavigator');
  });

  test('should render TabNavigator when user is authenticated', () => {
    const mockUser = {
      uid: 'authenticated_user_123',
      email: 'test@example.com',
      displayName: 'Jane Doe',
    };

    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
    });

    const element = MainNavigator();
    
    // Check that it returns NavigationContainer containing TabNavigator
    expect(element.props.children.type.name).toBe('MockTabNavigator');
  });
});
