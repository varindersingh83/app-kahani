import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
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
  KahaniButton,
  KahaniScreen,
  ThemeToggle,
  cardShadow,
  serifFamily,
} from "@/components/KahaniDesign";
import tokens from "@/constants/colors";
import { useStoryStudio } from "@/context/StoryContext";
import { useKahaniTheme } from "@/context/ThemeContext";
import {
  buildGenericCharacterAppearance,
  getCharacterCreationPolicy,
  type CharacterPresentation,
  type CharacterRole,
} from "@/services/characterPrivacy";
import { buildCharacterDescriptor } from "@/services/photoDescriptors";

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
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [role, setRole] = useState<CharacterRole>("child");
  const [presentation, setPresentation] =
    useState<CharacterPresentation>("neutral");
  const [appearanceNotes, setAppearanceNotes] = useState("");
  const creationPolicy = getCharacterCreationPolicy();

  const pickPhoto = async () => {
    if (!creationPolicy.canUsePhotoPicker) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photos needed", "Allow photo access to upload an image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setPhotoUri(asset ? await persistableImageUri(asset) : undefined);
    }
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert("Add a name", "Enter a name before saving.");
      return;
    }
    const appearance = creationPolicy.canUseManualAppearanceNotes
      ? buildCharacterDescriptor({
          presentation,
          notes: appearanceNotes,
          role,
        })
      : buildGenericCharacterAppearance({ role, presentation });

    await addCharacter({
      name: name.trim(),
      role,
      presentation,
      photoUri: creationPolicy.canUsePhotoPicker ? photoUri : undefined,
      appearance,
    });
    setName("");
    setPhotoUri(undefined);
    setRole("child");
    setPresentation("neutral");
    setAppearanceNotes("");
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

      {creationPolicy.canUsePhotoPicker ? (
        <Pressable
          onPress={pickPhoto}
          style={[
            styles.photoPicker,
            { backgroundColor: colors.card, borderColor: colors.border },
            cardShadow(colors.shadow),
          ]}
        >
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={styles.fill}
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
                Add character photo
              </Text>
            </View>
          )}
        </Pressable>
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
        />
      </View>

      <View style={styles.identityBlock}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
          Character role
        </Text>
        <View style={styles.identityOptions}>
          {ROLE_OPTIONS.map((option) => {
            const selected = role === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setRole(option.value)}
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

      <View style={styles.identityBlock}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
          Presentation
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

      {creationPolicy.canUseManualAppearanceNotes ? (
        <View
          style={[
            styles.nameInputWrap,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <TextInput
            value={appearanceNotes}
            onChangeText={setAppearanceNotes}
            placeholder="Blonde hair, pink shirt, bright smile"
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
        label="Add character"
        onPress={save}
        disabled={!name.trim()}
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
                  imageUri={character.photoUri}
                  selected={character.id === selectedCharacterId}
                  onPress={() => selectCharacter(character.id)}
                />
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
    marginBottom: 16,
  },
  photoEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
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
  fill: {
    width: "100%",
    height: "100%",
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
  { label: "Neutral", value: "neutral" },
  { label: "Girl", value: "girl" },
  { label: "Boy", value: "boy" },
] as const;

const ROLE_OPTIONS = [
  { label: "Child", value: "child" },
  { label: "Adult", value: "adult" },
] as const;

async function persistableImageUri(asset: ImagePicker.ImagePickerAsset) {
  if (asset.base64) {
    const mimeType = asset.mimeType ?? detectMimeType(asset.uri);
    return `data:${mimeType};base64,${asset.base64}`;
  }

  if (Platform.OS !== "web" || !asset.uri.startsWith("blob:")) {
    return asset.uri;
  }

  const response = await fetch(asset.uri);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function detectMimeType(uri: string) {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/png";
}
