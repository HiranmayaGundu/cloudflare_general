import { Router } from "itty-router";
import * as yup from "yup";

const router = Router();

interface Post {
  username: string;
  content: string;
  title: string;
}

const postSchema: yup.SchemaOf<Post> = yup.object().shape({
  username: yup.string().required("The username is required"),
  content: yup.string().required("The content is required"),
  title: yup.string().required("The title is required"),
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
    headers: { "Content-Type": "application/json" },
  });
};

const createSuccessResponse = (responseData: any) => {
  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

router.get("/posts", async (request) => {
  const limitString: string | null = request.query?.number || null;
  const offsetString: string | null = request.query?.offset || null;

  let limit: undefined | number = undefined;
  if (limitString) {
    limit = parseInt(limitString, 10);
  }
  const offset = offsetString ? 0 : parseInt(limitString as string, 10);

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
  } catch {
    return createErrorResponse(
      "Internal Server Error",
      500,
      "Get call for KV errored out, request limits hit"
    );
  }
});

router.post("/posts", async (request) => {
  console.log("hello, world!");
  if (request.json === undefined) {
    console.log("not in here");
    return createErrorResponse(
      "Invalid Json",
      400,
      "JSON was not sent with the request"
    );
  }
  let post: Post | null = null;

  try {
    post = await request.json();
  } catch {
    return createErrorResponse(
      "Invalid Json",
      400,
      "JSON has an invalid structure"
    );
  }
  try {
    const result = await postSchema.validate(post);
    console.log("resut is: ", result);
  } catch (err: unknown) {
    if (isValidationError(err)) {
      return createErrorResponse(
        "Invalid Json",
        400,
        `Schema error: ${err.errors[0]}`
      );
    } else {
      return createErrorResponse(
        "Invalid Json",
        400,
        "JSON has an invalid structure"
      );
    }
  }
  try {
    const posts: any = (await posts_kv.get("posts")) || [];
    posts.push(post);
    await posts_kv.put("posts", posts);
    return new Response("", { status: 201 });
  } catch {
    return createErrorResponse(
      "Internal Server Error",
      500,
      "Post call for KV errored out, request limits hit"
    );
  }
});

router.all("*", () =>
  createErrorResponse(
    "URL Not Found",
    404,
    "Oops! You're looking for something that does not exist!"
  )
);

export { router };
