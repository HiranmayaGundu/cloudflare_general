import { Request as IttyRequest } from "itty-router";
import { Temporal } from "@js-temporal/polyfill";
import {
  FormDataError,
  ImageUploadError,
  InvalidJsonError,
  AuthError,
} from "./error";
import { Post } from "./main-types";
import { DEFAULT_AVATAR, USERS_KV_KEY, TUNNEL_URL } from "./handler";

const uploadImage = async (file: File) => {
  const imageUUID = crypto.randomUUID();
  const fileBuffer = await file.arrayBuffer();
  await posts_kv.put(imageUUID, fileBuffer, { metadata: { type: file.type } });
  return `https://worker.hiranmaya-assignment.workers.dev/images/${imageUUID}`;
};
export const getPostFromFormData = async (
  formData: FormData
): Promise<Post> => {
  if (!formData) {
    throw new FormDataError("Form data is empty");
  }
  let url;
  try {
    url = await uploadImage(formData.get("image") as File);
  } catch (err) {
    throw new ImageUploadError(`Image upload failed ${err}`);
  }
  const post: Post = {
    username: formData.get("username") as string,
    content: formData.get("content") as string,
    title: formData.get("title") as string,
    embed: {
      type: "image",
      image: url,
    },
    timestamp: Temporal.Now.instant().toString(),
    author: {
      username: formData.get("username") as string,
      avatar: (formData.get("avatar") as string) || DEFAULT_AVATAR,
      name:
        (formData.get("name") as string) ||
        (formData.get("username") as string),
    },
    id: crypto.randomUUID(),
    replies: [],
  };
  return post;
};
const getUsers = async (): Promise<string[]> => {
  const users_string: string | null = await posts_kv.get(USERS_KV_KEY);
  let users: string[];
  if (!users_string) {
    users = [];
  } else {
    users = JSON.parse(users_string);
  }
  return users;
};
export const getPostFromJsonRequest = async (
  request: IttyRequest
): Promise<Post> => {
  if (request.json === undefined) {
    throw new InvalidJsonError("JSON was not sent with the request");
  }
  let post: Post;
  try {
    post = await request.json();
  } catch {
    throw new InvalidJsonError(
      "Request JSON is empty - JSON has an invalid structure"
    );
  }
  if (post === null) {
    throw new InvalidJsonError("JSON is null - JSON has an invalid structure");
  }
  return post;
};
export const doAuth = async (
  post: Post,
  cookie: string | null
): Promise<string> => {
  const users = await getUsers();
  const user_in_post = post.username;
  const found_user = users.find((user) => user === user_in_post);
  let setCookieString: string;
  if (found_user) {
    console.log("found user", found_user);
    if (cookie) {
      console.log("Making the verify call for cookie", cookie);
      const res = await fetch(`${TUNNEL_URL}/verify`, {
        headers: {
          Cookie: cookie,
        },
      });
      console.log(
        `Result of the verify call: ${res.status} with ok: ${res.ok}`
      );
      if (res.ok) {
        const username_in_jwt = await res.text();
        console.log("the verify returned correctly for: ", username_in_jwt);
        if (username_in_jwt !== user_in_post) {
          console.log(
            `the verify returned a different user ${username_in_jwt} and ${user_in_post}`
          );
          throw new AuthError("JWT is invalid");
        }
        setCookieString = `${cookie}; HttpOnly; Secure; Path=/`;
      } else {
        throw new AuthError("JWT is invalid");
      }
    } else {
      throw new AuthError("No cookie for auth");
    }
  } else {
    const res = await fetch(`${TUNNEL_URL}/auth/${user_in_post}`);
    if (res.ok) {
      const setCookieHeader = res.headers.get("Set-Cookie");
      if (!setCookieHeader) {
        throw new AuthError("No cookie for auth");
      }
      setCookieString = setCookieHeader;
      console.log("the auth returned correctly for: ", setCookieString);
      users.push(user_in_post);
      await posts_kv.put(USERS_KV_KEY, JSON.stringify(users));
    } else {
      throw new AuthError("Unable to generate JWT for user");
    }
  }
  return setCookieString;
};
