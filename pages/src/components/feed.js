import { useRef, useEffect } from "react";
import { VStack, Button } from "@chakra-ui/react";
import { motion } from "framer-motion";

import { Header } from "./header";
import { Post } from "./post";
import { SelectedPost } from "./selected-post";
import { useState } from "../state";
import { POSTS_KEY, usePosts } from "../utils/data-fetching";
import { PostForm } from "../components/post-form";
import { useSWRConfig } from "swr";

export const Feed = () => {
  const {
    state: { selectedPostId, hasNewPosts },
    actions, dispatch
  } = useState();

  // should automatically get deduped request data
  const { posts } = usePosts();
  const { mutate } = useSWRConfig();

  const mainRef = useRef(null);
  useEffect(
    function scrollBack() {
      if (mainRef.current && !selectedPostId) {
        mainRef.current.scrollTo({ top: window.history.state?.scrollPosition });
      }
    },
    [selectedPostId]
  );

  return (
    <VStack sx={{ height: "100vh", overflow: "hidden" }}>
      <Header
        isHome={true}
        scrollTop={() => {
          mainRef.current.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        }}
      />

      <main
        ref={mainRef}
        style={{
          flexGrow: 1,
          overflow: "auto",
          paddingBottom: 100,
          position: "relative",
          width: "100%",
        }}
      >
        {hasNewPosts && (
          <Button
            as={motion.button}
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            size="sm"
            variant="link"
            colorScheme="teal"
            isFullWidth
            onClick={async () => {
              await mutate(POSTS_KEY);
              dispatch({ type: actions.REMOVE_SHOW_NEW_POSTS });
            }}
            style={{ backgroundColor: "blues.100", paddingY: 5 }}
          >
            load more posts
          </Button>
        )}
        <VStack
          as="ul"
          sx={{ maxWidth: 600, marginX: "auto", listStyleType: "none" }}
        >
          <PostForm />
          {posts.map((post) => (
            <motion.li
              layout
              key={post.id}
              data-id={post.id}
              style={{
                opacity: post.id === selectedPostId ? 0 : 1,
                width: "100%",
              }}
            >
              <Post
                post={post}
                onSelect={() => {
                  window.history.pushState(
                    { scrollPosition: mainRef.current.scrollTop },
                    null,
                    "/post/" + post.id
                  );
                }}
              />
            </motion.li>
          ))}
        </VStack>
        <SelectedPost />
      </main>
    </VStack>
  );
};
