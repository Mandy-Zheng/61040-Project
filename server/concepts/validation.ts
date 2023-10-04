import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";

export interface ValidationDoc extends BaseDoc {
  object: ObjectId;
  haveValidated: Array<ObjectId>;
  haveRefuted: Array<ObjectId>;
}

export default class ValidationConcept {
  public readonly users = new DocCollection<ValidationDoc>("users");

  async create(username: string, password: string) {}

  async validate(object: ObjectId, user: ObjectId) {}

  async refute(object: ObjectId, user: ObjectId) {}

  async undoVote(object: ObjectId, user: ObjectId) {}

  async getNetValidation(object: ObjectId) {}

  async delete(_id: ObjectId) {}
}
