import { App } from '../components/app';
import { Feed } from '../components/feed';

export default function Page(props) {
  return (
    <App {...props}>
      <Feed />
    </App>
  );
}