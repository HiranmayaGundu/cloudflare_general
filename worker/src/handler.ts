import { Router } from "itty-router";
import * as yup from "yup";
import { Temporal } from "@js-temporal/polyfill";
// import extension of date
import "./extensions";

const router = Router();

interface ImageEmbed {
  type: "image";
  image: string;
}

interface LinkEmbed {
  type: "link";
  title: string;
  image?: string;
  link: {
    title: string;
    href: string;
  };
}

interface Author {
  name: string;
  username: string;
  avatar?: string;
}

interface Reply {
  author: Author;
  content: string;
  timestamp: string;
  id: string;
}

interface Post {
  username: string;
  content: string;
  title: string;
  embed?: LinkEmbed | ImageEmbed;
  timestamp?: string;
  author: Author;
  // ideally should be non null, but then I would have to start
  // creating different types for incoming and outgoing data.
  id?: string;
  replies: Reply[];
  // ideally should be HTML css type
  style?: any;
}

const imageEmbedSchema = yup.object().shape({
  type: yup.string().oneOf(["image"]),
  image: yup.string().defined("The image URL is required"),
});

const linkEmbed = yup.object().shape({
  type: yup.string().oneOf(["link"]),
  title: yup.string().defined(),
  image: yup.string(),
  link: yup.object().shape({
    title: yup.string().defined(),
    href: yup.string().defined(),
  }),
});

const embedValidation = yup.lazy((value) => {
  if (value) {
    const { type } = value;
    switch (type) {
      case "image":
        return imageEmbedSchema;
      case "link":
        return linkEmbed;
      default:
        // TODO: yup.mixed is incorrect here, we should throw an error saying that this
        //type of embed is unsupported.
        return yup.mixed();
    }
  }
  // case when there is no embed
  return yup.mixed();
});

const authorSchema = yup.object().shape({
  name: yup.string().defined("The name is required"),
  username: yup.string().defined("The username is required"),
  avatar: yup.string(),
});

const replySchema = yup.object().shape({
  author: authorSchema.required("The author details are required"),
  content: yup.string().defined("The reply content is required"),
  timestamp: yup.string(),
  id: yup.string(),
});

const postSchema = yup.object().shape({
  username: yup.string().defined("The username is required"),
  content: yup.string().defined("The content is required"),
  title: yup.string().defined("The title is required"),
  // not marking this as required since the date object that is
  // coming for a post call is thrown away anyway.
  id: yup.string(),
  timestamp: yup.date(),
  embed: embedValidation,
  author: authorSchema.required("The author details are required"),
  replies: yup.array(replySchema),
  style: yup.mixed(),
});

const isValidationError = (err: any): err is yup.ValidationError => {
  return err && err.name && err.name === "ValidationError";
};

const createErrorResponse = (
  message: string,
  status: number,
  additionalInformation?: string
) => {
  return new Response(JSON.stringify({ message, additionalInformation }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
};

const createSuccessResponse = (responseData: any, status: number = 200) => {
  return new Response(JSON.stringify(responseData), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
};

// temporarily allow my my requests to be served by any URL for testing against prod URL
// Todo: change to final URL=
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "*",
  "Access-Control-Allow-Headers": "*",
};

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
  console.log(file);
  // @ts-ignore
  const imageUUID = crypto.randomUUID();
  const fileBuffer = await file.arrayBuffer();
  await posts_kv.put(imageUUID, fileBuffer, { metadata: { type: file.type } });
  return `https://worker.hiranmaya-assignment.workers.dev/images/${imageUUID}`;
};

router.post("/posts", async (request) => {
  let post: Post | null = null;
  //  @ts-ignore mdn clearly says the headers object exists
  const contentTypeHeader = request.headers.get("Content-Type");
  if (contentTypeHeader && contentTypeHeader.includes("multipart/form-data")) {
    const formData = await request.formData?.();
    let url;
    try {
      url = await uploadImage(formData.get("image"));
    } catch (err) {
      return createErrorResponse(
        "Failed image uplaod",
        500,
        `ISE -Failed image upload ${err}`
      );
    }
    if (!formData) {
      return createErrorResponse(
        "Invalid Form data",
        400,
        "Form data was not sent with the request"
      );
    }
    post = {
      username: formData.get("username"),
      content: formData.get("content"),
      title: formData.get("title"),
      embed: {
        type: "image",
        image: url,
      },
      timestamp: Temporal.Now.instant().toString(),
      author: {
        username: formData.get("username"),
        avatar: formData.get("avatar"),
        name: formData.get("name"),
      },
      id: crypto.randomUUID(),
      replies: [],
    };
  } else {
    if (request.json === undefined) {
      console.log("not in here");
      return createErrorResponse(
        "Invalid Json",
        400,
        "JSON was not sent with the request"
      );
    }

    try {
      post = await request.json();
    } catch {
      return createErrorResponse(
        "Invalid Json",
        400,
        "Request JSON is empty - JSON has an invalid structure"
      );
    }
  }
  try {
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
  if (post === null) {
    return createErrorResponse(
      "Invalid Json",
      400,
      "JSON is null - JSON has an invalid structure"
    );
  }
  try {
    // set the timestamp of the post to now
    post.timestamp = Temporal.Now.instant().toString();
    post.id = crypto.randomUUID();
    // replies are empty on first post
    post.replies = [];

    const stringPosts: string | null = await posts_kv.get("posts");
    const posts: any[] = stringPosts ? JSON.parse(stringPosts) : [];

    posts.unshift(post);
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
        "The provided post id does not exsit"
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

async function sha1(fileData: ArrayBuffer) {
  const digest = await crypto.subtle.digest('SHA-1', fileData);
  const array = Array.from(new Uint8Array(digest));
  const sha1 = array.map(b => b.toString(16).padStart(2, '0')).join('')
  return sha1;
}

router.get("/images/:id", async (request) => {
  const { params } = request;

  if (!params) {
    return createErrorResponse("Bad request", 400, "Image id is required");
  }

  const imageWithMetada = await posts_kv.getWithMetadata(params.id, { type: 'arrayBuffer' });

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
