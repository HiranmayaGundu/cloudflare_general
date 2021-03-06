import { useReducer } from "react";
import { StateContext, reducer, actions } from "../state";
import { user } from "../data";

export const App = ({ initialPostId = null, children }) => {
  const initialState = {
    user,
    selectedPostId: initialPostId,
    isPermalink: initialPostId,
    hasNewPosts: false,
  };
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <StateContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </StateContext.Provider>
  );
};
