import { HStack, Image, Box } from "@chakra-ui/react";
import { useState as useAppState } from "../state";

export const HEADER_HEIGHT = 68;

export const Header = ({ isHome = false, scrollTop }) => {
  const { state, actions, dispatch } = useAppState();

  return (
    <Box
      as="header"
      sx={{
        height: HEADER_HEIGHT,
        background: "white",
        paddingY: 5,
        borderBottom: "1px solid",
        zIndex: 2,
        borderColor: "gray.300",
      }}
      width="100%"
    >
      <HStack
        as="a"
        justify="center"
        href="#"
        sx={{
          opacity: 0.5,
          cursor: "pointer",
          ":hover, :focus": !isHome && {
            opacity: 1,
            transform: "scale(1.05)",
          },
        }}
        onClick={() => {
          if (state.selectedPostId) dispatch({ type: actions.DESELECT_POST });
          else {
            scrollTop();
            setTimeout(() => {
              dispatch({ type: actions.LOAD_NEW_POSTS });
            }, 750);
          }
        }}
      >
        <Image width="200px" src="/logo.png" />
      </HStack>
    </Box>
  );
};
