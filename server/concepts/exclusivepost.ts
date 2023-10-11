import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface ExclusivePostDoc extends BaseDoc {
  author: ObjectId;
  audience: Array<string>;
  title: string;
  tags: Array<string>;
  content: string;
}

export default class ExclusivePostConcept {
  public readonly exclusiveposts = new DocCollection<ExclusivePostDoc>("posts");

  async createPost(author: ObjectId, title: string, content: string, audience: Array<string>, tags: Array<string>) {
    if (!title || !content || !audience || !tags) {
      throw new BadValuesError("Title, content, audience, and tags for post can't be undefined");
    }
    const _id = await this.exclusiveposts.createOne({ author, audience, title, content, tags });
    return { msg: "Post successfully created!", post: await this.exclusiveposts.readOne({ _id }) };
  }

  async getById(_id: ObjectId, viewer: ObjectId) {
    const post = await this.exclusiveposts.readOne({ _id });
    if (post === null) {
      throw new NotFoundError(`Cannot Find Post with id: ${_id}`);
    } else {
      if (!post.audience.includes(viewer.toString())) {
        throw new NotAllowedError(`User ${viewer} has no access to Post ${_id}`);
      }
    }
    return post;
  }

  async getByAuthor(author: ObjectId) {
    return await this.exclusiveposts.readMany({ author });
  }

  private async isAuthor(_id: ObjectId, author: ObjectId) {
    const post = await this.getById(_id, author);
    if (author.toString() !== post.author.toString()) {
      throw new PostAuthorNotMatchError(author, _id);
    }
  }

  async getAllViewable(viewer: string, author?: ObjectId) {
    const allPosts = author ? await this.exclusiveposts.readMany({ author }) : await this.exclusiveposts.readMany({});
    return allPosts.filter((post) => post.audience.includes(viewer));
  }

  async filterValidPosts(postIds: ObjectId[]) {
    const posts = await this.exclusiveposts.readMany({ _id: { $in: postIds } });
    return posts.map((post) => post._id);
  }

  async filterViewablePosts(allPostIds: ObjectId[], viewer: ObjectId) {
    const allPosts = await this.exclusiveposts.readMany({ _id: { $in: allPostIds } });
    return allPosts.filter((post) => post.audience.includes(viewer.toString()));
  }

  async delete(_id: ObjectId, author: ObjectId) {
    await this.isAuthor(_id, author);
    await this.exclusiveposts.deleteOne({ _id });
    return { msg: "Post deleted successfully!" };
  }
}

export class PostAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of post {1}!", author, _id);
  }
}
