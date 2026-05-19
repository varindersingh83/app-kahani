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
  const [relationship, setRelationship] =
    useState<CharacterRelationship>("child");
  const [presentation, setPresentation] = useState<
    "from-photo" | "girl" | "boy"
  >("from-photo");
  const [appearanceNotes, setAppearanceNotes] = useState("");

  const pickPhoto = async () => {
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
    await addCharacter(
      name.trim(),
      photoUri,
      relationship,
      relationship === "child"
        ? buildCharacterDescriptor({ presentation, notes: appearanceNotes })
        : undefined,
    );
    setName("");
    setPhotoUri(undefined);
    setRelationship("child");
    setPresentation("from-photo");
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

      <SegmentedControl
        value={relationship}
        onChange={setRelationship}
        testID="relationship"
        options={[
          { value: "child", label: "Child" },
          { value: "mom", label: "Mom" },
          { value: "dad", label: "Dad" },
        ]}
      />

      <Pressable
        onPress={pickPhoto}
        testID="character-photo-picker"
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
              style={[styles.photoIcon, { backgroundColor: colors.secondary }]}
            >
              <Feather name="camera" color={colors.bark} size={28} />
            </View>
            <Text style={[styles.photoTitle, { color: colors.foreground }]}>
              Add character photo
            </Text>
          </View>
        )}
      </Pressable>

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
                  imageUri={character.photoUri}
                  selected={character.id === selectedCharacterId}
                  onPress={() => selectCharacter(character.id)}
                  testID={`saved-character-${character.name}`}
                />
                <Text style={[styles.relationshipLabel, { color: colors.bark }]}>
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
