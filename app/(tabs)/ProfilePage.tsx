import {
  Text,
  View,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import { styles } from "./ProfilePage.style";
import i18n from "@/constants/i18n";

export default function ProfilePage() {
  const router = useRouter(); // Hook to navigate between pages

  /* ##########################################################
   ###########    STATES & GLOBAL VARIABLES   ##############
   ########################################################## */

  // User information states
  const [name, setName] = useState("Firstname LASTNAME");
  const [email, setEmail] = useState("your-mail@address.com");
  const [phone, setPhone] = useState("XXXXXXXXXX");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [originalData, setOriginalData] = useState({
    name,
    email,
    phone,
    avatar,
  }); // Backup of data to restore if edits are canceled

  // States for input validation errors
  const [nameError, setNameError] = useState<string | boolean>(false);
  const [emailError, setEmailError] = useState<string | boolean>(false);
  const [phoneError, setPhoneError] = useState<string | boolean>(false);

  /* ##########################################################
   #############   VALIDATION FUNCTIONS   #################
   ########################################################## */

  // Validate email format
  const validateEmail = (email: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Validate phone number (digits only)
  const validatePhoneNumber = (phone: string): boolean => /^\d+$/.test(phone);

  /* ##########################################################
   ##########   ASYNCSTORAGE FUNCTIONS (LOAD & SAVE)   #########
   ########################################################## */

  // Save email data to AsyncStorage
  useEffect(() => {
    const saveEmailToStorage = async () => {
      await AsyncStorage.setItem("profileEmail", email);
    };
    saveEmailToStorage();
  }, [email]);

  // Load profile data from AsyncStorage
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const savedData = await AsyncStorage.getItem("profileData");
        if (savedData) {
          const { name, email, phone, avatar } = JSON.parse(savedData);
          setName(name || "Firstname LASTNAME");
          setEmail(email || "your-mail@address.com");
          setPhone(phone || "XXXXXXXXXX");
          setAvatar(avatar || null);
        }
      } catch (error) {
        console.error("Failed to load profile data", error);
      }
    };
    loadProfileData();
  }, [i18n.locale]); // Reload data when the language changes

  // Save the current profile data to AsyncStorage
  const saveProfileData = async () => {
    try {
      await AsyncStorage.setItem(
        "profileData",
        JSON.stringify({ name, email, phone, avatar })
      );
    } catch (error) {
      console.error("Failed to save profile data", error);
    }
  };

  /* ##########################################################
   #############   HANDLER FUNCTIONS   #################
   ########################################################## */

  // Handle form validation and saving
  const handleSave = async () => {
    let hasError = false;

    // Validate name field
    if (!name.trim()) {
      setNameError(i18n.t("nameRequired"));
      hasError = true;
    } else {
      setNameError(false);
    }

    // Validate email field
    if (!email.trim()) {
      setEmailError(i18n.t("emailRequired"));
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError(i18n.t("invalidEmail"));
      hasError = true;
    } else {
      setEmailError(false);
    }

    // Validate phone number field
    if (!phone.trim()) {
      setPhoneError(i18n.t("phoneRequired"));
      hasError = true;
    } else if (!validatePhoneNumber(phone)) {
      setPhoneError(i18n.t("invalidPhone"));
      hasError = true;
    } else {
      setPhoneError(false);
    }

    if (hasError) {
      Alert.alert(i18n.t("error"), i18n.t("allFieldsRequired"));
      return;
    }

    await saveProfileData();
    setOriginalData({ name, email, phone, avatar });
    setIsEditing(false);
    Alert.alert(i18n.t("success"), i18n.t("profileUpdated"));
  };

  // Pick an image from the gallery
  const pickImage = async () => {
    if (isEditing) {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert(i18n.t("permissionDenied"));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setAvatar(result.assets[0].uri); // Set the selected image
      }
    }
  };

  // Handle canceling and restoring original data
  const handleCancel = () => {
    setName(originalData.name);
    setEmail(originalData.email);
    setPhone(originalData.phone);
    setAvatar(originalData.avatar);
    // Clear error states
    setNameError(false);
    setEmailError(false);
    setPhoneError(false);
    setIsEditing(false); // Exit editing mode
  };

  /* ##########################################################
   ##################   UI RENDERING   ##################
   ########################################################## */

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Edit Mode Indicator */}
          {isEditing && (
            <View style={styles.editIndicatorContainer}>
              <Text style={styles.editIndicator}>{i18n.t("editingMode")}</Text>
            </View>
          )}

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage}>
              <Image
                source={
                  avatar
                    ? { uri: avatar }
                    : require("../../assets/images/avatar.png")
                }
                style={styles.avatar}
              />
            </TouchableOpacity>

            {/* Editing Icon */}
            {!isEditing && (
              <TouchableOpacity
                style={styles.editIcon}
                onPress={() => {
                  setOriginalData({ name, email, phone, avatar });
                  setIsEditing(true);
                }}
              >
                <Text style={styles.editText}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Name Section */}
          {isEditing ? (
            <>
              <TextInput
                style={[
                  styles.name,
                  styles.editingName,
                  nameError && styles.inputError,
                ]}
                value={name}
                onChangeText={(text) => {
                  setName(text.replace(/[^a-zA-Z\s]/g, ""));
                  setNameError(false);
                }}
                placeholder={i18n.t("enterName")}
                placeholderTextColor="#888"
                returnKeyType="done"
                maxLength={30}
              />
              {nameError ? (
                <Text style={styles.errorText}>{nameError}</Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.name}>{name}</Text>
          )}

          {/* Email Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{i18n.t("email")}</Text>
              {isEditing ? (
                <>
                  <TextInput
                    style={[
                      styles.input,
                      styles.inputValue,
                      emailError && styles.inputError,
                    ]} // Add padding and red border in case of error
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setEmailError(false);
                    }}
                    placeholder={i18n.t("enterEmail")}
                    placeholderTextColor="#888"
                    keyboardType="email-address"
                    returnKeyType="done"
                    maxLength={50}
                  />
                </>
              ) : (
                <Text
                  style={[styles.value, styles.textValue]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {email}
                </Text>
              )}
            </View>
            <>
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </>

            {/* Phone Section */}
            <View style={styles.infoRow}>
              <Text style={styles.label}>{i18n.t("phone")}</Text>
              {isEditing ? (
                <>
                  <TextInput
                    style={[
                      styles.input,
                      styles.inputValue,
                      phoneError && styles.inputError,
                    ]}
                    value={phone}
                    onChangeText={(text) => {
                      setPhone(text.replace(/[^0-9]/g, ""));
                      setPhoneError(false);
                    }}
                    placeholder={i18n.t("enterPhone")}
                    placeholderTextColor="#888"
                    keyboardType="number-pad"
                    returnKeyType="done"
                    maxLength={10}
                  />
                </>
              ) : (
                <Text
                  style={[styles.value, styles.textValue]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {phone}
                </Text>
              )}
            </View>
            <>
              {phoneError ? (
                <Text style={styles.errorText}>{phoneError}</Text>
              ) : null}
            </>
          </View>

          {/* Buttons Section */}
          {!isEditing && (
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push("/HistoryPage")}
              >
                <Text style={styles.actionText}>{i18n.t("historic")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push("/SettingsPage")}
              >
                <Text style={styles.actionText}>{i18n.t("settings")}</Text>
              </TouchableOpacity>
            </View>
          )}

          {isEditing && (
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.buttonText}>{i18n.t("saveChanges")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.buttonText}>{i18n.t("cancelChanges")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
