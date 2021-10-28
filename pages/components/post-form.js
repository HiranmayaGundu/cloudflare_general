import {
  VStack,
  HStack,
  Avatar,
  Box,
  Textarea,
  Button,
  IconButton,
  Input,
} from "@chakra-ui/react";
import { FiImage } from "react-icons/fi";
import { useSWRConfig } from "swr";
import { produce } from "immer";
import { useState } from "../state.js";
import { API_URL, POSTS_KEY } from "../utils/data-fetching";

export const PostForm = () => {
  const {
    state: { user },
  } = useState();

  const { mutate } = useSWRConfig();

  return (
    <Box sx={{ width: "100%" }}>
      <VStack
        spacing={4}
        sx={{
          paddingX: 6,
          paddingTop: 6,
          paddingBottom: 4,
          borderBottom: "1px solid",
          borderColor: "gray.300",
          backgroundColoe: "white",
          ":hover": {
            cursor: "pointer",
            backgroundColor: "gray.200",
          },
          "&:first-child": {
            borderTopRadius: 2,
          },
        }}
        align="stretch"
        as="form"
        onSubmit={async (event) => {
          event.preventDefault();

          const content = event.target.newPost.value;
          const data = {
            username: user.username,
            author: {
              username: user.username,
              avatar: user.avatar,
              name: user.name,
            },
            title: content,
            content,
            timestamp: new Date(),
            replies: [],
            id: "new-post-id",
          };

          mutate(
            POSTS_KEY,
            produce((posts) => {
              posts.unshift(data);
            }),
            false
          );

          await mutate(POSTS_KEY, async (posts) => {
            try {
              const result = await fetch(`${API_URL}posts`, {
                method: "POST",
                body: JSON.stringify(data),
              });

              const updatedPost = JSON.parse(await result.json());

              const filterdPosts = produce(posts, (draft) => {
                draft.unshift(updatedPost);
              });

              return filterdPosts;
            } catch (err) {
              throw err;
            }
          });
        }}
      >
        <HStack justify="space-between" sx={{ width: "100%" }}>
          <HStack spacing={2} align="center">
            <Avatar src={user.avatar} size="md" />
            <span>{user.name}</span>
          </HStack>
        </HStack>

        <Box as="div" sx={{ whiteSpace: "pre-line" }}>
          <Textarea
            name="newPost"
            type="text"
            variant="unstyled"
            placeholder={`What's on your mind?`}
            autoComplete="off"
            size="lg"
          />
        </Box>
        <HStack justify="space-between">
          <Box>
            <Input
              accept="image/*"
              id="icon-button-file"
              type="file"
              sx={{ display: "none" }}
            />
            <label htmlFor="icon-button-file">
              <IconButton
                sx={{ cursor: "pointer" }}
                as="span"
                type="button"
                colorScheme="teal"
                icon={<FiImage />}
                aria-label="Upload an image"
              />
            </label>
          </Box>
          <Button type="submit" colorScheme="teal" variant="solid">
            Post
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};
