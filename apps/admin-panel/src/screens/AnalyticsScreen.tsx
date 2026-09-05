import { 
  useAvailableVariants, 
  useFunnelMetrics, 
  useMacroFunnelMetrics 
} from '@app/infrastructure';
import {
  ChevronDown, ChevronUp, Check, Activity,
  Flag, User, Sparkles, Ruler, Palette, CheckSquare, Trophy,
  UserCheck, Eye, MoveRight, ExternalLink, PieChart
} from '@tamagui/lucide-icons';
import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { YStack, XStack, Text, H2, Card, Spinner, Select, Adapt, Sheet, Separator } from 'tamagui';

type TimeRange = '7_days' | '30_days' | 'all_time';

export function AnalyticsScreen() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7_days');
  
  const [funnelVariant, setFunnelVariant] = useState<string>('onboarding_v1');
  const [macroVariant, setMacroVariant] = useState<string>('macro_v1');

  const availableVariants = useAvailableVariants() || [];

  const funnelData = useFunnelMetrics(timeRange, funnelVariant);
  const macroData = useMacroFunnelMetrics(timeRange, macroVariant);

  const renderVariantSelector = (
    value: string, 
    onChange: (val: string) => void, 
    fallbackOptions: string[]
  ) => {
    return (
      <Select value={value} onValueChange={onChange} disablePreventBodyScroll size="$2">
        <Select.Trigger width={140} iconAfter={ChevronDown} backgroundColor="$surface" borderColor="$borderColor" paddingVertical={0}>
          <Select.Value placeholder="Variant" fontSize="$2" />
        </Select.Trigger>
        <Adapt when="sm" platform="touch">
          <Sheet modal dismissOnSnapToBottom>
            <Sheet.Frame><Sheet.ScrollView><Adapt.Contents /></Sheet.ScrollView></Sheet.Frame>
            <Sheet.Overlay />
          </Sheet>
        </Adapt>
        <Select.Content>
                  <Select.ScrollUpButton alignItems="center" justifyContent="center" h="$3">
                    <YStack><ChevronUp size={20} /></YStack>
                  </Select.ScrollUpButton>
                  <Select.Viewport minWidth={200}>
            <Select.Group>
              <Select.Label>Select Variant</Select.Label>
              {availableVariants.map((variant, index) => (
                <Select.Item key={variant} index={index} value={variant}>
                  <Select.ItemText>{variant}</Select.ItemText>
                  <Select.ItemIndicator marginLeft="auto"><Check size={16} /></Select.ItemIndicator>
                </Select.Item>
              ))}
              {fallbackOptions.map((opt, i) => {
                if (availableVariants.includes(opt)) return null;
                return (
                  <Select.Item key={opt} index={availableVariants.length + i} value={opt}>
                    <Select.ItemText>{opt}</Select.ItemText>
                    <Select.ItemIndicator marginLeft="auto"><Check size={16} /></Select.ItemIndicator>
                  </Select.Item>
                );
              })}
            </Select.Group>
          </Select.Viewport>
          <Select.ScrollDownButton alignItems="center" justifyContent="center" h="$3">
            <YStack zIndex={10}><ChevronDown size={20} /></YStack>
          </Select.ScrollDownButton>
        </Select.Content>
      </Select>
    );
  };

  const renderFunnel = () => {
    if (!funnelData) {
      return (
        <YStack padding="$4" justifyContent="center" alignItems="center">
          <Spinner size="small" color="$primary" />
        </YStack>
      );
    }

    const { started, steps, completed } = funnelData;
    const maxVal = Math.max(started, 1);
    const overallConversion = Math.round((completed / maxVal) * 100);

    const funnelSteps = [
      { label: 'Started', value: started, icon: Flag },
      { label: 'Gender (Q1)', value: steps[1] || 0, icon: User },
      { label: 'Vibe (Q2)', value: steps[2] || 0, icon: Sparkles },
      { label: 'Fit/Sizing (Q3)', value: steps[3] || 0, icon: Ruler },
      { label: 'Colors (Q4)', value: steps[4] || 0, icon: Palette },
      { label: 'Final (Q5)', value: steps[5] || 0, icon: CheckSquare },
      { label: 'Completed', value: completed, icon: Trophy },
    ];

    const visibleSteps = funnelSteps.filter(s => s.value > 0 || s.label === 'Started' || s.label === 'Completed');

    if (started === 0) {
      return (
        <YStack padding="$4" alignItems="center" backgroundColor="$backgroundHover" borderRadius="$4" borderWidth={1} borderColor="$borderColor" marginTop="$2">
          <PieChart size={32} color="$textTertiary" opacity={0.5} />
          <Text color="$textSecondary" marginTop="$2" fontSize="$3">No events for variant: {funnelVariant}.</Text>
        </YStack>
      );
    }

    return (
      <YStack gap="$2" marginTop="$2">
        <XStack backgroundColor="$backgroundHover" padding="$2" paddingHorizontal="$3" borderRadius="$3" alignItems="center" justifyContent="space-between" marginBottom="$1">
          <YStack>
            <Text color="$textSecondary" fontSize="$1" textTransform="uppercase" fontWeight="700" letterSpacing={1}>Overall Conversion</Text>
            <Text color="$primary" fontSize="$5" fontWeight="900" lineHeight="$4">{overallConversion}%</Text>
          </YStack>
          <Activity size={20} color="$primary" opacity={0.5} />
        </XStack>

        <YStack gap="$1">
          {visibleSteps.map((step, index) => {
            const widthPercent = (step.value / maxVal) * 100;
            const dropOff = index > 0 ? visibleSteps[index - 1].value - step.value : 0;
            const dropOffPercent = index > 0 && visibleSteps[index - 1].value > 0
              ? Math.round((dropOff / visibleSteps[index - 1].value) * 100)
              : 0;
            
            const IconComponent = step.icon;
            const isHighDropoff = dropOffPercent > 20;

            return (
              <Card 
                key={step.label}
                backgroundColor="$background" 
                borderRadius="$2"
                borderWidth={1}
                borderColor="$borderColor"
                padding="$1.5"
                paddingHorizontal="$2"
                overflow="hidden"
                position="relative"
              >
                <YStack
                  position="absolute" 
                  top={0} 
                  left={0} 
                  bottom={0} 
                  width={`${widthPercent}%`} 
                  backgroundColor={isHighDropoff ? '$error' : '$primary'} 
                  opacity={0.1} 
                />
                <XStack justifyContent="space-between" alignItems="center" zIndex={1}>
                  <XStack gap="$2" alignItems="center">
                    <YStack backgroundColor="$surface" padding="$1.5" borderRadius="$2" borderWidth={1} borderColor="$borderColor">
                      <IconComponent size={14} color={isHighDropoff ? '$error' : '$primary'} />
                    </YStack>
                    <YStack>
                      <Text fontWeight="bold" fontSize="$2" color="$textPrimary" lineHeight="$2">{step.label}</Text>
                      {index > 0 && dropOff > 0 ? (
                        <Text color={isHighDropoff ? '$error' : '$textSecondary'} fontSize="$1" fontWeight={isHighDropoff ? '600' : '400'}>
                          -{dropOffPercent}% drop ({dropOff})
                        </Text>
                      ) : (
                        <Text color="$textTertiary" fontSize="$1">100% (Baseline)</Text>
                      )}
                    </YStack>
                  </XStack>
                  <YStack alignItems="flex-end">
                    <Text fontSize="$3" fontWeight="800" color="$textPrimary" lineHeight="$3">{step.value}</Text>
                    <Text fontSize="$1" color="$textSecondary" fontWeight="500">{Math.round(widthPercent)}% retention</Text>
                  </YStack>
                </XStack>
              </Card>
            );
          })}
        </YStack>
      </YStack>
    );
  };

  const renderMacroFunnel = () => {
    if (!macroData) {
      return (
        <YStack padding="$4" justifyContent="center" alignItems="center">
          <Spinner size="small" color="$primary" />
        </YStack>
      );
    }

    const { onboardingCompleted, productViewed, productSwiped, affiliateRedirect } = macroData;
    const maxVal = Math.max(onboardingCompleted, 1);
    const overallConversion = Math.round((affiliateRedirect / maxVal) * 100);

    const macroSteps = [
      { label: 'Onboarding Completed', value: onboardingCompleted, icon: UserCheck },
      { label: 'Product Viewed', value: productViewed, icon: Eye },
      { label: 'Product Swiped', value: productSwiped, icon: MoveRight },
      { label: 'Merchant Redirect', value: affiliateRedirect, icon: ExternalLink },
    ];

    if (onboardingCompleted === 0 && productViewed === 0) {
      return (
        <YStack padding="$4" alignItems="center" backgroundColor="$backgroundHover" borderRadius="$4" borderWidth={1} borderColor="$borderColor" marginTop="$2">
          <PieChart size={32} color="$textTertiary" opacity={0.5} />
          <Text color="$textSecondary" marginTop="$2" fontSize="$3">No events for variant: {macroVariant}.</Text>
        </YStack>
      );
    }

    return (
      <YStack gap="$2" marginTop="$2">
        <XStack backgroundColor="$backgroundHover" padding="$2" paddingHorizontal="$3" borderRadius="$3" alignItems="center" justifyContent="space-between" marginBottom="$1">
          <YStack>
            <Text color="$textSecondary" fontSize="$1" textTransform="uppercase" fontWeight="700" letterSpacing={1}>Full Journey Conversion</Text>
            <Text color="$primary" fontSize="$5" fontWeight="900" lineHeight="$4">{overallConversion}%</Text>
          </YStack>
          <Activity size={20} color="$primary" opacity={0.5} />
        </XStack>

        <YStack gap="$1">
          {macroSteps.map((step, index) => {
            const widthPercent = (step.value / maxVal) * 100;
            const dropOff = index > 0 ? macroSteps[index - 1].value - step.value : 0;
            const dropOffPercent = index > 0 && macroSteps[index - 1].value > 0
              ? Math.round((dropOff / macroSteps[index - 1].value) * 100)
              : 0;
            
            const IconComponent = step.icon;
            const isHighDropoff = dropOffPercent > 50; 

            return (
              <Card 
                key={step.label}
                backgroundColor="$background" 
                borderRadius="$2"
                borderWidth={1}
                borderColor="$borderColor"
                padding="$1.5"
                paddingHorizontal="$2"
                overflow="hidden"
                position="relative"
              >
                <YStack
                  position="absolute" 
                  top={0} 
                  left={0} 
                  bottom={0} 
                  width={`${widthPercent}%`} 
                  backgroundColor={isHighDropoff ? '$error' : '$primary'} 
                  opacity={0.1} 
                />
                <XStack justifyContent="space-between" alignItems="center" zIndex={1}>
                  <XStack gap="$2" alignItems="center">
                    <YStack backgroundColor="$surface" padding="$1.5" borderRadius="$2" borderWidth={1} borderColor="$borderColor">
                      <IconComponent size={14} color={isHighDropoff ? '$error' : '$primary'} />
                    </YStack>
                    <YStack>
                      <Text fontWeight="bold" fontSize="$2" color="$textPrimary" lineHeight="$2">{step.label}</Text>
                      {index > 0 && dropOff > 0 ? (
                        <Text color={isHighDropoff ? '$error' : '$textSecondary'} fontSize="$1" fontWeight={isHighDropoff ? '600' : '400'}>
                          -{dropOffPercent}% drop ({dropOff})
                        </Text>
                      ) : (
                        <Text color="$textTertiary" fontSize="$1">Starting Cohort</Text>
                      )}
                    </YStack>
                  </XStack>
                  <YStack alignItems="flex-end">
                    <Text fontSize="$3" fontWeight="800" color="$textPrimary" lineHeight="$3">{step.value}</Text>
                    <Text fontSize="$1" color="$textSecondary" fontWeight="500">{Math.round(widthPercent)}% retention</Text>
                  </YStack>
                </XStack>
              </Card>
            );
          })}
        </YStack>
      </YStack>
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: 'var(--background)' }}>
      {/* Full width container, no maxWidth constraints */}
      <YStack padding="$4" gap="$3" width="100%" paddingBottom="$8">
        
        {/* Header Section */}
        <XStack justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap="$4">
          <YStack flex={1} minWidth={250}>
            <Text color="$primary" fontSize="$1" textTransform="uppercase" fontWeight="800" letterSpacing={1} marginBottom={0}>Dashboard</Text>
            <H2 color="$textPrimary" fontWeight="800" size="$6" lineHeight="$6">Analytics & Conversion</H2>
            <Text color="$textSecondary" fontSize="$2" marginTop="$1">
              Track user progression across acquisition and product funnels side-by-side.
            </Text>
          </YStack>

          <XStack gap="$3" flexWrap="wrap" alignItems="center">
            <YStack gap="$1">
                          <Text fontSize="$1" fontWeight="600" color="$textTertiary" textTransform="uppercase" paddingLeft="$1">Time Range</Text>
              <Select value={timeRange} onValueChange={(val) => setTimeRange(val as TimeRange)} disablePreventBodyScroll size="$2">
                <Select.Trigger width={120} iconAfter={ChevronDown} backgroundColor="$surface" borderColor="$borderColor" paddingVertical={0}>
                  <Select.Value placeholder="Time Range" fontSize="$2" />
                </Select.Trigger>
                <Adapt when="sm" platform="touch">
                  <Sheet modal dismissOnSnapToBottom>
                    <Sheet.Frame><Sheet.ScrollView><Adapt.Contents /></Sheet.ScrollView></Sheet.Frame>
                    <Sheet.Overlay />
                  </Sheet>
                </Adapt>
                <Select.Content>
                                  <Select.ScrollUpButton alignItems="center" justifyContent="center" h="$3">
                                    <YStack><ChevronUp size={20} /></YStack>
                                  </Select.ScrollUpButton>
                                  <Select.Viewport minWidth={150}>
                    <Select.Group>
                      <Select.Label>Time Range</Select.Label>
                      <Select.Item index={0} value="7_days">
                        <Select.ItemText>Last 7 Days</Select.ItemText>
                        <Select.ItemIndicator marginLeft="auto"><Check size={16} /></Select.ItemIndicator>
                      </Select.Item>
                      <Select.Item index={1} value="30_days">
                        <Select.ItemText>Last 30 Days</Select.ItemText>
                        <Select.ItemIndicator marginLeft="auto"><Check size={16} /></Select.ItemIndicator>
                      </Select.Item>
                      <Select.Item index={2} value="all_time">
                        <Select.ItemText>All Time</Select.ItemText>
                        <Select.ItemIndicator marginLeft="auto"><Check size={16} /></Select.ItemIndicator>
                      </Select.Item>
                    </Select.Group>
                  </Select.Viewport>
                  <Select.ScrollDownButton alignItems="center" justifyContent="center" h="$3">
                    <YStack zIndex={10}><ChevronDown size={20} /></YStack>
                  </Select.ScrollDownButton>
                </Select.Content>
              </Select>
            </YStack>
          </XStack>
        </XStack>

        <Separator borderColor="$borderColor" marginVertical="$1" />

        {/* Grid Layout Container */}
        <XStack flexWrap="wrap" gap="$4" width="100%">
          
          {/* Onboarding Funnel Module */}
          <YStack flex={1} minWidth={320} gap="$2">
                      <Card backgroundColor="$surface" borderRadius="$3" borderWidth={1} borderColor="$borderColor" padding="$3">
                                              <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$3" marginBottom="$1">
                                                <YStack>
                                                  <Text fontSize="$4" fontWeight="bold" color="$textPrimary" lineHeight="$4">Onboarding</Text>
                  <Text color="$textSecondary" fontSize="$2">New user setup wizard</Text>
                </YStack>
                {renderVariantSelector(funnelVariant, setFunnelVariant, ['onboarding_v1'])}
              </XStack>
              {renderFunnel()}
            </Card>
          </YStack>

          {/* Macro Journey Module */}
          <YStack flex={1} minWidth={320} gap="$2">
                      <Card backgroundColor="$surface" borderRadius="$3" borderWidth={1} borderColor="$borderColor" padding="$3">
                                              <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$3" marginBottom="$1">
                                                <YStack>
                                                  <Text fontSize="$4" fontWeight="bold" color="$textPrimary" lineHeight="$4">Macro Journey</Text>
                  <Text color="$textSecondary" fontSize="$2">Signup to checkout</Text>
                </YStack>
                {renderVariantSelector(macroVariant, setMacroVariant, ['macro_v1'])}
              </XStack>
              {renderMacroFunnel()}
            </Card>
          </YStack>

        </XStack>
      </YStack>
    </ScrollView>
  );
}
