import { Fragment, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { produce } from "immer";
import {
  HStack,
  VStack,
  Avatar,
  Text,
  Input,
  VisuallyHidden,
} from "@chakra-ui/react";
import { useState as useAppState } from "../state";
import { ago } from "../utils/utils";
import { useSWRConfig } from "swr";
import { API_URL, POSTS_KEY, usePosts } from "../utils/data-fetching";

export const Replies = () => {
  const {
    state: { selectedPostId, user },
  } = useAppState();
  const { posts } = usePosts();
  const post = posts.find((p) => p.id === selectedPostId);
  const replies = post?.replies || [];

  const [hasFocus, setFocus] = useState(false);

  const { mutate } = useSWRConfig();

  if (!selectedPostId) {
    return <Fragment />;
  }

  return (
    <motion.section
      initial={{ height: 0, y: -40 }}
      animate={{
        height: "auto",
        y: 0,
        transition: { delay: 0.5, duration: 0.2 },
      }}
      exit={{ height: 0, transition: { duration: 0.2 } }}
      style={{ overflow: "hidden" }}
    >
      <VisuallyHidden>
        <span>Replies</span>
      </VisuallyHidden>
      <VStack
        as="ul"
        spacing={4}
        sx={{ paddingY: 8, paddingX: 6, listStyle: "none" }}
        align="stretch"
      >
        {replies.map((reply, index) => (
          <HStack
            as={motion.li}
            key={index}
            justify="space-between"
            align="center"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
          >
            <HStack align="center" spacing={2}>
              <HStack spacing={2} align="center">
                <Avatar src={reply.author.avatar} size="sm" />
                <Text variant="subtle">{reply.author.name}</Text>
              </HStack>
              <p style={{ paddingLeft: 4 }}>{reply.content}</p>
            </HStack>
            <Text color="gray.400" size={3}>
              {ago(reply.timestamp)}
            </Text>
          </HStack>
        ))}

        <li>
          <HStack>
            <HStack
              as="form"
              align="center"
              spacing={2}
              key={replies.length}
              onSubmit={async (event) => {
                event.preventDefault();

                const content = event.target.reply.value;
                const data = {
                  author: {
                    username: user.username,
                    avatar: user.avatar,
                    name: user.name,
                  },
                  content,
                  timestamp: new Date(),
                };

                mutate(
                  POSTS_KEY,
                  produce((posts) => {
                    posts
                      .find((p) => p.id === selectedPostId)
                      .replies.push(data);
                  }),
                  false
                );

                await mutate(POSTS_KEY, async (posts) => {
                  try {
                    const result = await fetch(
                      `${API_URL}posts/${selectedPostId}/replies`,
                      {
                        method: "POST",
                        body: JSON.stringify(data),
                      }
                    );

                    const updatedPost = JSON.parse(await result.json());

                    const filteredPosts = produce(posts, (draft) => {
                      const index = draft.findIndex(
                        (p) => p.id === selectedPostId
                      );
                      if (index !== -1) {
                        draft[index] = updatedPost;
                      }
                    });

                    return filteredPosts;
                  } catch (err) {
                    throw err;
                  }
                });
              }}
            >
              <Avatar src={user.avatar} size="sm" />
              <AnimatePresence initial={false}>
                {hasFocus && (
                  <HStack
                    align="center"
                    spacing={2}
                    as={motion.div}
                    initial={{ width: 0, x: -40 }}
                    animate={{ width: 36, x: 0 }}
                    exit={{ width: 0, x: -40 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden" }}
                  >
                    <Text color="gray.500">{user.name}</Text>
                  </HStack>
                )}
              </AnimatePresence>
              <Input
                name="reply"
                type="text"
                variant="unstyled"
                placeholder={`Reply to ${post.author.name}`}
                autoComplete="off"
                autoFocus
                sx={{ paddingX: 0, height: "32px" }}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
              />
            </HStack>
          </HStack>
        </li>
      </VStack>
    </motion.section>
  );
};
