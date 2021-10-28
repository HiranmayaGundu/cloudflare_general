import { Skeleton, SkeletonCircle, SkeletonText, Box, VStack, HStack, Text } from "@chakra-ui/react";
import { ReplyIcon } from './reply-icon';

export const SkeletonPost = () => (
  <Box as="div">
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
          <SkeletonCircle size="10" />
          <span><SkeletonText /></span>
        </HStack>

      </HStack>

      <Box as="div" style={{ whiteSpace: 'pre-line' }}>
        <SkeletonText mt="4" noOfLines={4} spacing="4" />
      </Box>

      <HStack justify="space-between" sx={{ paddingTop: 4 }}>
        <HStack href="/reply" align="center" spacing={1}>
          <ReplyIcon />
          <Skeleton>
            <Text size={3}>1</Text>
          </Skeleton>
        </HStack>

        <Skeleton>
          <Text size={3}>just now</Text>
        </Skeleton>
      </HStack>
    </VStack>
  </Box>
)