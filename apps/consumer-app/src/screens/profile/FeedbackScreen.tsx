import { useCurrentUser, useCreateFeedback, useGenerateUploadUrl, useMyFeedback } from '@app/infrastructure';
import { Button, useToast, TopBarIconButton } from '@app/ui-kit';
import { ChevronDown, Check, Upload, File, ChevronLeft } from '@tamagui/lucide-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { YStack, Text, TextArea, Select, Sheet, Adapt, Label, XStack, Spinner } from 'tamagui';

export function FeedbackScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const createFeedback = useCreateFeedback();
    const generateUploadUrl = useGenerateUploadUrl();
    const user = useCurrentUser();
    const myFeedback = useMyFeedback() || [];

    const [type, setType] = useState('bug');
    const [message, setMessage] = useState('');
    const [attachment, setAttachment] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!message.trim()) {
            showToast({ title: 'Error', message: 'Please enter a message.', variant: 'error' });
            return;
        }

        if (!user) return;

        setIsSubmitting(true);
        try {
            let storageId = undefined;
            if (attachment) {
                const postUrl = await generateUploadUrl();
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": attachment.mimeType || "application/octet-stream" },
                    body: await fetch(attachment.uri).then(r => r.blob()),
                });
                const { storageId: sid } = await result.json();
                storageId = sid;
            }

            await createFeedback({
                name: user.name || 'Anonymous',
                contact: user.email || user.phoneNumber || 'No contact',
                type,
                message,
                attachment: storageId,
            });

            showToast({ title: 'Feedback Sent', message: 'Thank you for your feedback!', variant: 'success' });
            setMessage('');
            setAttachment(null);
            setType('bug');
        } catch (error) {
            console.error(error);
            showToast({ title: 'Error', message: 'Failed to send feedback.', variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setAttachment(result.assets[0]);
            }
        } catch (err) {
            console.warn(err);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <XStack alignItems="center" space="$2" padding="$2" borderBottomWidth={1} borderColor="$borderColor">
                <TopBarIconButton
                    onPress={() => router.back()}
                    backgroundColor="$background"
                    shadowColor="$shadowColor"
                    shadowRadius={4}
                    shadowOpacity={0.1}
                >
                    <ChevronLeft size={24} color="$textPrimary" />
                </TopBarIconButton>
                <Text fontSize="$5" fontWeight="bold">Send Feedback</Text>
            </XStack>
            <ScrollView>
                <YStack padding="$4" space="$4" paddingBottom="$10">
                    <Text color="$color" opacity={0.7}>We value your input! Let us know about bugs, features, or general improvements.</Text>

                    <YStack space="$2">
                        <Label>Feedback Type</Label>
                        <Select value={type} onValueChange={setType}>
                            <Select.Trigger iconAfter={ChevronDown}>
                                <Select.Value placeholder="Select type" />
                            </Select.Trigger>
                            <Adapt when="sm" platform="touch">
                                <Sheet modal dismissOnSnapToBottom>
                                    <Sheet.Frame>
                                        <Sheet.ScrollView>
                                            <Adapt.Contents />
                                        </Sheet.ScrollView>
                                    </Sheet.Frame>
                                    <Sheet.Overlay />
                                </Sheet>
                            </Adapt>
                            <Select.Content>
                                <Select.Viewport>
                                    <Select.Group>
                                        <Select.Label>Types</Select.Label>
                                        <Select.Item index={0} value="bug"><Select.ItemText>Bug Report</Select.ItemText><Select.ItemIndicator marginLeft="auto"><Check size={16} /></Select.ItemIndicator></Select.Item>
                                        <Select.Item index={1} value="feature"><Select.ItemText>Feature Request</Select.ItemText><Select.ItemIndicator marginLeft="auto"><Check size={16} /></Select.ItemIndicator></Select.Item>
                                        <Select.Item index={2} value="improvement"><Select.ItemText>Improvement</Select.ItemText><Select.ItemIndicator marginLeft="auto"><Check size={16} /></Select.ItemIndicator></Select.Item>
                                        <Select.Item index={3} value="other"><Select.ItemText>Other</Select.ItemText><Select.ItemIndicator marginLeft="auto"><Check size={16} /></Select.ItemIndicator></Select.Item>
                                    </Select.Group>
                                </Select.Viewport>
                            </Select.Content>
                        </Select>
                    </YStack>

                    <YStack space="$2">
                        <Label>Message</Label>
                        <TextArea
                            value={message}
                            onChangeText={setMessage}
                            placeholder="Tell us more..."
                            minHeight={100}
                        />
                    </YStack>

                    <YStack space="$2">
                        <Button variant="outlined" icon={Upload} onPress={handlePickDocument}>
                            {attachment ? 'Change Attachment' : 'Attach Screenshot/File'}
                        </Button>
                        {attachment && (
                            <XStack alignItems="center" space="$2">
                                <File size={16} />
                                <Text fontSize="$2" numberOfLines={1} flex={1}>{attachment.name}</Text>
                            </XStack>
                        )}
                    </YStack>

                    <Button onPress={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? <Spinner color="white" /> : 'Submit Feedback'}
                    </Button>

                    {myFeedback && myFeedback.length > 0 && (
                        <YStack marginTop="$6" space="$3">
                            <Text fontSize="$5" fontWeight="bold">My Feedback History</Text>
                            {myFeedback.map((item) => (
                                <YStack key={item._id} padding="$3" borderWidth={1} borderColor="$borderColor" borderRadius="$3" space="$2">
                                    <XStack justifyContent="space-between">
                                        <Text fontWeight="600" textTransform="capitalize">{item.type}</Text>
                                        <Text color={item.status === 'Replied' ? '$success' : '$color'} opacity={0.7} fontSize="$2">{item.status}</Text>
                                    </XStack>
                                    <Text numberOfLines={2} opacity={0.8}>{item.message}</Text>
                                    {item.replies && item.replies.length > 0 && (
                                        <YStack backgroundColor="$backgroundHover" padding="$2" borderRadius="$2" marginTop="$2">
                                            <Text fontWeight="600" fontSize="$2" color="$primary">Admin Reply:</Text>
                                            <Text fontSize="$2">{item.replies[item.replies.length - 1].message}</Text>
                                        </YStack>
                                    )}
                                </YStack>
                            ))}
                        </YStack>
                    )}
                </YStack>
            </ScrollView>
        </SafeAreaView>
    );
}
