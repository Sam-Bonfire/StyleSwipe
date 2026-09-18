import { AlertTriangle, Home, RefreshCw, ChevronDown, ChevronUp } from '@tamagui/lucide-icons';
import { router } from 'expo-router';
import React, { Component, ErrorInfo } from 'react';
import { Platform } from 'react-native';
import { YStack, XStack, Text, Button, ScrollView } from 'tamagui';

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
      return (
        <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background" padding="$4">
          <YStack
            backgroundColor="$surface"
            padding="$6"
            borderRadius="$4"
            width="100%"
            maxWidth={400}
            alignItems="center"
            gap="$4"
            elevation="$2"
          >
            <AlertTriangle size={48} color="red" />
            <Text fontSize="$6" fontWeight="bold" color="$color" textAlign="center">
              Oops! Something went wrong.
            </Text>
            <Text fontSize="$4" color="$textSecondary" textAlign="center">
              We encountered an unexpected error. Please try again or return home.
            </Text>

            <XStack gap="$3" marginTop="$4" width="100%" justifyContent="center">
              <Button
                flex={1}
                variant="outlined"
                icon={<Home size={18} />}
                onPress={this.handleGoHome}
              >
                Go Home
              </Button>
              <Button
                flex={1}
                backgroundColor="$primary"
                icon={<RefreshCw size={18} />}
                onPress={this.handleTryAgain}
              >
                Try Again
              </Button>
            </XStack>

            {__DEV__ && this.state.error && (
              <YStack width="100%" marginTop="$4">
                <Button
                  variant="outlined"
                  size="$3"
                  iconAfter={this.state.isDetailsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  onPress={this.toggleDetails}
                >
                  Error Details
                </Button>
                {this.state.isDetailsExpanded && (
                  <ScrollView
                    maxHeight={200}
                    marginTop="$2"
                    backgroundColor="$background"
                    padding="$2"
                    borderRadius="$2"
                    borderWidth={1}
                    borderColor="$borderColor"
                  >
                    <Text fontSize="$2" color="red" fontWeight="bold">
                      {this.state.error.message}
                    </Text>
                    {this.state.errorInfo?.componentStack && (
                      <Text fontSize="$1" color="$textSecondary" marginTop="$2">
                        {this.state.errorInfo.componentStack}
                      </Text>
                    )}
                  </ScrollView>
                )}
              </YStack>
            )}
          </YStack>
        </YStack>
      );
    }

    return this.props.children;
  }
}
