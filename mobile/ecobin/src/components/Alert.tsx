import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type AlertaProps = {
  message: string;
  type: "success" | "error";
  visible: boolean;
};

export default function Alerta({ message, type, visible }: AlertaProps) {
  const backgroundColor = type === "success" ? "#4CAF50" : "#F44336";
  const opacity = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true); 
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShouldRender(false)); 
    }
  }, [visible]);

  if (!shouldRender) {
    return null; 
  }

  return (
    <Animated.View
      style={[
        styles.alertContainer,
        { backgroundColor, opacity },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
        {type === "error" ? (
          <MaterialIcons name="error" size={32} color="#fff" />
        ) : (
          <MaterialIcons name="check-circle" size={32} color="#fff" />
        )}
        <Text style={styles.alertText}> {message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  alertContainer: {
    position: "absolute",
    top: Dimensions.get("window").height / 2 - 50, 
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 5,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  alertText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
});