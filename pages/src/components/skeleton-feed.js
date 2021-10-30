import { VStack } from "@chakra-ui/react";
import { motion } from "framer-motion";

import { Header } from "./header";
import { SkeletonPost } from "./skeleton-post";
import { SelectedPost } from "./selected-post";
import { PostForm } from "../components/post-form";

export const SkeletonFeed = () => {
  return (
    <VStack sx={{ height: "100vh", overflow: "hidden" }}>
      <Header isHome={true} />

      <main
        style={{
          flexGrow: 1,
          overflow: "auto",
          paddingBottom: 100,
          position: "relative",
          width: "100%",
        }}
      >
        <VStack
          as="ul"
          sx={{ maxWidth: 600, marginX: "auto", listStyleType: "none" }}
        >
          <PostForm />
          <motion.li
            layout
            key={1}
            data-id={1}
            style={{ opacity: 1, width: "100%" }}
          >
            <SkeletonPost />
          </motion.li>
          <motion.li
            layout
            key={2}
            data-id={2}
            style={{ opacity: 1, width: "100%" }}
          >
            <SkeletonPost />
          </motion.li>
          <motion.li
            layout
            key={3}
            data-id={3}
            style={{ opacity: 1, width: "100%" }}
          >
            <SkeletonPost />
          </motion.li>
        </VStack>
        <SelectedPost />
      </main>
    </VStack>
  );
};
