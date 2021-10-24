import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'
import { VStack, HStack, Avatar, Image, Text, Button, Box } from '@chakra-ui/react'
import { useState } from '../state.js';
import { ago } from "../utils.js";


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
            
            <Box as="div" style={post.style || { whiteSpace: 'pre-line' }}>{post.body}</Box>
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
                {post.embed.type === 'github' && (
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

const ReplyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
);

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);
