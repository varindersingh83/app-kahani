import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
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
  KahaniButton,
  KahaniHeader,
  KahaniScreen,
  LeafSprig,
  OptionPill,
  cardShadow,
  serifFamily,
} from "@/components/KahaniDesign";
import tokens from "@/constants/colors";
import { useStoryStudio } from "@/context/StoryContext";
import { useKahaniTheme } from "@/context/ThemeContext";

const hairColors = ["#6F471F", "#9B5A1B", "#C4934A", "#2D2A22", "#A74B0A", "#EADDC7"];
const skinTones = ["#F3BE8F", "#E7AD73", "#C9904F", "#A76732", "#70421E"];

export default function CharactersScreen() {
  const { colors } = useKahaniTheme();
  const { addCharacter } = useStoryStudio();
  const [name, setName] = useState("Maya");
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [avatar, setAvatar] = useState("boy");
  const [age, setAge] = useState("6-8");
  const [gender, setGender] = useState("child");
  const [hair, setHair] = useState(hairColors[0]);
  const [skin, setSkin] = useState(skinTones[0]);
  const [outfit, setOutfit] = useState("overalls");
  const [personality, setPersonality] = useState("Kind, curious, loves nature...");

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
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <KahaniScreen>
      <KahaniHeader
        back
        title="Add Character"
        subtitle="Create a character for your story"
      />
      <LeafSprig style={styles.extraLeaf} />

      <FormStep title="1. Choose avatar">
        <View style={styles.avatarChoices}>
          {[
            { id: "boy", label: "Boy", icon: "smile" as const },
            { id: "girl", label: "Girl", icon: "user" as const },
            { id: "bunny", label: "Bunny", icon: "heart" as const },
          ].map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setAvatar(item.id)}
              style={[
                styles.avatarChoice,
                {
                  backgroundColor: colors.card,
                  borderColor: avatar === item.id ? colors.primary : colors.border,
                },
                avatar === item.id && cardShadow(colors.glow),
              ]}
            >
              {photoUri && avatar === item.id ? (
                <Image source={{ uri: photoUri }} style={styles.fill} />
              ) : (
                <>
                  <Feather name={item.icon} color={colors.bark} size={44} />
                  <Text style={[styles.avatarChoiceText, { color: colors.bark }]}>
                    {item.label}
                  </Text>
                </>
              )}
            </Pressable>
          ))}
          <Pressable
            onPress={pickPhoto}
            style={[
              styles.avatarChoice,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <Feather name="plus" color={colors.bark} size={42} />
            <Text style={[styles.avatarChoiceText, { color: colors.bark }]}>
              Custom
            </Text>
          </Pressable>
        </View>
      </FormStep>

      <FormStep title="2. Customize character">
        <View
          style={[
            styles.customPanel,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
            cardShadow(colors.shadow),
          ]}
        >
          <ControlRow label="Name">
            <View
              style={[
                styles.nameInputWrap,
                { borderColor: colors.border, backgroundColor: colors.background },
              ]}
            >
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Maya"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.nameInput, { color: colors.foreground }]}
              />
              <Feather name="feather" color={colors.bark} size={18} />
            </View>
          </ControlRow>

          <ControlRow label="Age">
            <View style={styles.inlineOptions}>
              {["3-5", "6-8", "9-12"].map((item) => (
                <OptionPill
                  key={item}
                  label={item}
                  selected={age === item}
                  onPress={() => setAge(item)}
                />
              ))}
            </View>
          </ControlRow>

          <ControlRow label="Gender">
            <View style={styles.inlineOptions}>
              {["child", "girl", "boy"].map((item) => (
                <OptionPill
                  key={item}
                  selected={gender === item}
                  onPress={() => setGender(item)}
                >
                  <Feather
                    name={item === "child" ? "smile" : "user"}
                    color={gender === item ? colors.primaryForeground : colors.bark}
                    size={20}
                  />
                </OptionPill>
              ))}
            </View>
          </ControlRow>

          <ControlRow label="Hair">
            <Swatches values={hairColors} value={hair} onChange={setHair} />
          </ControlRow>
          <ControlRow label="Skin tone">
            <Swatches values={skinTones} value={skin} onChange={setSkin} />
          </ControlRow>
          <ControlRow label="Outfit" last>
            <View style={styles.inlineOptions}>
              {["overalls", "vest", "hoodie", "tee"].map((item) => (
                <OptionPill
                  key={item}
                  selected={outfit === item}
                  onPress={() => setOutfit(item)}
                >
                  <Feather
                    name="shield"
                    color={outfit === item ? colors.primaryForeground : colors.bark}
                    size={19}
                  />
                </OptionPill>
              ))}
            </View>
          </ControlRow>
        </View>
      </FormStep>

      <FormStep title="3. Personality (optional)">
        <View
          style={[
            styles.personalityBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <TextInput
            value={personality}
            onChangeText={setPersonality}
            multiline
            placeholder="Kind, curious, loves nature..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.personalityInput, { color: colors.foreground }]}
          />
          <Feather name="feather" color={colors.bark} size={20} />
        </View>
      </FormStep>

      <View style={styles.tip}>
        <Feather name="feather" color={colors.leaf} size={17} />
        <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
          Tip: Adding personality helps create more engaging stories.
        </Text>
      </View>

      <KahaniButton label="Save Character" onPress={save} disabled={!name.trim()} />
    </KahaniScreen>
  );
}

function FormStep({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useKahaniTheme();
  return (
    <View style={styles.step}>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>{title}</Text>
      {children}
    </View>
  );
}

function ControlRow({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  const { colors } = useKahaniTheme();
  return (
    <View
      style={[
        styles.controlRow,
        { borderBottomColor: colors.border },
        last && { borderBottomWidth: 0 },
      ]}
    >
      <Text style={[styles.controlLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={styles.controlValue}>{children}</View>
    </View>
  );
}

function Swatches({
  values,
  value,
  onChange,
}: {
  values: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { colors } = useKahaniTheme();
  return (
    <View style={styles.swatches}>
      {values.map((item) => (
        <Pressable
          key={item}
          onPress={() => onChange(item)}
          style={[
            styles.swatch,
            {
              backgroundColor: item,
              borderColor: value === item ? colors.primary : colors.border,
              borderWidth: value === item ? 3 : 1,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  extraLeaf: {
    top: 122,
    right: 4,
  },
  step: {
    marginBottom: 28,
  },
  stepTitle: {
    fontFamily: serifFamily(),
    fontSize: 27,
    lineHeight: 34,
    marginBottom: 16,
  },
  avatarChoices: {
    flexDirection: "row",
    gap: 12,
  },
  avatarChoice: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    gap: 8,
  },
  avatarChoiceText: {
    fontFamily: tokens.typography.sansBold,
    fontSize: 13,
  },
  fill: {
    width: "100%",
    height: "100%",
  },
  customPanel: {
    borderWidth: 1,
    borderRadius: 26,
    paddingHorizontal: 16,
  },
  controlRow: {
    minHeight: 74,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 12,
  },
  controlLabel: {
    width: 88,
    fontFamily: tokens.typography.sansBold,
    fontSize: 17,
  },
  controlValue: {
    flex: 1,
  },
  nameInputWrap: {
    minHeight: 48,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  nameInput: {
    flex: 1,
    fontFamily: tokens.typography.sansMedium,
    fontSize: 19,
  },
  inlineOptions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  swatches: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  personalityBox: {
    minHeight: 86,
    borderWidth: 1,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 18,
    gap: 12,
  },
  personalityInput: {
    flex: 1,
    minHeight: 48,
    fontFamily: tokens.typography.sansMedium,
    fontSize: 17,
    lineHeight: 24,
    textAlignVertical: "top",
  },
  tip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: -4,
    marginBottom: 22,
  },
  tipText: {
    flex: 1,
    fontFamily: tokens.typography.sansMedium,
    fontSize: 15,
    lineHeight: 21,
  },
});
