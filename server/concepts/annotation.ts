import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError } from "./errors";

export interface AnnotationDoc extends BaseDoc {
  original: ObjectId;
  author: ObjectId;
  comment: string;
  quote: string;
}

export default class AnnotationConcept {
  public readonly annotations = new DocCollection<AnnotationDoc>("annotations");

  async create(original: ObjectId, author: ObjectId, comment: string, quote: string) {
    if (!comment || !quote) {
      throw new BadValuesError("Annotation must have a comment and quote");
    }
    const _id = await this.annotations.createOne({ original, author, comment, quote });
    return { msg: "Annotation successfully created!", annotation: await this.annotations.readOne({ _id }) };
  }

  async getById(_id: ObjectId) {
    const note = await this.annotations.readOne({ _id });
    if (note === null) {
      throw new NotAllowedError(`Cannot Find Annotation with id = ${_id}`);
    }
    return note;
  }

  async getByAuthor(author: ObjectId) {
    return await this.annotations.readMany({ author });
  }

  async getAnnotationCountByAuthor(author: ObjectId) {
    return await this.annotations.count({ author });
  }

  private async canEdit(annotation: AnnotationDoc, author: ObjectId) {
    if (annotation.author.toString() !== author.toString()) {
      throw new NotAllowedError(`Author ${author} had no access to edit annotation ${annotation._id}`);
    }
  }
  async sortedAnnotations(original: ObjectId) {
    const notes = await this.annotations.readMany({ original });
    return notes.sort((a, b) => a.dateUpdated.getTime() - b.dateUpdated.getTime());
  }

  async update(_id: ObjectId, author: ObjectId, update: Partial<AnnotationDoc>) {
    const safeUpdate = this.sanitizeUpdate(update);
    const annotation = await this.getById(_id);
    await this.canEdit(annotation, author);
    await this.annotations.updateOne({ _id }, safeUpdate);
    return { msg: "Annotation successfully updated!" };
  }

  async delete(_id: ObjectId, author: ObjectId) {
    const annotation = await this.getById(_id);
    await this.canEdit(annotation, author);
    await this.annotations.deleteOne({ _id });
    return { msg: "Annotation successfully deleted!" };
  }

  private sanitizeUpdate(update: Partial<AnnotationDoc>) {
    // eslint-disable-next-line
    const { original, author, ...rest } = update;
    if (update.author) {
      throw new NotAllowedError("Cannot Update Author");
    } else if (update.original) {
      throw new NotAllowedError("Cannot Change the Annnotation Target");
    }
    return rest;
  }
}
