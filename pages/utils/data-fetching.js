import useSWR from "swr";
import { getFetcher } from "./utils";

export const API_URL = 'https://worker.hiranmaya-assignment.workers.dev/';


export const POSTS_KEY = `${API_URL}posts`;

export const usePosts = () => {
  const { data, error } = useSWR(POSTS_KEY, getFetcher);
  return {
    isLoading: !data,
    posts: data,
    error
  }
}