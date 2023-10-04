import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";

export interface AnnotationDoc extends BaseDoc {
  original: ObjectId;
  author: ObjectId;
  comment: string;
  timestamp: Date;
  start: number;
  end: number;
}

export default class AnnotationConcept {
  public readonly posts = new DocCollection<AnnotationDoc>("posts");

  async create(original: ObjectId, author: ObjectId, comment: string, start: number, end: number) {}

  async sortedAnnotations(original: ObjectId) {}

  async update(_id: ObjectId, update: Partial<AnnotationDoc>) {
    this.sanitizeUpdate(update);
  }

  async delete(_id: ObjectId, author: ObjectId) {}

  private sanitizeUpdate(update: Partial<AnnotationDoc>) {}
}
