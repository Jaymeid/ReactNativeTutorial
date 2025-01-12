import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  Image,
  ViewToken,
  StyleSheet,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useEvent } from "expo";
import { icons } from "../constants";
import * as Animatable from "react-native-animatable";
import { useVideoPlayer, VideoView } from "expo-video";
import { Models } from "react-native-appwrite";

type ViewableItemsChangedProps = {
  viewableItems: ViewToken<Models.Document>[];
  changed?: ViewToken<Models.Document>[];
};

const zoomIn: Animatable.CustomAnimation = {
  0: {
    transform: [{ scale: 0.9 }],
  },
  1: {
    transform: [{ scale: 1 }],
  },
};

const zoomOut: Animatable.CustomAnimation = {
  0: {
    transform: [{ scale: 1 }],
  },
  1: {
    transform: [{ scale: 0.9 }],
  },
};

type ActiveItemProps = {
  activeItem: Models.Document;
  item: Models.Document;
};

const TrendingItem = ({ activeItem, item }: ActiveItemProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  const player = useVideoPlayer(activeItem.video, (player) => {
    player.loop = false;
  });

  useEffect(() => {
    if (player.currentTime === player.duration) {
      setIsPlaying(false);
    }
  }, [player.status]);

  const handlePress = () => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false); // Update local state
    } else {
      player.play();
      setIsPlaying(true); // Update local state
    }
  };

  return (
    <Animatable.View
      className="mr-5"
      animation={activeItem.$id === item.$id ? zoomIn : zoomOut}
      duration={500}
    >
      {isPlaying ? (
        <View className="w-[350px] h-[275px] justify-center items-center">
          <VideoView
            style={styles.video}
            player={player}
            allowsFullscreen
            allowsPictureInPicture
            nativeControls
          />
        </View>
      ) : (
        <TouchableOpacity
          className="relative justify-center items-center"
          activeOpacity={0.7}
          onPress={handlePress}
        >
          <ImageBackground
            source={{ uri: item.thumbnail }}
            className="w-52 h-72 rounded-[35px] my-5 overflow-hidden shadow-lg shadow-black-40"
          />

          <Image
            source={icons.play}
            className="w-12 h-12 absolute"
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
    </Animatable.View>
  );
};

type TrendingProps = {
  posts: Models.Document[];
};

const Trending = ({ posts }: TrendingProps) => {
  const [activeItem, setActiveItem] = useState(posts[1]);

  const viewableItemsChanged = ({
    viewableItems,
  }: ViewableItemsChangedProps) => {
    if (viewableItems.length > 0) {
      setActiveItem(viewableItems[0].item);
    }
  };
  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => String(item.$id)}
      renderItem={({ item }) => (
        <TrendingItem activeItem={activeItem} item={item} />
      )}
      onViewableItemsChanged={viewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 70,
      }}
      contentOffset={{ x: 170, y: 0 }}
      horizontal
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 50,
  },
  video: {
    width: 208,
    height: 288,
  },
  controlsContainer: {
    padding: 10,
  },
});

export default Trending;
