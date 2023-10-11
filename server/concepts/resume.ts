import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface ResumeDoc extends BaseDoc {
  author: ObjectId;
  name: string;
  field: string;
  work: Array<string>;
  school: Array<string>;
  initialRating: number;
}

export default class ResumeConcept {
  public readonly resumes = new DocCollection<ResumeDoc>("resumes");

  async create(author: ObjectId, name: string, work: Array<string>, school: Array<string>, field: string) {
    if (!name || !field || !work || !school) {
      throw new BadValuesError("Name, field, work, and school can't be undefined for resume");
    }
    const initialRating = work.length + 0.5 * school.length;
    const _id = await this.resumes.createOne({ author, name, field, work, school, initialRating });
    return { msg: "Resume Created Successfully!", resume: await this.resumes.readOne({ _id }) };
  }

  async getById(_id: ObjectId) {
    const resume = await this.resumes.readOne({ _id });
    if (resume === null) {
      throw new NotFoundError(`Resume ${_id} could not be found`);
    }
    return resume;
  }

  private async sanitizeUpdate(update: Partial<ResumeDoc>) {
    if (update.author !== undefined) {
      throw new NotAllowedError(`Not Allowed to edit author`);
    }
    if (update.initialRating !== undefined) {
      throw new NotAllowedError(`Not Allowed to edit initialRating`);
    }
    return update;
  }

  private async isAuthor(_id: ObjectId, author: ObjectId) {
    const res = await this.getById(_id);
    if (res.author.toString() !== author.toString()) {
      throw new NotAllowedError(`No access to edit resume`);
    }
  }

  async getByAuthor(author?: ObjectId) {
    if (author) {
      const userResumes = (await this.resumes.readMany({ author })) ?? [];
      return userResumes;
    }
    const allResume = await this.resumes.readMany({});
    return allResume;
  }

  async getByField(field: string) {
    return await this.resumes.readMany({ field });
  }

  async getByAuthorAndField(author: ObjectId, field: string) {
    return await this.resumes.readOne({ author, field });
  }

  async update(_id: ObjectId, author: ObjectId, update: Partial<ResumeDoc>) {
    const curResume = await this.getById(_id);
    await this.isAuthor(_id, author);
    const initialRating = (update.work?.length ?? curResume?.work.length ?? 0) + 0.5 * (update.school?.length ?? curResume?.school.length ?? 0);
    const safeUpdate = await this.sanitizeUpdate(update);
    const resumeUpdate = { ...safeUpdate, initialRating };
    await this.resumes.updateOne({ _id }, resumeUpdate);
    return { msg: "Resume updated successfully!" };
  }

  async delete(_id: ObjectId, author: ObjectId) {
    await this.isAuthor(_id, author);
    await this.resumes.deleteOne({ _id });
    return { msg: "Resume successfully deleted!" };
  }
}
