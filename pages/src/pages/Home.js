import { App } from "../components/app";
import { Feed } from "../components/feed";
import { SkeletonFeed } from "../components/skeleton-feed";
import { usePosts } from "../utils/data-fetching";

export default function Home(props) {
  const { isLoading, error } = usePosts();
  if (error) return <div>Failed to load data because {error.message}</div>;
  if (isLoading)
    return (
      <App {...props}>
        <SkeletonFeed />
      </App>
    );
  return (
    <App {...props}>
      <Feed />
    </App>
  );
}
