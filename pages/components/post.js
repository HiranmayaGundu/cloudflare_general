import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'
import { VStack, HStack, Avatar, Image, Text, Button, Box } from '@chakra-ui/react'
import { useState } from '../state.js';
import { ago } from "../utils/utils.js";
import { ReplyIcon } from './reply-icon';
import { CloseIcon } from './close-icon';


export const Post = ({ post, onSelect, isPermalink = false }) => {
  const {
    state: { selectedPostId },
    actions,
    dispatch,
  } = useState();

  const rootProps = isPermalink
    ? { as: 'div' }
    : {
      as: 'a',
      href: '#',
      onClick: () => {
        onSelect();
        dispatch({ type: actions.SELECT_POST, payload: { id: post.id } });
      },
    };

  useEffect(() => {
    const handler = (event) => {
      if (event.which === 27) dispatch({ type: actions.DESELECT_POST });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });
  return (
    <Box {...rootProps}>
      <VStack
        spacing={4}
        sx={{
          paddingX: 6,
          paddingTop: 6,
          paddingBottom: 4,
          borderBottom: '1px solid',
          borderColor: 'gray.300',
          backgroundColoe: 'white',
          ':hover': {
            cursor: isPermalink ? 'default' : 'pointer',
            backgroundColor: isPermalink ? 'white' : 'gray.200',
          },
          '&:first-child': {
            borderTopRadius: 2,
          },
        }}
        align="stretch"
      >
        <HStack justify="space-between" sx={{ width: '100%' }}>
          <HStack spacing={2} align="center">
            <Avatar src={post.author.avatar} size="sm" />
            <span>{post.author.name}</span>
          </HStack>

          <AnimatePresence>
            {isPermalink && selectedPostId && (
              <Button
                as={motion.button}
                variant="icon"
                onClick={() => dispatch({ type: actions.DESELECT_POST })}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.5 } }}
                exit={{ opacity: 0, transition: { duration: 0.01 } }}
                sx={{
                  paddingX: 0,
                  size: 10,
                  marginRight: -12,
                  marginTop: -4,
                }}
              >
                <CloseIcon />
              </Button>
            )}
          </AnimatePresence>
        </HStack>

        <Box as="div" style={post.style || { whiteSpace: 'pre-line' }}>{post.content}</Box>
        {post.embed && (
          <div>
            {post.embed.type === 'image' && (
              <Image
                src={post.embed.image}
                sx={{
                  maxHeight: '40vh',
                  width: '100%'
                }}
                objectFit="cover"
                borderRadius="sm"
              />
            )}
            {post.embed.type === 'link' && (
              <HStack
                as="a"
                href={post.embed.link.href}
                target="_blank"
                sx={{
                  padding: 3,
                  border: '1px solid',
                  borderRadius: 2,
                  marginTop: 4,
                  ':hover, :focus': {
                    backgroundColor: 'white',
                  },
                  borderColor: "gray.300",
                }}
                width="100%"
              >
                <Image width={12} height={12} src={post.embed.image} />
                <VStack justify="space-between">
                  <span>{post.embed.title}</span>
                  <Text color="gray.500">{post.embed.link.title}</Text>
                </VStack>
              </HStack>
            )}
          </div>
        )}

        <HStack justify="space-between" sx={{ paddingTop: 4 }}>
          <HStack href="/reply" align="center" spacing={1}>
            <ReplyIcon />
            {post.replies.length ? (
              <Text size={3}>{post.replies.length}</Text>
            ) : null}
          </HStack>

          <Text size={3}>{ago(post.timestamp)}</Text>
        </HStack>
      </VStack>
    </Box>
  );
}
