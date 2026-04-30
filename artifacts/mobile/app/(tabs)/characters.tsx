import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useStoryStudio } from "@/context/StoryContext";
import { useColors } from "@/hooks/useColors";

const ids = {
  screen: "add-character-screen",
  photoPreview: "add-character-photo-preview",
  takePhoto: "add-character-take-photo",
  uploadPhoto: "add-character-upload-photo",
  nameInput: "add-character-name-input",
  saveButton: "add-character-save-button",
  savedList: "add-character-saved-list",
};

export default function CharactersScreen() {
  const colors = useColors();
  const { characters, addCharacter, removeCharacter, selectCharacter, selectedCharacterId } =
    useStoryStudio();
  const [name, setName] = useState("");
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  const takeSelfie = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera needed", "Allow camera access to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      cameraType: ImagePicker.CameraType.front,
      quality: 0.8,
    });
    if (!result.canceled) setPhotoUri(result.assets[0]?.uri);
  };

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
  };

  const ready = name.trim().length > 0 && Boolean(photoUri);

  return (
    <ScrollView
      testID={ids.screen}
      nativeID={ids.screen}
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: Platform.OS === "web" ? 84 : 22 }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Watercolor background blobs */}
      <View pointerEvents="none" style={styles.blobContainer}>
        <View style={[styles.blob, styles.blobSage]} />
        <View style={[styles.blob, styles.blobPeach]} />
        <View style={[styles.blob, styles.blobCream]} />
        <View style={[styles.blob, styles.blobMint]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: colors.primary }]}>Characters</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Add a little one</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          A photo and name make each story feel like it was made just for them.
        </Text>
      </View>

      {/* Photo area */}
      <View style={styles.avatarSection}>
        <Pressable
          testID={ids.photoPreview}
          nativeID={ids.photoPreview}
          onPress={photoUri ? takeSelfie : undefined}
          style={[
            styles.avatarCircle,
            { borderColor: photoUri ? colors.primary : "#C8B89A" },
            photoUri && { borderStyle: "solid", borderWidth: 3 },
          ]}
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarEmpty}>
              <Feather name="user" color="#C8B89A" size={38} />
              <Text style={styles.avatarHint}>Add photo</Text>
            </View>
          )}
          {photoUri && (
            <View style={styles.editBadge}>
              <Feather name="edit-2" color="white" size={13} />
            </View>
          )}
        </Pressable>

        <View style={[styles.tagPill, photoUri ? styles.tagPillDone : styles.tagPillDefault]}>
          <Text style={[styles.tagText, { color: photoUri ? "#5E7A60" : "#B8A882" }]}>
            {photoUri ? "Looking great" : "A selfie or photo works perfectly"}
          </Text>
        </View>
      </View>

      {/* Photo buttons */}
      <View style={styles.photoButtons}>
        <Pressable
          testID={ids.takePhoto}
          nativeID={ids.takePhoto}
          onPress={takeSelfie}
          style={({ pressed }) => [styles.photoBtn, styles.photoBtnBlush, { opacity: pressed ? 0.75 : 1 }]}
        >
          <Feather name="camera" color="#9F6B54" size={19} />
          <Text style={[styles.photoBtnText, { color: "#9F6B54" }]}>Take photo</Text>
        </Pressable>

        <Pressable
          testID={ids.uploadPhoto}
          nativeID={ids.uploadPhoto}
          onPress={pickPhoto}
          style={({ pressed }) => [styles.photoBtn, styles.photoBtnSky, { opacity: pressed ? 0.75 : 1 }]}
        >
          <Feather name="upload" color="#517A8C" size={19} />
          <Text style={[styles.photoBtnText, { color: "#517A8C" }]}>Upload</Text>
        </Pressable>
      </View>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>then</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Name input */}
      <View style={styles.nameSection}>
        <Text style={[styles.inputLabel, { color: colors.primary }]}>THEIR NAME</Text>
        <View style={styles.inputWrap}>
          <TextInput
            testID={ids.nameInput}
            nativeID={ids.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Mia, Zayan, Lily…"
            placeholderTextColor="#C8B89A"
            style={[
              styles.nameInput,
              { borderColor: name ? colors.primary : "#DDD1BC", color: colors.foreground },
            ]}
          />
          {name.length > 0 && (
            <View style={styles.checkBadge}>
              <Feather name="check" color="#5E7A60" size={14} />
            </View>
          )}
        </View>
      </View>

      {/* Save button */}
      <Pressable
        testID={ids.saveButton}
        nativeID={ids.saveButton}
        onPress={save}
        disabled={!ready}
        style={({ pressed }) => [
          styles.saveButton,
          ready ? styles.saveButtonActive : styles.saveButtonMuted,
          { opacity: pressed ? 0.82 : 1 },
        ]}
      >
        <Feather name="arrow-right" color="white" size={19} />
        <Text style={styles.saveText}>
          {ready ? `Add ${name.trim()} to Kahani` : "Add selfie and name first"}
        </Text>
      </Pressable>

      <Text style={styles.footnote}>
        Stories will be personalised for this little one.{"\n"}You can always edit or remove them later.
      </Text>

      {/* Saved characters list */}
      {characters.length > 0 && (
        <View testID={ids.savedList} nativeID={ids.savedList} style={styles.savedList}>
          <Text style={[styles.savedLabel, { color: colors.primary }]}>YOUR LITTLE ONES</Text>
          {characters.map((character) => {
            const selected = character.id === selectedCharacterId;
            return (
              <Pressable
                key={character.id}
                onPress={() => selectCharacter(character.id)}
                testID={`add-character-row-${character.id}`}
                nativeID={`add-character-row-${character.id}`}
                style={[
                  styles.characterRow,
                  {
                    backgroundColor: selected ? "rgba(191,216,196,0.28)" : "rgba(255,252,246,0.9)",
                    borderColor: selected ? colors.primary : "#DDD1BC",
                  },
                ]}
              >
                {character.photoUri ? (
                  <Image source={{ uri: character.photoUri }} style={styles.rowPhoto} />
                ) : (
                  <View style={[styles.rowPhoto, styles.rowPhotoEmpty]}>
                    <Feather name="user" color={colors.primary} size={20} />
                  </View>
                )}
                <Text style={[styles.rowName, { color: colors.foreground }]}>{character.name}</Text>
                {selected && (
                  <View style={styles.selectedDot}>
                    <Feather name="check" color={colors.primary} size={14} />
                  </View>
                )}
                <Pressable
                  onPress={() => removeCharacter(character.id)}
                  hitSlop={14}
                  testID={`add-character-remove-${character.id}`}
                  nativeID={`add-character-remove-${character.id}`}
                >
                  <Feather name="trash-2" color="#C8B89A" size={17} />
                </Pressable>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFCF6",
  },
  content: {
    padding: 24,
    paddingBottom: 120,
  },
  blobContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
  blobSage: {
    width: 260,
    height: 200,
    backgroundColor: "rgba(191,216,196,0.38)",
    top: -50,
    left: -60,
    transform: [{ rotate: "-12deg" }],
  },
  blobPeach: {
    width: 220,
    height: 170,
    backgroundColor: "rgba(242,201,183,0.32)",
    top: -20,
    right: -40,
    transform: [{ rotate: "15deg" }],
  },
  blobCream: {
    width: 240,
    height: 180,
    backgroundColor: "rgba(255,230,195,0.34)",
    bottom: 80,
    right: -50,
    transform: [{ rotate: "-14deg" }],
  },
  blobMint: {
    width: 260,
    height: 190,
    backgroundColor: "rgba(207,228,201,0.32)",
    bottom: 250,
    left: -86,
    transform: [{ rotate: "8deg" }],
  },
  header: {
    marginBottom: 24,
  },
  kicker: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    letterSpacing: -0.8,
    marginTop: 6,
  },
  subtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    maxWidth: 320,
  },
  avatarSection: {
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  avatarCircle: {
    width: 148,
    height: 148,
    borderRadius: 42,
    borderWidth: 2,
    borderStyle: "dashed",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(244,238,228,0.95)",
    shadowColor: "#8B774A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarEmpty: {
    alignItems: "center",
    gap: 6,
  },
  avatarHint: {
    color: "#C8B89A",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  editBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#8B7B5A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  tagPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagPillDefault: {
    backgroundColor: "rgba(200,184,154,0.22)",
    borderWidth: 1,
    borderColor: "rgba(200,184,154,0.35)",
  },
  tagPillDone: {
    backgroundColor: "rgba(191,216,196,0.38)",
    borderWidth: 1,
    borderColor: "rgba(144,183,151,0.4)",
  },
  tagText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  photoButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 22,
  },
  photoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: "#8B774A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  photoBtnBlush: {
    backgroundColor: "#FFF2EC",
    borderColor: "#EBC8B8",
  },
  photoBtnSky: {
    backgroundColor: "#EEF8FA",
    borderColor: "#BFDDE5",
  },
  photoBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(200,184,154,0.4)",
  },
  dividerLabel: {
    color: "#B8A882",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  nameSection: {
    gap: 8,
    marginBottom: 22,
  },
  inputLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 0.8,
  },
  inputWrap: {
    position: "relative",
  },
  nameInput: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontFamily: "Inter_500Medium",
    fontSize: 17,
    backgroundColor: "rgba(255,252,246,0.95)",
    shadowColor: "#8B774A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  checkBadge: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(191,216,196,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 18,
    borderRadius: 22,
    marginBottom: 16,
  },
  saveButtonActive: {
    backgroundColor: "#8B7B5A",
    shadowColor: "#8B7B5A",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 5,
  },
  saveButtonMuted: {
    backgroundColor: "rgba(200,184,154,0.45)",
  },
  saveText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "white",
  },
  footnote: {
    color: "#B8A882",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 32,
  },
  savedList: {
    gap: 10,
  },
  savedLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  characterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1.5,
    borderRadius: 22,
    padding: 12,
    shadowColor: "#8B774A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  rowPhoto: {
    width: 52,
    height: 52,
    borderRadius: 18,
    overflow: "hidden",
  },
  rowPhotoEmpty: {
    backgroundColor: "rgba(244,238,228,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowName: {
    flex: 1,
    fontFamily: "Inter_700Bold",
    fontSize: 17,
  },
  selectedDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(191,216,196,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
});
