import {
  VStack,
  HStack,
  Avatar,
  Box,
  Textarea,
  Button,
  IconButton,
  Input,
  Image,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { FiImage } from "react-icons/fi";
import { useSWRConfig } from "swr";
import { produce } from "immer";
import { CloseIcon } from "./close-icon";
import { useState as useAppState } from "../state.js";
import { API_URL, POSTS_KEY } from "../utils/data-fetching";

export const PostForm = () => {
  const {
    state: { user },
  } = useAppState();

  const [imageState, setImageState] = useState();
  const [content, setContent] = useState();
  const fileInputRef = useRef();

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

          let dataToSend = null;
          let dataToAppend = null;

          if (imageState) {
            dataToAppend = {
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
              embed: {
                type: 'image',
                image: URL.createObjectURL(imageState)
              }
            };
            dataToSend = new FormData();
            dataToSend.append("username", user.username);
            dataToSend.append("avatar", user.avatar);
            dataToSend.append("name", user.name);
            dataToSend.append("title", content);
            dataToSend.append("content", content);
            dataToSend.append("timestamp", new Date());
            dataToSend.append("image", imageState);
          }
          else {
            dataToAppend = {
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
            dataToSend = JSON.stringify(dataToAppend);
          }

          mutate(
            POSTS_KEY,
            produce((posts) => {
              posts.unshift(dataToAppend);
            }),
            false
          );

          await mutate(POSTS_KEY, async (posts) => {
            try {
              const result = await fetch(`${API_URL}posts`, {
                method: "POST",
                body: dataToSend,
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
          setContent('');
          setImageState(null);
          fileInputRef.current.value = '';
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
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </Box>
        {imageState && (
          <Box>
            <Image
              src={URL.createObjectURL(imageState)}
              sx={{
                maxHeight: "40vh",
                width: "100%",
              }}
              objectFit="cover"
              borderRadius="sm"
            />
          </Box>
        )}
        <HStack justify="space-between">
          <HStack spacing={2}>
            <Input
              ref={fileInputRef}
              accept="image/*"
              id="icon-button-file"
              type="file"
              sx={{ display: "none", position: "absolute" }}
              onChange={(event) => {
                if (event.target.files[0].size > 24 * 100000) {
                  alert("The image is too big");
                } else {
                  setImageState(event.target.files[0]);
                }
              }}
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
            {imageState ? (
              <IconButton
                colorScheme="red"
                aria-label="Remove Image"
                icon={<CloseIcon />}
                onClick={() => {
                  setImageState(null);
                  fileInputRef.current.value = '';
                }}
              />
            ) : null}
          </HStack>
          <Button type="submit" colorScheme="teal" variant="solid">
            Post
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};
