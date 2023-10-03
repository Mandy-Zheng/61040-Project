import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError, UnauthenticatedError } from "./errors";

export interface ResumeDoc extends BaseDoc {
  author: ObjectId;
  name: string;
  field: Set<string>;
  work: Set<string>;
  school: Set<string>;
  rating: number;
}

export default class ResumeConcept {
  public readonly resumes = new DocCollection<ResumeDoc>("resumes");

  async create(author: ObjectId, name: string, work: Set<string>, school: Set<string>, field: Set<string>) {
    const rating = work.size + 0.5 * school.size;
    await this.resumes.createOne({ author, name, field, work, school, rating });
    return { msg: "Resume Created Successfully!" };
  }

  async isAuthor(_id: ObjectId, author: ObjectId) {
    const resume = await this.resumes.readOne({ _id, author });
    if (resume === null) {
      throw new NotAllowedError("No Access to Edit Resume");
    }
  }

  async getResumeByUser(_id: ObjectId) {
    const userResumes = await this.resumes.readMany({ _id });
    if (userResumes === null) {
      throw new NotFoundError(`No Resume Found!`);
    }
    return userResumes.map(this.sanitizeResume);
  }

  async update(_id: ObjectId, update: Partial<ResumeDoc>) {
    if (update.author === undefined) {
      throw new UnauthenticatedError("Need to authenticate user to edit resume");
    }
    const curResume = await this.resumes.readOne({ _id });
    await this.isAuthor(_id, update.author);
    if (curResume) {
      const rating = (update.work?.size ?? curResume?.work.size ?? 0) + 0.5 * (update.school?.size ?? curResume?.school.size ?? 0);
      const resumeUpdate = { ...update, rating: rating };
      await this.isAuthor(_id, update.author);
      await this.resumes.updateOne({ _id }, resumeUpdate);
      return { msg: "Resume updated successfully!" };
    }
  }

  async delete(_id: ObjectId, author: ObjectId) {
    await this.isAuthor(_id, author);
    await this.resumes.deleteOne({ _id });
    return { msg: "Resume successfully deleted!" };
  }

  private sanitizeResume(resume: ResumeDoc) {
    // eslint-disable-next-line
    const { author, ...rest } = resume; // remove password
    return rest;
  }
}
