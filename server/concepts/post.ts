import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError, UnauthenticatedError } from "./errors";

export interface ExclusivePostOptions {
  backgroundColor?: string;
}

export interface ExclusivePostDoc extends BaseDoc {
  author: ObjectId;
  audience: Set<ObjectId>;
  tags: Set<string>;
  content: string;
}

export default class ExclusivePostConcept {
  public readonly posts = new DocCollection<ExclusivePostDoc>("posts");

  async createPost(author: ObjectId, content: string, audience: Set<ObjectId>, tags: Set<string>) {
    audience.add(author);
    const _id = await this.posts.createOne({ author, content, audience, tags });
    return { msg: "Post successfully created!", post: await this.posts.readOne({ _id }) };
  }

  async getPosts(query: Filter<ExclusivePostDoc>) {
    const posts = await this.posts.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return posts;
  }

  async getByAuthor(author: ObjectId) {
    return await this.getPosts({ author });
  }

  async isAuthor(_id: ObjectId, author: ObjectId) {
    const resume = await this.posts.readOne({ _id, author });
    if (resume === null) {
      throw new PostAuthorNotMatchError(_id, author);
    }
  }

  async update(_id: ObjectId, update: Partial<ExclusivePostDoc>) {
    this.sanitizeUpdate(update);
    if (update.author) {
      await this.isAuthor(_id, update.author);
      if (update.audience) {
        update.audience.add(update.author);
      }
      await this.posts.updateOne({ _id }, update);
      return { msg: "Post successfully updated!" };
    }
    throw new UnauthenticatedError("Need to authenticate user to edit post");
  }

  async delete(_id: ObjectId, author: ObjectId) {
    await this.isAuthor(_id, author);
    await this.posts.updateOne({ _id }, { author });
    return { msg: "Post deleted successfully!" };
  }

  private sanitizeUpdate(update: Partial<ExclusivePostDoc>) {
    // Make sure the update cannot change the author.
    const allowedUpdates = ["content", "tags", "audience"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
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
