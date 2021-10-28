import { VStack, HStack, Avatar, Box, Input } from '@chakra-ui/react'
import { useState } from '../state.js';


export const PostForm = () => {

  const { state: { user } } = useState();

  return (
    <Box sx={{ width: "100%" }}>
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
            cursor: 'pointer',
            backgroundColor: 'gray.200',
          },
          '&:first-child': {
            borderTopRadius: 2,
          },
        }}
        align="stretch"
      >
        <HStack justify="space-between" sx={{ width: '100%' }}>
          <HStack spacing={2} align="center">
            <Avatar src={user.avatar} size="md" />
            <span>{user.name}</span>
          </HStack>
        </HStack>

        <Box as="div" sx={{ whiteSpace: 'pre-line' }}>
          <Input
            name="newPost"
            type="text"
            variant="unstyled"
            placeholder={`What's on your mind?`}
            autoComplete="off"
            size="lg"
          />
        </Box>

      </VStack>
    </Box>
  );
}
