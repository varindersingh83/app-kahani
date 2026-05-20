import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  CharacterAvatar,
  IconButton,
  KahaniImage,
  KahaniButton,
  KahaniScreen,
  SegmentedControl,
  ThemeToggle,
  cardShadow,
  serifFamily,
} from "@/components/KahaniDesign";
import tokens from "@/constants/colors";
import {
  useStoryStudio,
  type CharacterRelationship,
} from "@/context/StoryContext";
import { useKahaniTheme } from "@/context/ThemeContext";
import { createAnalyticsEvent } from "@/services/analytics";
import { createCartoonCharacterReplacement } from "@/services/cartoonCharacter";
import { decidePhotoCreationFlow } from "@/services/characterPrivacy";
import { getRuntimePhotoExtractionAvailability } from "@/services/photoExtractionGate";
import { buildCharacterDescriptor } from "@/services/photoDescriptors";
import { extractPhotoTraits } from "@/services/photoTraitExtractor";

export default function CharactersScreen() {
  const { colors } = useKahaniTheme();
  const {
    addCharacter,
    characters,
    selectedCharacterId,
    selectCharacter,
    removeCharacter,
  } = useStoryStudio();
  const [name, setName] = useState("");
  const [relationship, setRelationship] =
    useState<CharacterRelationship>("child");
  const relationshipRef = useRef<CharacterRelationship>("child");
  const photoAttemptIdRef = useRef(0);
  const [presentation, setPresentation] = useState<
    "from-photo" | "girl" | "boy"
  >("from-photo");
  const [appearanceNotes, setAppearanceNotes] = useState("");
  const [photoRetryCount, setPhotoRetryCount] = useState(0);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const [manualFallbackVisible, setManualFallbackVisible] = useState(false);
  const [localPhotoDescriptor, setLocalPhotoDescriptor] = useState<
    string | undefined
  >();
  const [temporaryPhotoPreviewUri, setTemporaryPhotoPreviewUri] = useState<
    string | undefined
  >();
  const [characterImageUri, setCharacterImageUri] = useState<
    string | undefined
  >();
  const photoAvailability = useMemo(
    () => getRuntimePhotoExtractionAvailability(Platform.OS),
    [],
  );
  const photoPickerCaption = photoAvailability.available
    ? "The photo is processed on this device and discarded."
    : "If the photo cannot be read locally, Kahani will ask for simple details instead.";
  const previewImageUri = characterImageUri ?? temporaryPhotoPreviewUri;

  const changeRelationship = (nextRelationship: CharacterRelationship) => {
    relationshipRef.current = nextRelationship;
    setRelationship(nextRelationship);
    if (nextRelationship !== "child") {
      setTemporaryPhotoPreviewUri(undefined);
      setCharacterImageUri(undefined);
      setLocalPhotoDescriptor(undefined);
      setManualFallbackVisible(false);
      setPhotoNotice(null);
    }
  };

  const pickPhoto = async () => {
    const attemptId = photoAttemptIdRef.current + 1;
    photoAttemptIdRef.current = attemptId;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photos needed", "Allow photo access to upload an image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      base64: false,
      quality: 0.7,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      if (!asset) return;
      setTemporaryPhotoPreviewUri(asset.uri);
      setCharacterImageUri(undefined);
      setPhotoNotice("Checking this photo on your device...");

      const extraction = await extractPhotoTraits({
        asset: {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
        },
        availability: photoAvailability,
      });
      if (
        relationshipRef.current !== "child" ||
        photoAttemptIdRef.current !== attemptId
      ) {
        setTemporaryPhotoPreviewUri(undefined);
        setCharacterImageUri(undefined);
        setLocalPhotoDescriptor(undefined);
        return;
      }
      const decision = decidePhotoCreationFlow({
        extraction,
        retryCount: photoRetryCount,
      });

      if (decision.action === "save") {
        if (!extraction.ok) return;
        const replacement = createCartoonCharacterReplacement({
          descriptor: decision.appearance,
          relationship,
        });
        if (!replacement.ok) {
          setTemporaryPhotoPreviewUri(undefined);
          setCharacterImageUri(undefined);
          setLocalPhotoDescriptor(undefined);
          setManualFallbackVisible(true);
          setPhotoNotice(
            "Use a few simple details instead. The original photo was not saved.",
          );
          return;
        }
        setLocalPhotoDescriptor(decision.appearance);
        setCharacterImageUri(replacement.imageUri);
        setTemporaryPhotoPreviewUri(undefined);
        setManualFallbackVisible(false);
        setPhotoNotice(
          "Photo checked locally. The original was replaced with a storybook character.",
        );
        void createAnalyticsEvent("photo_check_succeeded", {
          modelVersion: extraction.modelVersion,
          platform: Platform.OS,
          retryCount: photoRetryCount,
        });
        return;
      }

      setLocalPhotoDescriptor(undefined);
      setTemporaryPhotoPreviewUri(undefined);
      setCharacterImageUri(undefined);
      setPhotoNotice(decision.message);
      void createAnalyticsEvent("photo_check_failed", {
        failureCategory: extraction.ok ? "unknown" : extraction.reason,
        platform: Platform.OS,
        retryCount: photoRetryCount,
      });

      if (decision.action === "retry") {
        setPhotoRetryCount((count) => count + 1);
        return;
      }

      setManualFallbackVisible(true);
    }
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert("Add a name", "Enter a name before saving.");
      return;
    }
    const appearance =
      relationship === "child"
        ? localPhotoDescriptor
          ? buildCharacterDescriptor({
              source: "local-photo",
              notes: localPhotoDescriptor,
            })
          : buildCharacterDescriptor({
              presentation,
              notes: manualFallbackVisible ? appearanceNotes : undefined,
              source: manualFallbackVisible ? "manual" : "generic",
            })
        : undefined;
    const childCharacterImageUri =
      relationship === "child" ? characterImageUri : undefined;
    await addCharacter(
      name.trim(),
      undefined,
      relationship,
      appearance,
      localPhotoDescriptor
        ? "local-photo"
        : manualFallbackVisible
          ? "manual"
          : "generic",
      childCharacterImageUri,
      childCharacterImageUri ? "generated-cartoon" : undefined,
    );
    setName("");
    changeRelationship("child");
    setPresentation("from-photo");
    setAppearanceNotes("");
    setPhotoRetryCount(0);
    setPhotoNotice(null);
    setManualFallbackVisible(false);
    setLocalPhotoDescriptor(undefined);
    setTemporaryPhotoPreviewUri(undefined);
    setCharacterImageUri(undefined);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.push("/(tabs)");
  };

  return (
    <KahaniScreen withLeaves={false}>
      <View style={styles.topControls}>
        <IconButton icon="chevron-left" onPress={() => router.back()} />
        <ThemeToggle />
      </View>

      <Text style={[styles.screenTitle, { color: colors.foreground }]}>
        Add character
      </Text>

      <SegmentedControl
        value={relationship}
        onChange={changeRelationship}
        testID="relationship"
        options={[
          { value: "child", label: "Child" },
          { value: "mom", label: "Mom" },
          { value: "dad", label: "Dad" },
        ]}
      />

      {relationship === "child" ? (
        <Pressable
          onPress={pickPhoto}
          testID="character-photo-picker"
          style={[
            styles.photoPicker,
            { backgroundColor: colors.card, borderColor: colors.border },
            cardShadow(colors.shadow),
          ]}
        >
          {previewImageUri ? (
            <KahaniImage
              uri={previewImageUri}
              style={styles.photoPreview}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.photoEmpty}>
              <View
                style={[
                  styles.photoIcon,
                  { backgroundColor: colors.secondary },
                ]}
              >
                <Feather name="camera" color={colors.bark} size={28} />
              </View>
              <Text style={[styles.photoTitle, { color: colors.foreground }]}>
                Upload photo
              </Text>
              <Text
                style={[styles.photoCaption, { color: colors.mutedForeground }]}
              >
                {photoPickerCaption}
              </Text>
            </View>
          )}
        </Pressable>
      ) : null}

      {photoNotice ? (
        <Text style={[styles.photoNotice, { color: colors.mutedForeground }]}>
          {photoNotice}
        </Text>
      ) : null}

      <View
        style={[
          styles.nameInputWrap,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Child's name"
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.nameInput,
            { color: colors.foreground, outlineColor: "transparent" },
          ]}
          returnKeyType="done"
          testID="character-name-input"
        />
      </View>

      <View style={styles.identityBlock}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
          Character identity
        </Text>
        <View style={styles.identityOptions}>
          {IDENTITY_OPTIONS.map((option) => {
            const selected = presentation === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setPresentation(option.value)}
                style={[
                  styles.identityOption,
                  {
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.identityText,
                    {
                      color: selected
                        ? colors.primaryForeground
                        : colors.foreground,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {manualFallbackVisible ? (
        <View
          style={[
            styles.nameInputWrap,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <TextInput
            value={appearanceNotes}
            onChangeText={setAppearanceNotes}
            placeholder="Brown hair, blue sweater, glasses"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.nameInput,
              { color: colors.foreground, outlineColor: "transparent" },
            ]}
            returnKeyType="done"
          />
        </View>
      ) : null}

      <KahaniButton
        label="Save character"
        onPress={save}
        disabled={!name.trim()}
        testID="save-character-button"
      />

      {characters.length > 0 ? (
        <View style={styles.savedSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Characters
          </Text>
          <View style={styles.characterRow}>
            {characters.map((character) => (
              <View key={character.id} style={styles.savedCharacter}>
                <CharacterAvatar
                  label={character.name}
                  imageUri={character.characterImageUri}
                  selected={character.id === selectedCharacterId}
                  onPress={() => selectCharacter(character.id)}
                  testID={`saved-character-${character.name}`}
                />
                <Text
                  style={[styles.relationshipLabel, { color: colors.bark }]}
                >
                  {character.relationship ?? "child"}
                </Text>
                <Pressable
                  onPress={() => removeCharacter(character.id)}
                  style={[
                    styles.removeButton,
                    {
                      backgroundColor: colors.secondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Feather name="trash-2" color={colors.bark} size={15} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </KahaniScreen>
  );
}

const styles = StyleSheet.create({
  topControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  screenTitle: {
    fontFamily: serifFamily(),
    fontSize: 34,
    lineHeight: 40,
    marginBottom: 20,
  },
  photoPicker: {
    aspectRatio: 1.12,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 16,
    marginBottom: 16,
  },
  photoEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  photoPreview: {
    width: "100%",
    height: "100%",
  },
  photoIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
  },
  photoTitle: {
    fontFamily: tokens.typography.sansBold,
    fontSize: 17,
  },
  photoCaption: {
    fontFamily: tokens.typography.sansMedium,
    fontSize: 13,
    textAlign: "center",
  },
  photoNotice: {
    fontFamily: tokens.typography.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  nameInputWrap: {
    minHeight: 58,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  nameInput: {
    fontFamily: tokens.typography.sansMedium,
    fontSize: 18,
  },
  identityBlock: {
    marginBottom: 16,
    gap: 10,
  },
  fieldLabel: {
    fontFamily: tokens.typography.sansBold,
    fontSize: 15,
  },
  identityOptions: {
    flexDirection: "row",
    gap: 8,
  },
  identityOption: {
    minHeight: 44,
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  identityText: {
    fontFamily: tokens.typography.sansBold,
    fontSize: 14,
    textAlign: "center",
  },
  savedSection: {
    marginTop: 34,
  },
  sectionTitle: {
    fontFamily: serifFamily(),
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 16,
  },
  characterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  savedCharacter: {
    position: "relative",
    alignItems: "center",
  },
  relationshipLabel: {
    marginTop: 4,
    fontFamily: tokens.typography.sansMedium,
    fontSize: 12,
    textTransform: "capitalize",
  },
  removeButton: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

const IDENTITY_OPTIONS = [
  { label: "Describe", value: "from-photo" },
  { label: "Girl", value: "girl" },
  { label: "Boy", value: "boy" },
] as const;
