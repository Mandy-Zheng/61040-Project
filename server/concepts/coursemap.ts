import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, UnauthenticatedError } from "./errors";

export interface CourseMapDoc extends BaseDoc {
  items: Map<ObjectId, number>;
  author: ObjectId;
  tags: string;
}

export default class CourseMapConcept {
  public readonly coursemaps = new DocCollection<CourseMapDoc>("resumes");

  async create(author: ObjectId, items: Map<ObjectId, number>, tags: string) {
    await this.coursemaps.createOne({ author, items, tags });
    return { msg: "Course Map Created Successfully!" };
  }

  async canEdit(_id: ObjectId, author: ObjectId) {
    const coursemap = await this.coursemaps.readOne({ _id, author });
    if (coursemap === null) {
      throw new NotAllowedError("No Access to edit Course Map");
    }
  }

  //   async getCourseMapByTags(tags: Set<String>) {
  //     // pass
  //   }

  async update(_id: ObjectId, update: Partial<CourseMapDoc>) {
    //add algorithm
    if (update.author === undefined) {
      throw new UnauthenticatedError("Need to authenticate user to edit resume");
    }
    await this.canEdit(_id, update.author);
    await this.coursemaps.updateOne({ _id }, update);
    return { msg: "Course Map updated successfully!" };
  }

  async delete(_id: ObjectId, author: ObjectId) {
    await this.canEdit(_id, author);
    await this.coursemaps.deleteOne({ _id });
    return { msg: "User created successfully!" };
  }
}
