import { useRef, useEffect } from 'react';
import { VStack, Button } from '@chakra-ui/react';
import { motion } from 'framer-motion';

import { Header } from './header';
import { Post } from './post';
import { SelectedPost } from './selected-post';
import { useState } from '../state';

export const Feed = () => {
  const {
    state: { posts, selectedPostId, hasNewPosts },
    dispatch,
    actions,
  } = useState();

  const mainRef = useRef(null);
  useEffect(
    function scrollBack() {
      if (mainRef.current && !selectedPostId) {
        mainRef.current.scrollTo({ top: history.state?.scrollPosition });
      }
    },
    [selectedPostId]
  );

  return (
    <VStack sx={{ height: '100vh', overflow: 'hidden' }}>
      <Header
        isHome={true}
        scrollTop={() => {
          mainRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }}
      />

      <main
        ref={mainRef}
        style={{
          flexGrow: 1,
          overflow: 'auto',
          paddingBottom: 100,
          position: 'relative',
          width: '100%'
        }}
      >
        {hasNewPosts && (
          <Button
            as={motion.button}
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            size="sm"
            variant="link"
            colorScheme="teal"
            isFullWidth
            onClick={() => dispatch({ type: actions.SHOW_NEW_POSTS })}
            style={{ backgroundColor: 'blues.100', paddingY: 5 }}
          >
            load more posts
          </Button>
        )}
        <VStack
          as="ul"
          sx={{ maxWidth: 600, marginX: 'auto', listStyleType: 'none' }}
        >
          {posts.map((post) => (
            <motion.li
              layout
              key={post.id}
              data-id={post.id}
              style={{ opacity: post.id === selectedPostId ? 0 : 1, width: '100%' }}
            >
              <Post
                post={post}
                onSelect={() => {
                  history.pushState(
                    { scrollPosition: mainRef.current.scrollTop },
                    null,
                    '/post/' + post.id
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
