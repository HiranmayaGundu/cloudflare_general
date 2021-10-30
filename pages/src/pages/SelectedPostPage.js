import { App } from "../components/app";
import { Feed } from "../components/feed";
import { useParams } from "react-router";

export default function SelectedPostPage() {
  const params = useParams();
  return (
    <App initialPostId={params.id}>
      <Feed />
    </App>
  );
}
