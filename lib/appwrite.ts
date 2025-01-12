import {
  Client,
  Account,
  ID,
  Avatars,
  Models,
  Databases,
  Query,
  Storage,
} from "react-native-appwrite";
import * as ImagePicker from "expo-image-picker";
import { ImageGravity } from "react-native-appwrite";

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is missing`);
  }
  return value;
}

type VideoForm = {
  title: string;
  video: ImagePicker.ImagePickerAsset | null;
  thumbnail: ImagePicker.ImagePickerAsset | null;
  prompt: string;
  userId: string;
};

export const config = {
  endpoint: getEnvVar("EXPO_PUBLIC_ENDPOINT"),
  platform: getEnvVar("EXPO_PUBLIC_PLATFORM"),
  projectId: getEnvVar("EXPO_PUBLIC_PROJECT_ID"),
  databaseId: getEnvVar("EXPO_PUBLIC_DATABASE_ID"),
  userCollectionId: getEnvVar("EXPO_PUBLIC_USER_COLLECTION_ID"),
  videoCollectionId: getEnvVar("EXPO_PUBLIC_VIDEO_COLLECTION_ID"),
  storageId: getEnvVar("EXPO_PUBLIC_STORAGE_ID"),
};

const {
  endpoint,
  platform,
  projectId,
  databaseId,
  userCollectionId,
  videoCollectionId,
  storageId,
} = config;

const client = new Client();

client.setEndpoint(endpoint).setProject(projectId).setPlatform(platform);

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storage = new Storage(client);

export const createUser = async (
  email: string,
  password: string,
  username: string
) => {
  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );

    if (!newAccount) throw Error;

    const avatarUrl = avatars.getInitials(username);

    await signIn(email, password);

    const newUser = await databases.createDocument(
      databaseId,
      userCollectionId,
      ID.unique(),
      {
        email,
        username,
        avatar: avatarUrl,
        userId: newAccount.$id,
      }
    );

    return newUser;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log(error);
      throw new Error(error.message);
    }
  }
};

export const signIn = async (
  email: string,
  password: string
): Promise<Models.Session | undefined> => {
  try {
    const session = await account.createEmailPasswordSession(email, password);

    return session;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log(error);
      throw new Error(error.message);
    }
  }
};

export const getCurrentUser = async () => {
  try {
    const currentAccount = await account.get();

    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      databaseId,
      userCollectionId,
      [Query.equal("userId", currentAccount.$id)]
    );

    if (!currentUser) throw Error;

    return currentUser.documents[0];
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log(error);
      throw new Error(error.message);
    }
  }
};

export const getAllPosts = async (): Promise<Models.Document[] | undefined> => {
  try {
    const posts = await databases.listDocuments(databaseId, videoCollectionId, [
      Query.orderDesc("$createdAt"),
    ]);

    return posts.documents;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
};

export const getLatestPosts = async (): Promise<
  Models.Document[] | undefined
> => {
  try {
    const posts = await databases.listDocuments(databaseId, videoCollectionId, [
      Query.orderDesc("$createdAt"),
      Query.limit(7),
    ]);

    return posts.documents;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
};

export const searchPosts = async (
  query: string
): Promise<Models.Document[] | undefined> => {
  try {
    const posts = await databases.listDocuments(databaseId, videoCollectionId, [
      Query.search("title", query),
    ]);

    return posts.documents;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
};

export const getUserPosts = async (
  userId: string
): Promise<Models.Document[] | undefined> => {
  try {
    const posts = await databases.listDocuments(databaseId, videoCollectionId, [
      Query.equal("users", userId),
      Query.orderDesc("$createdAt"),
    ]);

    return posts.documents;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
};

export const signOut = async () => {
  try {
    const session = await account.deleteSession("current");

    return session;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
};

export const getFilePreview = async (fileId: string, type: string) => {
  let fileUrl;

  try {
    if (type === "video") {
      fileUrl = storage.getFileView(storageId, fileId);
    } else if (type === "image") {
      fileUrl = storage.getFilePreview(
        storageId,
        fileId,
        2000,
        2000,
        ImageGravity.Top,
        100
      );
    } else {
      throw new Error("Invalid file type");
    }

    if (!fileUrl) throw Error;

    return fileUrl;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
};

export const uploadFile = async (
  file: ImagePicker.ImagePickerAsset,
  type: string
) => {
  if (!file) return;

  if (!file.fileName || !file.mimeType || !file.fileSize || !file.uri) {
    throw new Error("Invalid file");
  }
  const asset = {
    name: file.fileName,
    type: file.mimeType,
    size: file.fileSize,
    uri: file.uri,
  };

  try {
    const uploadedFile = await storage.createFile(
      storageId,
      ID.unique(),
      asset
    );

    const fileUrl = await getFilePreview(uploadedFile.$id, type);

    return fileUrl;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
};

export const createVideo = async (form: VideoForm) => {
  try {
    if (!form.thumbnail || !form.video) {
      throw new Error("No video or thumbnail provided");
    }

    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ]);

    const newPost = await databases.createDocument(
      databaseId,
      videoCollectionId,
      ID.unique(),
      {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form.prompt,
        users: form.userId,
      }
    );

    return newPost;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
};
