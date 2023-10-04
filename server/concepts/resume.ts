import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError, UnauthenticatedError } from "./errors";

export interface ResumeDoc extends BaseDoc {
  author: ObjectId;
  name: string;
  field: string;
  work: Array<string>;
  school: Array<string>;
  rating: number;
}

export default class ResumeConcept {
  public readonly resumes = new DocCollection<ResumeDoc>("resumes");

  async create(author: ObjectId, name: string, work: Array<string>, school: Array<string>, field: string) {
    const rating = work.length + 0.5 * school.length;
    const _id = await this.resumes.createOne({ author, name, field, work, school, rating });
    return { msg: "Resume Created Successfully!", resume: await this.resumes.readOne({ _id }) };
  }

  async isAuthor(_id: ObjectId, author: ObjectId) {
    const res = await this.resumes.readOne({ _id });
    if (res) {
      if (res.author.toString() !== author.toString()) {
        throw new NotAllowedError("No Access to Edit Resume");
      }
    } else {
      throw new NotFoundError("Can't find resume");
    }
  }

  async getByUser(author?: ObjectId) {
    if (author) {
      const userResumes = (await this.resumes.readMany({ author })) ?? [];
      return userResumes;
    }

    const allResume = await this.resumes.readMany({});
    return allResume;
  }

  async update(_id: ObjectId, update: Partial<ResumeDoc>) {
    if (update.author === undefined) {
      throw new UnauthenticatedError("Need to authenticate user to edit resume");
    }
    const curResume = await this.resumes.readOne({ _id });
    await this.isAuthor(_id, update.author);
    if (curResume) {
      const rating = (update.work?.length ?? curResume?.work.length ?? 0) + 0.5 * (update.school?.length ?? curResume?.school.length ?? 0);
      const resumeUpdate = { ...update, rating: rating };
      await this.isAuthor(_id, update.author);
      await this.resumes.updateOne({ _id }, resumeUpdate);
      return { msg: "Resume updated successfully!" };
    }
  }

  async delete(_id: ObjectId, author: ObjectId) {
    return await this.isAuthor(_id, author);
    // await this.resumes.deleteOne({ _id });
    // return { msg: "Resume successfully deleted!" };
  }
}
