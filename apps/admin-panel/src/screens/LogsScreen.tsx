import { useLogs } from '@app/infrastructure';
import { Button, Modal, useToast } from '@app/ui-kit';
import { ChevronDown, Copy, Eye, Filter, Info, RefreshCw, Search, X } from '@tamagui/lucide-icons';
import React, { useState } from 'react';
import { Clipboard } from 'react-native';
import {
    Accordion,
    Input,
    ScrollView,
    Select,
    Spinner,
    Square,
    Text,
    XStack,
    YStack,
} from 'tamagui';

// ... (other imports)

const LOG_LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR'] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Badge({ children, backgroundColor, width, ..._rest }: { children: React.ReactNode; backgroundColor?: any, width?: any }) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const dummy = _rest;
    return (
        <XStack
            backgroundColor={backgroundColor || '$neutral100'}
            paddingHorizontal="$2"
            paddingVertical="$0.5"
            borderRadius="$2"
            alignItems="center"
            justifyContent="center"
            width={width}
        >
            {children}
        </XStack>
    );
}
type LogLevel = typeof LOG_LEVELS[number];

interface LogEntry {
    _id: string;
    level: LogLevel;
    timestamp: number;
    message: string;
    userId?: string;
    sessionId?: string;
    traceId?: string;
    app?: string;
    device?: {
        model?: string;
        osName?: string;
        osVersion?: string;
        appVersion?: string;
        buildNumber?: string;
        networkType?: string;
        batteryLevel?: number;
    };
    error?: unknown;
    context?: unknown;
    breadcrumbs?: {
        timestamp: number;
        category: string;
        message: string;
    }[];
}

export function LogsScreen() {
    const [filterLevel, setFilterLevel] = useState<LogLevel | undefined>(undefined);
    const [filterUser, setFilterUser] = useState<string>('');
    const [filterSession, setFilterSession] = useState<string>('');
    const { showToast } = useToast();

    const [isFullLogModalOpen, setIsFullLogModalOpen] = useState(false);
    const [fullData, setFullData] = useState<LogEntry | null>(null);

    const openFullLog = (data: LogEntry) => {
        setFullData(data);
        setIsFullLogModalOpen(true);
    };

    const copyToClipboard = () => {
        if (fullData) {
            Clipboard.setString(JSON.stringify(fullData, null, 2));
            showToast({
                title: 'Copied',
                message: 'JSON copied to clipboard',
                variant: 'success',
            });
        }
    };

    // Use infrastructure hook
    const { results: logs, status, loadMore } = useLogs(50); // Note: filters not yet supported in useLogs hook, assuming useLogs handles basic listing for now.

    return (
        <YStack flex={1} padding="$4" gap="$4">
            {/* Filters Toolbar */}
            <YStack paddingHorizontal="$4" paddingVertical="$3" borderBottomWidth={1} borderColor="$borderColor">
                <XStack gap="$4" alignItems="center" flexWrap="wrap">
                    <XStack alignItems="center" gap="$2">
                        <Filter size={16} />
                        <Text fontWeight="bold">Filters:</Text>
                    </XStack>

                    {/* Level Filter */}
                    <Select value={filterLevel || 'all'} onValueChange={(v) => setFilterLevel(v === 'all' ? undefined : v as LogLevel)}>
                        <Select.Trigger width={120} iconAfter={ChevronDown}>
                            <Select.Value placeholder="Level" />
                        </Select.Trigger>
                        <Select.Content>
                            <Select.ScrollUpButton />
                            <Select.Viewport>
                                <Select.Item index={0} key="all" value="all">
                                    <Select.ItemText>All Levels</Select.ItemText>
                                </Select.Item>
                                {LOG_LEVELS.map((level, i) => (
                                    <Select.Item index={i + 1} key={level} value={level}>
                                        <Select.ItemText>{level}</Select.ItemText>
                                    </Select.Item>
                                ))}
                            </Select.Viewport>
                            <Select.ScrollDownButton />
                        </Select.Content>
                    </Select>

                    {/* User Filter */}
                    <XStack alignItems="center" gap="$2" borderColor="$borderColor" borderWidth={1} borderRadius="$4" paddingHorizontal="$2">
                        <Search size={14} opacity={0.5} />
                        <Input
                            unstyled
                            placeholder="User ID"
                            value={filterUser}
                            onChangeText={setFilterUser}
                            width={150}
                            fontSize="$3"
                        />
                        {filterUser.length > 0 && <Button size="small" circular icon={X} chromeless onPress={() => setFilterUser('')} />}
                    </XStack>
                    {/* Session Filter */}
                    <XStack alignItems="center" gap="$2" borderColor="$borderColor" borderWidth={1} borderRadius="$4" paddingHorizontal="$2">
                        <Search size={14} opacity={0.5} />
                        <Input
                            unstyled
                            placeholder="Session ID"
                            value={filterSession}
                            onChangeText={setFilterSession}
                            width={150}
                            fontSize="$3"
                        />
                        {filterSession.length > 0 && <Button size="small" circular icon={X} chromeless onPress={() => setFilterSession('')} />}
                    </XStack>

                    <Button icon={RefreshCw} onPress={() => {/* Convex updates automatically, but verify */ }}>Refresh</Button>
                </XStack>
            </YStack>

            {/* Log Feed */}
            <YStack
                flex={1}
                backgroundColor="$background"
                overflow="hidden"
            >
                {status === 'LoadingFirstPage' ? (
                    <YStack flex={1} alignItems="center" justifyContent="center" padding="$8">
                        <Spinner size="large" />
                        <Text marginTop="$3" opacity={0.6}>Loading logs...</Text>
                    </YStack>
                ) : logs.length === 0 ? (
                    <YStack flex={1} alignItems="center" justifyContent="center" padding="$8" gap="$3">
                        <Info size={48} opacity={0.2} />
                        <Text fontSize="$5" fontWeight="bold" opacity={0.5}>No logs found</Text>
                    </YStack>
                ) : (
                    <ScrollView
                        onScroll={({ nativeEvent }) => {
                            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
                            if (isCloseToBottom && status === "CanLoadMore") {
                                loadMore(50);
                            }
                        }}
                        scrollEventThrottle={400}
                    >
                        <Accordion type="multiple">
                            {logs.map((item: LogEntry) => (
                                <Accordion.Item
                                    key={item._id}
                                    value={item._id}
                                    marginBottom="$2"
                                    borderRadius="$4"
                                    borderWidth={1}
                                    borderColor="$borderColor"
                                    overflow="hidden"
                                    backgroundColor="$background"
                                >
                                    <Accordion.Trigger
                                        flexDirection="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        padding="$3"
                                        backgroundColor="$background"
                                        hoverStyle={{ backgroundColor: '$backgroundHover' }}
                                        cursor="pointer"
                                    >
                                        {({ open }: { open: boolean }) => (
                                            <>
                                                <XStack gap="$3" flex={1} alignItems="center">
                                                    <Badge
                                                        width={60}
                                                        backgroundColor={
                                                            (item.level === 'ERROR'
                                                                ? '$error'
                                                                : item.level === 'WARN'
                                                                    ? '$warning'
                                                                    : item.level === 'INFO'
                                                                        ? '$info'
                                                                        : '$neutral600')
                                                        }
                                                    >
                                                        <Text color="white" fontSize="$1" fontWeight="bold">
                                                            {item.level}
                                                        </Text>
                                                    </Badge>
                                                    <Text fontSize="$3" opacity={0.5} width={80}>
                                                        {new Date(item.timestamp).toLocaleTimeString()}
                                                    </Text>
                                                    <Text fontWeight="600" fontSize="$4" flex={1} numberOfLines={open ? undefined : 1}>
                                                        {item.message}
                                                    </Text>
                                                    {!open && (
                                                        <XStack gap="$2">
                                                            {item.app && (
                                                                <Badge backgroundColor="$neutral200">
                                                                    <Text fontSize="$1" opacity={0.6}>{item.app}</Text>
                                                                </Badge>
                                                            )}
                                                            {item.device?.model && (
                                                                <Badge backgroundColor="$neutral200">
                                                                    <Text fontSize="$1" opacity={0.6}>{item.device.model}</Text>
                                                                </Badge>
                                                            )}
                                                        </XStack>
                                                    )}
                                                </XStack>
                                                <Square rotate={open ? '180deg' : '0deg'} marginLeft="$3">
                                                    <ChevronDown size={18} color="$textSecondary" />
                                                </Square>
                                            </>
                                        )}
                                    </Accordion.Trigger>

                                    <Accordion.HeightAnimator>
                                        <Accordion.Content

                                            padding="$4"
                                            backgroundColor="$backgroundHover"
                                        >
                                            <YStack gap="$4">
                                                <XStack justifyContent="space-between" alignItems="center">
                                                    <Text fontSize="$2" fontWeight="600" color="$textSecondary" textTransform="uppercase">Log Entry Details</Text>
                                                    <Button
                                                        size="small"
                                                        icon={Eye}
                                                        variant="outlined"
                                                        onPress={() => openFullLog(item)}
                                                    >
                                                        View Full Log
                                                    </Button>
                                                </XStack>
                                                <XStack justifyContent="space-between" flexWrap="wrap" gap="$6">
                                                    <YStack gap="$2" flex={1} minWidth={250}>
                                                        <Text fontSize="$2" fontWeight="600" color="$textSecondary" textTransform="uppercase">Context</Text>
                                                        <DetailRow label="Trace ID" value={item.traceId} />
                                                        <DetailRow label="User ID" value={item.userId} />
                                                        <DetailRow label="Session ID" value={item.sessionId} />
                                                        <DetailRow label="App" value={item.app} />
                                                    </YStack>

                                                    {item.device && (
                                                        <YStack gap="$2" flex={1} minWidth={250}>
                                                            <Text fontSize="$2" fontWeight="600" color="$textSecondary" textTransform="uppercase">Device Info</Text>
                                                            <DetailRow label="Model" value={item.device.model} />
                                                            <DetailRow label="OS" value={item.device.osName && item.device.osVersion ? `${item.device.osName} ${item.device.osVersion}` : item.device.osName || item.device.osVersion} />
                                                            <DetailRow label="Network" value={item.device.networkType} />
                                                            <DetailRow label="Battery" value={item.device.batteryLevel !== undefined && item.device.batteryLevel !== null ? `${Math.round(item.device.batteryLevel * 100)}%` : undefined} />
                                                            <DetailRow label="Version" value={item.device.appVersion ? `${item.device.appVersion} (${item.device.buildNumber})` : undefined} />
                                                        </YStack>

                                                    )}
                                                </XStack>

                                                {item.error && (
                                                    <YStack gap="$2">
                                                        <Text fontSize="$2" fontWeight="600" color="$textSecondary" textTransform="uppercase">Error Details</Text>
                                                        <YStack padding="$3" backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$error">
                                                            <Text color="$error" fontSize="$3" fontFamily="$mono">
                                                                {JSON.stringify(item.error, null, 2)}
                                                            </Text>
                                                        </YStack>
                                                    </YStack>
                                                )}

                                                {item.context && (
                                                    <YStack gap="$2">
                                                        <Text fontSize="$2" fontWeight="600" color="$textSecondary" textTransform="uppercase">Full Context</Text>
                                                        <YStack padding="$3" backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor">
                                                            <Text fontSize="$3" fontFamily="$mono">
                                                                {JSON.stringify(item.context, null, 2)}
                                                            </Text>
                                                        </YStack>
                                                    </YStack>
                                                )}

                                                {item.breadcrumbs && item.breadcrumbs.length > 0 && (
                                                    <YStack gap="$2">
                                                        <Text fontSize="$2" fontWeight="600" color="$textSecondary" textTransform="uppercase">Breadcrumbs</Text>
                                                        <YStack gap="$2" backgroundColor="$background" padding="$3" borderRadius="$4" borderWidth={1} borderColor="$borderColor">
                                                            {item.breadcrumbs.map((crumb: { timestamp: number; category: string; message: string }, i: number) => (
                                                                <XStack key={i} gap="$3" alignItems="center">
                                                                    <Text fontSize="$2" opacity={0.5} width={70}>{new Date(crumb.timestamp).toLocaleTimeString()}</Text>
                                                                    <Badge width={60} backgroundColor="$neutral200">
                                                                        <Text fontSize="$1" fontWeight="bold">{crumb.category}</Text>
                                                                    </Badge>
                                                                    <Text fontSize="$3" flex={1}>{crumb.message}</Text>
                                                                </XStack>
                                                            ))}
                                                        </YStack>
                                                    </YStack>
                                                )}
                                            </YStack>
                                        </Accordion.Content>
                                    </Accordion.HeightAnimator>
                                </Accordion.Item>
                            ))}
                        </Accordion>
                    </ScrollView>
                )}
            </YStack>

            <Modal
                open={isFullLogModalOpen}
                onClose={() => setIsFullLogModalOpen(false)}
                title="Log Details"
                footer={
                    <Button icon={Copy} onPress={copyToClipboard} variant="primary">
                        Copy JSON
                    </Button>
                }
            >
                <YStack gap="$4" maxHeight={500}>
                    <ScrollView>
                        <YStack padding="$3" backgroundColor="$backgroundPress" borderRadius="$4" borderWidth={1} borderColor="$borderColor">
                            <Text fontSize="$3" fontFamily="$mono">
                                {fullData ? JSON.stringify(fullData, null, 2) : ''}
                            </Text>
                        </YStack>
                    </ScrollView>
                </YStack>
            </Modal>
        </YStack>
    );
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
    if (value === undefined || value === null) return null;
    return (
        <XStack gap="$2">
            <Text fontSize="$2" fontWeight="600" width={100} color="$textSecondary">{label}:</Text>
            <Text fontSize="$2" flex={1}>{value}</Text>
        </XStack>
    );
}


