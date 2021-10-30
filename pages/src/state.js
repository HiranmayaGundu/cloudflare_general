import React from "react";

export const StateContext = React.createContext();

export const actions = {
  SELECT_POST: "SELECT_POST",
  DESELECT_POST: "DESELECT_POST",
  ADD_COMMENT: "ADD_COMMENT",
  LOAD_NEW_POSTS: "LOAD_NEW_POSTS",
  REMOVE_SHOW_NEW_POSTS: "SHOW_NEW_POSTS",
};

export const reducer = (state, action) => {
  switch (action.type) {
    case actions.SELECT_POST: {
      return { ...state, selectedPostId: action.payload.id };
    }
    case actions.DESELECT_POST: {
      return { ...state, selectedPostId: null, isPermalink: false };
    }
    case actions.LOAD_NEW_POSTS: {
      return { ...state, hasNewPosts: true };
    }
    case actions.REMOVE_SHOW_NEW_POSTS: {
      return {
        ...state,
        hasNewPosts: false,
      };
    }
    default:
      throw new Error();
  }
};

export const useState = () => {
  const context = React.useContext(StateContext);
  return context;
};
