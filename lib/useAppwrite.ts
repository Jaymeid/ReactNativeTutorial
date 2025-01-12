import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { Models } from "react-native-appwrite";
import { getAllPosts } from "./appwrite";

const useAppwrite = (fn: () => Promise<Models.Document[] | undefined>) => {
  const [data, setData] = useState<Models.Document[] | undefined>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);

    try {
      const response = await fn();

      setData(response);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Error", error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refetch = () => fetchData();

  return { data, isLoading, refetch };
};

export default useAppwrite;
