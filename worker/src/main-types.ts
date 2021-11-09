interface ImageEmbed {
  type: "image";
  image: string;
}
interface LinkEmbed {
  type: "link";
  title: string;
  image?: string;
  link: {
    title: string;
    href: string;
  };
}
interface Author {
  name: string;
  username: string;
  avatar?: string;
}
export interface Reply {
  author: Author;
  content: string;
  timestamp: string;
  id: string;
}
export interface Post {
  username: string;
  content: string;
  title: string;
  embed?: LinkEmbed | ImageEmbed;
  timestamp?: string;
  author: Author;
  // ideally should be non null, but then I would have to start
  // creating different types for incoming and outgoing data.
  id?: string;
  replies: Reply[];
  // ideally should be HTML css type
  style?: any;
}
