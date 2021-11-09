import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HEADER_HEIGHT } from "./header";
import { Post } from "./post";
import { Replies } from "./replies";
import { useState as useAppState } from "../state";
import { usePosts } from "../utils/data-fetching";

export const SelectedPost = () => {
  const {
    state: { selectedPostId, isPermalink },
    actions,
    dispatch,
  } = useAppState();

  const { posts } = usePosts();
  const [dragOffset, setDragOffset] = useState(0);

  let selectedPost = null;

  if (selectedPostId) {
    selectedPost = posts.find((post) => post.id === selectedPostId);
  }

  const postElement = document.querySelector(`[data-id="${selectedPostId}"]`);

  let initialY = 0;
  if (postElement) {
    const rect = postElement.getBoundingClientRect();
    initialY = rect.top - HEADER_HEIGHT;
  }

  return (
    <AnimatePresence
      initial={isPermalink ? false : true}
      onExitComplete={() => window.history.pushState(null, null, "/")}
    >
      {selectedPostId && (
        <section
          style={{
            position: "fixed",
            top: HEADER_HEIGHT,
            height: `calc(100% - ${HEADER_HEIGHT}px)`,
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <motion.article
            initial={{ y: initialY }}
            animate={{ y: 0, transition: { duration: 0.3, delay: 0.1 } }}
            exit={{ y: initialY, transition: { duration: 0.2 } }}
            style={{ zIndex: 2, width: "100%", maxWidth: 600 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragMomentum={false}
            onDrag={(_, info) => {
              setDragOffset(info.offset.y);
            }}
            onDragEnd={(_, info) => {
              setDragOffset(0);
              if (info.offset.y > 100 || info.offset.y < -100) {
                dispatch({ type: actions.DESELECT_POST });
              }
            }}
          >
            <Post post={selectedPost} isPermalink />
            <Replies />
          </motion.article>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1 - dragOffset / 1000,
              transition: { duration: 0.1 },
            }}
            exit={{
              opacity: 0,
              transition: { delay: 0.15, duration: 0.1 },
            }}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              background: "white",
              zIndex: 1,
            }}
          ></motion.div>
        </section>
      )}
    </AnimatePresence>
  );
};
