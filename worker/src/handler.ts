import { Router } from "itty-router";
import type { Request as IttyRequest } from "itty-router";
import { Temporal } from "@js-temporal/polyfill";
// import extension of date
import "./extensions";
import {
  FormDataError,
  ImageUploadError,
  InvalidJsonError,
  AuthError,
} from "./error";
import { Post, Reply } from "./main-types";
import { postSchema, replySchema } from "./yup-schema";
import {
  createErrorResponse,
  createSuccessResponse,
  isValidationError,
  corsHeaders,
} from "./utils";

const TUNNEL_URL = "https://sc-unnecessary-bm-resumes.trycloudflare.com";

const DEFAULT_AVATAR =
  "https://abs.twimg.com/sticky/default_profile_images/default_profile_200x200.png";

const router = Router();

router.get("/posts", async (request) => {
  const limitString: string | null = request.query?.number || null;
  const offsetString: string | null = request.query?.offset || null;

  let limit: undefined | number = undefined;
  if (limitString) {
    limit = parseInt(limitString, 10);
  }
  const offset = offsetString ? parseInt(limitString as string, 10) : 0;
  if ((limit && isNaN(limit)) || isNaN(offset)) {
    return createErrorResponse(
      "Bad Request",
      400,
      "Invalid query params sent, unable to parse as integers"
    );
  }

  try {
    const posts: string | null = await posts_kv.get("posts");
    let postList: Post[] = [];
    let responsePostList: Post[] = [];
    if (!posts) {
      // first time we get, if it is null we have never entered data.
      // enter empty array into cache at that point.
      await posts_kv.put("posts", JSON.stringify([]));
      postList = [];
    } else {
      postList = JSON.parse(posts);
    }
    if (limit) {
      responsePostList = postList.slice(offset, offset + limit);
    } else {
      responsePostList = postList.slice(offset);
    }
    return createSuccessResponse(responsePostList);
  } catch (err) {
    return createErrorResponse(
      "Internal Server Error",
      500,
      "Get call for KV errored out, request limits hit"
    );
  }
});

const uploadImage = async (file: File) => {
  const imageUUID = crypto.randomUUID();
  const fileBuffer = await file.arrayBuffer();
  await posts_kv.put(imageUUID, fileBuffer, { metadata: { type: file.type } });
  return `https://worker.hiranmaya-assignment.workers.dev/images/${imageUUID}`;
};

const getPostFromFormData = async (formData: FormData): Promise<Post> => {
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
  const users_string: string | null = await posts_kv.get("users");
  let users: string[];
  if (!users_string) {
    users = [];
  } else {
    users = JSON.parse(users_string);
  }
  return users;
};

const getPostFromJsonRequest = async (request: IttyRequest): Promise<Post> => {
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

const doAuth = async (post: Post, cookie: string | null): Promise<string> => {
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
      await posts_kv.put("users", JSON.stringify(users));
    } else {
      throw new AuthError("Unable to generate JWT for user");
    }
  }
  return setCookieString;
};

router.post("/posts", async (request) => {
  let post: Post | null = null;
  // @ts-expect-error headers
  console.log("The request headers are: ", request.headers);
  //  @ts-expect-error mdn clearly says the headers object exists
  const contentTypeHeader = request.headers.get("Content-Type");
  if (contentTypeHeader && contentTypeHeader.includes("multipart/form-data")) {
    try {
      const formData = await request.formData?.();
      post = await getPostFromFormData(formData);
    } catch (err) {
      if (err instanceof ImageUploadError) {
        return createErrorResponse("Image upload failed", 500, err.message);
      } else if (err instanceof FormDataError) {
        return createErrorResponse("Form data is invalid", 400, err.message);
      } else {
        return createErrorResponse("Internal Server Error", 500, `${err}`);
      }
    }
  } else {
    try {
      post = await getPostFromJsonRequest(request);
    } catch (err: unknown) {
      if (err instanceof InvalidJsonError) {
        return createErrorResponse("Invalid JSON", 400, err.message);
      } else {
        return createErrorResponse("Internal Server Error", 500, `${err}`);
      }
    }
  }

  // @ts-expect-error the headers object is defined
  const cookie: string | null = request.headers.get("Cookie");
  console.log("The cookie initially is: ", cookie);
  let setCookieString: string;
  try {
    setCookieString = await doAuth(post, cookie);
  } catch (err) {
    if (err instanceof AuthError) {
      return createErrorResponse("Unauthorised", 401, err.message);
    } else {
      return createErrorResponse("Internal Server Error", 500, `${err}`);
    }
  }
  try {
    if (!post.author) {
      post.author = {
        username: post.username,
        avatar: DEFAULT_AVATAR,
        name: post.username,
      };
    }
    if (!post.title) {
      post.title = post.content;
    }
    await postSchema.validate(post);
  } catch (err: unknown) {
    if (isValidationError(err)) {
      return createErrorResponse(
        "Invalid Json",
        400,
        `Schema error: ${err.errors[0]}`
      );
    } else {
      console.log({ err });
      return createErrorResponse(
        "Invalid Json",
        400,
        "Request json is invalid - JSON has an invalid structure"
      );
    }
  }

  if (!setCookieString) {
    return createErrorResponse("Invalid JWT", 401, "JWT is invalid");
  }

  try {
    // set the timestamp of the post to now
    post.timestamp = Temporal.Now.instant().toString();
    post.id = crypto.randomUUID();
    // replies are empty on first post
    post.replies = [];

    const stringPosts: string | null = await posts_kv.get("posts");
    const posts: Post[] = stringPosts ? JSON.parse(stringPosts) : [];

    posts.unshift(post);
    await posts_kv.put("posts", JSON.stringify(posts));
    console.log(
      `Successfully created a post, returning cookie string ${setCookieString}`
    );
    const response = createSuccessResponse(JSON.stringify(post), 201, {
      "Set-Cookie": setCookieString,
    });
    return response;
  } catch (err) {
    console.log(err);
    return createErrorResponse(
      "Internal Server Error",
      500,
      "Post call for KV errored out, request limits hit"
    );
  }
});

router.post("/posts/:id/replies", async (request) => {
  const { params } = request;
  if (!params || !params.id) {
    return createErrorResponse(
      "Invalid parameter",
      400,
      "ID parameter was not sent with the request"
    );
  }
  if (request.json === undefined) {
    return createErrorResponse(
      "Invalid Json",
      400,
      "JSON was not sent with the request"
    );
  }
  let reply: Reply | null = null;

  try {
    reply = await request.json();
  } catch {
    return createErrorResponse(
      "Invalid Json",
      400,
      "Request JSON is empty - JSON has an invalid structure"
    );
  }
  try {
    await replySchema.validate(reply);
  } catch (err: unknown) {
    if (isValidationError(err)) {
      return createErrorResponse(
        "Invalid Json",
        400,
        `Schema error: ${err.errors[0]}`
      );
    } else {
      console.log({ err });
      return createErrorResponse(
        "Invalid Json",
        400,
        "Request json is invalid - JSON has an invalid structure"
      );
    }
  }
  if (reply === null) {
    return createErrorResponse(
      "Invalid Json",
      400,
      "JSON is null - JSON has an invalid structure"
    );
  }
  try {
    // set the timestamp of the post to now
    reply.timestamp = Temporal.Now.instant().toString();
    reply.id = crypto.randomUUID();
    // replies are empty on first post

    const stringPosts: string | null = await posts_kv.get("posts");
    const posts: any[] = stringPosts ? JSON.parse(stringPosts) : [];

    const post = posts.find((p) => p.id === params.id);

    if (post === undefined) {
      return createErrorResponse(
        "Invalid Post ID",
        400,
        "The provided post id does not exist"
      );
    }

    // not happy with this, this is mutating and cofusing.
    // TODO: clean this up if possible
    post.replies.push(reply);

    await posts_kv.put("posts", JSON.stringify(posts));
    return createSuccessResponse(JSON.stringify(post), 201);
  } catch (err) {
    console.log(err);
    return createErrorResponse(
      "Internal Server Error",
      500,
      "Post call for KV errored out, request limits hit"
    );
  }
});

router.get("/images/:id", async (request) => {
  const { params } = request;

  if (!params) {
    return createErrorResponse("Bad request", 400, "Image id is required");
  }

  const imageWithMetada = await posts_kv.getWithMetadata(params.id, {
    type: "arrayBuffer",
  });

  const image = imageWithMetada.value;
  let type;
  if (imageWithMetada.metadata && (imageWithMetada.metadata as any).type) {
    type = (imageWithMetada.metadata as any).type;
  } else {
    type = "image/jpeg";
  }

  return new Response(image, {
    status: 200,
    headers: { "Content-Type": type, ...corsHeaders },
  });
});

router.all("*", () =>
  createErrorResponse(
    "URL Not Found",
    404,
    "Oops! You're looking for something that does not exist!"
  )
);

export { router };
