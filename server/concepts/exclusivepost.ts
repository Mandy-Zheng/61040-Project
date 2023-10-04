import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface ExclusivePostDoc extends BaseDoc {
  author: ObjectId;
  audience: Array<ObjectId>;
  title: String;
  tags: Array<string>;
  content: string;
}

export default class ExclusivePostConcept {
  public readonly exclusiveposts = new DocCollection<ExclusivePostDoc>("posts");

  async createPost(author: ObjectId, title: string, content: string, audience: Array<ObjectId>, tags: Array<string>) {
    const _id = await this.exclusiveposts.createOne({ author, audience, title, content, tags });
    return { msg: "Post successfully created!", post: await this.exclusiveposts.readOne({ _id }) };
  }

  async getViewableByAuthor(user: ObjectId, author: ObjectId) {
    const allPosts = await this.exclusiveposts.readMany({ author });
    const viewablePosts = [];
    for (const post of allPosts) {
      for (const member of post.audience) {
        if (member.toString() === user.toString()) {
          viewablePosts.push(post);
        }
      }
    }
    return viewablePosts;
  }

  async getAllViewable(user: ObjectId) {
    const allPosts = await this.exclusiveposts.readMany({});
    const viewablePosts: Array<ExclusivePostDoc> = [];
    if (!allPosts) {
      return viewablePosts;
    }
    for (const post of allPosts) {
      for (const member of post.audience) {
        if (member.toString() === user.toString()) {
          viewablePosts.push(post);
        }
      }
    }
    return viewablePosts;
  }

  async isAuthor(_id: ObjectId, author: ObjectId) {
    const post = await this.exclusiveposts.readOne({ _id });
    if (post === null) {
      throw new NotFoundError("Post not found");
    } else {
      if (author.toString() !== post.author.toString()) {
        throw new PostAuthorNotMatchError(_id, author);
      }
    }
  }

  async updateAudience(_id: ObjectId, author: ObjectId, audience: Array<ObjectId>) {
    await this.isAuthor(_id, author);
    await this.exclusiveposts.updateOne({ _id: _id }, { audience: audience });
    return { msg: "Post Audience successfully updated!" };
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
