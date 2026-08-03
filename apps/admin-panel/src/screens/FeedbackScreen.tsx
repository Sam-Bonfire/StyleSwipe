import { useAdminFeedback, useUpdateFeedbackStatus, useReplyToFeedback, useCurrentUser } from '@app/infrastructure';
import { Button, useToast } from '@app/ui-kit';
import { Search, X, Send, ChevronDown } from '@tamagui/lucide-icons';
import React, { useState } from 'react';
import {
    YStack,
    Text,
    XStack,
    H3,
    Spinner,
    Input,
    TextArea,
    ScrollView,
    Avatar,
    Accordion,
    Square,
    Circle,
} from 'tamagui';


interface FeedbackReply {
    message: string;
    timestamp: number;
}

interface Feedback {
    _id: string;
    name?: string;
    email?: string;
    message: string;
    type: string;
    status: string;
    createdAt: number;
    contact?: string;
    replies?: FeedbackReply[];
}

export function FeedbackScreen() {
    const { showToast } = useToast();
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
    const [replyMessage, setReplyMessage] = useState('');

    const { results: feedback, status, loadMore } = useAdminFeedback(20);
    const updateStatus = useUpdateFeedbackStatus();
    const reply = useReplyToFeedback();
    const currentUser = useCurrentUser();
    const isCoreAdmin = currentUser?.isCoreAdmin;

    const handleReply = async () => {
        if (!replyMessage.trim() || !selectedFeedback) return;
        try {
            await reply({ id: selectedFeedback._id, message: replyMessage });
            showToast({ title: 'Reply Sent', message: 'Reply sent successfully.', variant: 'success' });
            setReplyMessage('');
        } catch (error) {
            console.error(error);
            showToast({ title: 'Error', message: 'Failed to send reply.', variant: 'error' });
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await updateStatus({ id: id, status: newStatus });
            showToast({ title: 'Status Updated', message: `Status changed to ${newStatus}.`, variant: 'success' });
            if (selectedFeedback && selectedFeedback._id === id) {
                setSelectedFeedback({ ...selectedFeedback, status: newStatus });
            }
        } catch (error) {
            console.error(error);
            showToast({ title: 'Error', message: 'Failed to update status.', variant: 'error' });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return '$error';
            case 'Resolved': return '$success';
            case 'Replied': return '$info';
            default: return '$warning';
        }
    };


    return (
        <YStack flex={1} backgroundColor="$background">
            {/* Header Section */}
            <YStack paddingHorizontal="$4" paddingTop="$4" paddingBottom="$2" gap="$4" borderBottomWidth={1} borderColor="$borderColor">
                <YStack>
                    <H3>Inbox</H3>
                    <Text fontSize="$3" opacity={0.6}>Manage user feedback and support</Text>
                </YStack>

                <XStack gap="$3" alignItems="center">
                    <XStack flex={1} alignItems="center" backgroundColor="$backgroundHover" borderRadius="$4" paddingHorizontal="$3" height={40}>
                        <Search size={16} opacity={0.5} />
                        <Input
                            flex={1}
                            unstyled
                            placeholder="Search feedback..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            marginLeft="$2"
                        />
                        {searchQuery.length > 0 && (
                            <Button size="small" circular icon={X} chromeless onPress={() => setSearchQuery('')} />
                        )}
                    </XStack>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {['Open', 'Read', 'Replied', 'Resolved'].map(status => (
                            <Button
                                key={status}
                                size="medium"
                                br="$4"
                                variant={statusFilter === status ? 'primary' : 'outlined'}
                                onPress={() => setStatusFilter(statusFilter === status ? null : status)}
                                scaleIcon={1.2}
                            >
                                {status}
                            </Button>
                        ))}
                    </ScrollView>
                </XStack>
            </YStack>

            {/* List */}
            <YStack
                flex={1}
                backgroundColor="$background"
                overflow="hidden"
            >
                {status === 'LoadingFirstPage' ? (
                    <YStack flex={1} alignItems="center" justifyContent="center" padding="$8">
                        <Spinner size="large" />
                        <Text marginTop="$3" opacity={0.6}>Loading feedback...</Text>
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
                            {feedback.map((item: Feedback) => (
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
                                        padding="$4"
                                        backgroundColor="$background"
                                        hoverStyle={{ backgroundColor: '$backgroundHover' }}
                                        cursor="pointer"
                                    >
                                        {({ open }: { open: boolean }) => (
                                            <>
                                                <XStack gap="$4" flex={1} alignItems="flex-start">
                                                    <Avatar circular size="$4" backgroundColor="$backgroundHover">
                                                        <Avatar.Fallback backgroundColor="$infoLight" alignItems="center" justifyContent="center">
                                                            <Text fontSize="$3" fontWeight="bold" color="$info">
                                                                {item.name ? item.name.substring(0, 2).toUpperCase() : 'U'}
                                                            </Text>
                                                        </Avatar.Fallback>
                                                    </Avatar>

                                                    <YStack flex={1} gap="$1">
                                                        <XStack justifyContent="space-between" alignItems="center">
                                                            <Text fontWeight="bold" fontSize="$4" color="$color">{item.name}</Text>
                                                            <Text fontSize="$2" opacity={0.5}>
                                                                {new Date(item.createdAt).toLocaleDateString()}
                                                            </Text>
                                                        </XStack>

                                                        <XStack gap="$2" alignItems="center">
                                                            <Text fontSize="$2" fontWeight="600" opacity={0.6} textTransform="uppercase">{item.type}</Text>
                                                            <Circle size={6} backgroundColor={getStatusColor(item.status)} />
                                                            <Text fontSize="$2" fontWeight="600" color={getStatusColor(item.status)}>{item.status}</Text>
                                                        </XStack>

                                                        {!open && (
                                                            <Text fontSize="$3" opacity={0.7} numberOfLines={1} ellipsizeMode="tail">
                                                                {item.message}
                                                            </Text>
                                                        )}
                                                    </YStack>
                                                </XStack>
                                                <Square rotate={open ? '180deg' : '0deg'} marginLeft="$3">
                                                    <ChevronDown size={20} color="$textSecondary" />
                                                </Square>
                                            </>
                                        )}
                                    </Accordion.Trigger>

                                    <Accordion.HeightAnimator>
                                        <Accordion.Content

                                            padding="$4"
                                            backgroundColor="$backgroundHover"
                                            overflow="hidden"
                                        >
                                            <YStack gap="$4">
                                                <XStack justifyContent="space-between" flexWrap="wrap" gap="$4">
                                                    <YStack gap="$2" flex={1} minWidth={200}>
                                                        <Text fontSize="$2" fontWeight="600" color="$textSecondary" textTransform="uppercase">Details</Text>
                                                        <XStack justifyContent="space-between">
                                                            <Text fontSize="$3" opacity={0.6}>Contact</Text>
                                                            <Text fontSize="$3" fontWeight="500">{item.contact}</Text>
                                                        </XStack>
                                                        <XStack justifyContent="space-between">
                                                            <Text fontSize="$3" opacity={0.6}>ID</Text>
                                                            <Text fontSize="$3" fontFamily="$mono">{item._id.slice(-12)}</Text>
                                                        </XStack>
                                                    </YStack>

                                                    <YStack gap="$2" flex={1} minWidth={200}>
                                                        <Text fontSize="$2" fontWeight="600" color="$textSecondary" textTransform="uppercase">Status Control</Text>
                                                        <XStack gap="$2">
                                                            { }
                                                            {['Open', 'Read', 'Resolved'].map(s => (
                                                                <Button
                                                                    key={s}
                                                                    size="small"
                                                                    variant={item.status === s ? 'primary' : 'outlined'}
                                                                    onPress={() => handleStatusUpdate(item._id, s)}
                                                                >
                                                                    {s}
                                                                </Button>
                                                            ))}
                                                        </XStack>
                                                    </YStack>
                                                </XStack>

                                                <YStack gap="$2">
                                                    <Text fontSize="$2" fontWeight="600" color="$textSecondary" textTransform="uppercase">Message</Text>
                                                    <YStack padding="$4" backgroundColor="$backgroundPress" borderRadius="$4" borderWidth={1} borderColor="$borderColor">
                                                        <Text fontSize="$4" lineHeight={22}>{item.message}</Text>
                                                    </YStack>
                                                </YStack>

                                                {item.replies && item.replies.length > 0 && (
                                                    <YStack gap="$2">
                                                        <Text fontSize="$2" fontWeight="600" color="$textSecondary" textTransform="uppercase">History</Text>
                                                        {item.replies.map((r, i) => (
                                                            <XStack key={i} gap="$3">
                                                                <Avatar circular size="$2" backgroundColor="$neutral200" />
                                                                <YStack flex={1} backgroundColor="$background" padding="$3" borderRadius="$4" borderWidth={1} borderColor="$borderColor">
                                                                    <Text fontSize="$3">{r.message}</Text>
                                                                    <Text fontSize="$2" opacity={0.5} marginTop="$1" textAlign="right">
                                                                        {new Date(r.timestamp).toLocaleString()}
                                                                    </Text>
                                                                </YStack>
                                                            </XStack>
                                                        ))}
                                                    </YStack>
                                                )}

                                                {isCoreAdmin && (
                                                    <YStack gap="$2">
                                                        <Text fontSize="$2" fontWeight="600" color="$textSecondary" textTransform="uppercase">Reply</Text>
                                                        <XStack gap="$2" alignItems="flex-end">
                                                            <TextArea
                                                                flex={1}
                                                                placeholder="Write a reply..."
                                                                numberOfLines={2}
                                                                value={selectedFeedback?._id === item._id ? replyMessage : ''}
                                                                onChangeText={(text) => {
                                                                    if (selectedFeedback?._id !== item._id) {
                                                                        setSelectedFeedback(item);
                                                                    }
                                                                    setReplyMessage(text);
                                                                }}
                                                                borderRadius="$4"
                                                                backgroundColor="$background"
                                                            />
                                                            <Button
                                                                icon={Send}
                                                                circular
                                                                variant="primary"
                                                                onPress={() => {
                                                                    if (selectedFeedback?._id !== item._id) {
                                                                        setSelectedFeedback(item);
                                                                    }
                                                                    handleReply();
                                                                }}
                                                                disabled={!replyMessage.trim() || (selectedFeedback?._id === item._id && !replyMessage.trim())}
                                                            />
                                                        </XStack>
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
        </YStack>
    );
}


