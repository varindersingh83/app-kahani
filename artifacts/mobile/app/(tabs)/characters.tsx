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
      quality: 0.8,
    });
    if (!result.canceled) setPhotoUri(result.assets[0]?.uri);
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert("Add a name", "Enter a name before saving.");
      return;
    }
    await addCharacter(name.trim(), photoUri);
    setName("");
    setPhotoUri(undefined);
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
        Add child
      </Text>

      <Pressable
        onPress={pickPhoto}
        style={[
          styles.photoPicker,
          { backgroundColor: colors.card, borderColor: colors.border },
          cardShadow(colors.shadow),
        ]}
      >
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.fill} resizeMode="cover" />
        ) : (
          <View style={styles.photoEmpty}>
            <View style={[styles.photoIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="camera" color={colors.bark} size={28} />
            </View>
            <Text style={[styles.photoTitle, { color: colors.foreground }]}>
              Add a photo
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
        />
      </View>

      <KahaniButton label="Save child" onPress={save} disabled={!name.trim()} />

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
                    { backgroundColor: colors.secondary, borderColor: colors.border },
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
