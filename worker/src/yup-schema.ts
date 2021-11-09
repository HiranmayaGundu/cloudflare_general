import * as yup from "yup";

const imageEmbedSchema = yup.object().shape({
  type: yup.string().oneOf(["image"]),
  image: yup.string().defined("The image URL is required"),
});
const linkEmbed = yup.object().shape({
  type: yup.string().oneOf(["link"]),
  title: yup.string().defined(),
  image: yup.string(),
  link: yup.object().shape({
    title: yup.string().defined(),
    href: yup.string().defined(),
  }),
});
const embedValidation = yup.lazy((value) => {
  if (value) {
    const { type } = value;
    switch (type) {
      case "image":
        return imageEmbedSchema;
      case "link":
        return linkEmbed;
      default:
        // TODO: yup.mixed is incorrect here, we should throw an error saying that this
        //type of embed is unsupported.
        return yup.mixed();
    }
  }
  // case when there is no embed
  return yup.mixed();
});
const authorSchema = yup.object().shape({
  name: yup.string().defined("The name is required"),
  username: yup.string().defined("The username is required"),
  avatar: yup.string(),
});
export const replySchema = yup.object().shape({
  author: authorSchema.required("The author details are required"),
  content: yup.string().defined("The reply content is required"),
  timestamp: yup.string(),
  id: yup.string(),
});
export const postSchema = yup.object().shape({
  username: yup.string().defined("The username is required"),
  content: yup.string().defined("The content is required"),
  title: yup.string().defined("The title is required"),
  // not marking this as required since the date object that is
  // coming for a post call is thrown away anyway.
  id: yup.string(),
  timestamp: yup.date(),
  embed: embedValidation,
  author: authorSchema.required("The author details are required"),
  replies: yup.array(replySchema),
  style: yup.mixed(),
});
