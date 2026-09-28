import { tokens } from '@app/ui-kit/theme';
import { router } from 'expo-router';
import React, { Component, ErrorInfo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { logger } from '../lib/logger';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isDetailsExpanded: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isDetailsExpanded: false,
    };
  }

  static getDerivedStateFromError(error: unknown): State {
    const safeError = error instanceof Error ? error : new Error(String(error));
    return {
      hasError: true,
      error: safeError,
      errorInfo: null,
      isDetailsExpanded: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    logger.error('Unhandled React Exception', error, {
      componentStack: errorInfo.componentStack,
      platform: Platform.OS,
    });
  }

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, isDetailsExpanded: false });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, isDetailsExpanded: false });
    router.replace('/(app)/(tabs)');
  };

  toggleDetails = () => {
    this.setState((prev) => ({ isDetailsExpanded: !prev.isDetailsExpanded }));
  };

  render() {
    if (this.state.hasError) {
      // NOTE: this fallback must stay free of Tamagui (and any other
      // theme-context component). ErrorBoundary wraps StyleSwipeProvider,
      // so themed components here throw "Missing theme", unmount the app,
      // and mask the original error. Plain react-native primitives only.
      return (
        <View style={styles.screen}>
          <View style={styles.card}>
            <Text style={styles.title}>Oops! Something went wrong.</Text>
            <Text style={styles.message}>
              We encountered an unexpected error. Please try again or return home.
            </Text>

            <View style={styles.actions}>
              <Pressable style={[styles.button, styles.buttonSecondary]} onPress={this.handleGoHome}>
                <Text style={styles.buttonSecondaryText}>Go Home</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.buttonPrimary]} onPress={this.handleTryAgain}>
                <Text style={styles.buttonPrimaryText}>Try Again</Text>
              </Pressable>
            </View>

            {__DEV__ && this.state.error && (
              <View style={styles.details}>
                <Pressable style={[styles.button, styles.buttonSecondary]} onPress={this.toggleDetails}>
                  <Text style={styles.buttonSecondaryText}>
                    {this.state.isDetailsExpanded ? 'Hide Details' : 'Error Details'}
                  </Text>
                </Pressable>
                {this.state.isDetailsExpanded && (
                  <ScrollView style={styles.detailsBox}>
                    <Text style={styles.detailsError}>{this.state.error.message}</Text>
                    {this.state.errorInfo?.componentStack && (
                      <Text style={styles.detailsStack}>{this.state.errorInfo.componentStack}</Text>
                    )}
                  </ScrollView>
                )}
              </View>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.color.background.val,
    padding: 16,
  },
  card: {
    backgroundColor: tokens.color.surface.val,
    padding: 24,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: tokens.color.neutral300.val,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: tokens.color.textPrimary.val,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: tokens.color.textSecondary.val,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%',
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: tokens.color.primary.val,
  },
  buttonPrimaryText: {
    color: tokens.color.textOnPrimary.val,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tokens.color.neutral300.val,
  },
  buttonSecondaryText: {
    color: tokens.color.textPrimary.val,
    fontWeight: '600',
  },
  details: {
    width: '100%',
    marginTop: 16,
  },
  detailsBox: {
    maxHeight: 200,
    marginTop: 8,
    backgroundColor: tokens.color.backgroundSecondary.val,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.color.neutral300.val,
  },
  detailsError: {
    fontSize: 12,
    color: tokens.color.error.val,
    fontWeight: 'bold',
  },
  detailsStack: {
    fontSize: 10,
    color: tokens.color.textSecondary.val,
    marginTop: 8,
  },
});
